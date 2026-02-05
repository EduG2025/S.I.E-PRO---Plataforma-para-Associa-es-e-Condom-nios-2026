
import pool from '../config/database.js';
import axios from 'axios';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const parseCoords = (c) => {
    if (!c) return null;
    try {
        const parsed = typeof c === 'string' ? JSON.parse(c) : c;
        const lat = parseFloat(parsed.lat);
        const lng = parseFloat(parsed.lng || parsed.lon);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    } catch { return null; }
};

const triggerGeoAlert = async (incidentId, incidentData, adminUser) => {
    const { title, description, priority, coordinates, radius, location, whatsapp_template_id } = incidentData;
    
    if (!String(priority).includes('NÍVEL 3') && !String(priority).includes('NÍVEL 4')) return { triggered: false, count: 0 };
    if (!coordinates || !radius || radius <= 0) return { triggered: false, count: 0 };

    const incidentCoords = parseCoords(coordinates);
    if (!incidentCoords) return { triggered: false, count: 0 };

    try {
        const [users] = await pool.query("SELECT id, name, phone, coordinates FROM users WHERE active = 1 AND coordinates IS NOT NULL AND phone IS NOT NULL");

        const affectedUsers = users.filter(user => {
            const userCoords = parseCoords(user.coordinates);
            if (!userCoords) return false;
            return calculateDistance(incidentCoords.lat, incidentCoords.lng, userCoords.lat, userCoords.lng) <= parseFloat(radius);
        });

        if (affectedUsers.length === 0) return { triggered: true, count: 0 };

        for (const uid of affectedUsers) {
             const message = `*🚨 ALERTA WATCHDOG*\n\n*Evento:* ${title}\n*Severidade:* ${priority}\n*Detalhes:* ${description || 'Siga os protocolos.'}`;
             await pool.query('INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, scheduled_at, status) VALUES (?, "USER", ?, ?, NOW(), "PENDING")', [adminUser.id, uid.id, message]);
        }

        return { triggered: true, count: affectedUsers.length };
    } catch (e) { return { triggered: false, count: 0 }; }
};

export const getAllIncidents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM incidents ORDER BY created_at DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createIncident = async (req, res) => {
    try {
        const payload = { ...req.body };
        const tplId = payload.whatsapp_template_id;
        delete payload.whatsapp_template_id;
        if (payload.coordinates) payload.coordinates = JSON.stringify(payload.coordinates);
        
        const [result] = await pool.query("INSERT INTO incidents SET ?", [payload]);
        await triggerGeoAlert(result.insertId, req.body, req.user);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = { ...req.body };
        if (payload.coordinates) payload.coordinates = JSON.stringify(payload.coordinates);
        delete payload.id; delete payload.created_at;
        await pool.query("UPDATE incidents SET ? WHERE id = ?", [payload, id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteIncident = async (req, res) => {
    try {
        await pool.query("DELETE FROM incidents WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
