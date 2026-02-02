
import pool from '../config/database.js';
import axios from 'axios';

// Configuração Local do Loopback (Assume localhost na porta definida)
const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;

/**
 * MATH ENGINE: Fórmula de Haversine
 * Calcula distância em KM entre dois pontos (lat/lng)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
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

/**
 * PROCESSADOR DE ALERTA MASSIVO (Watchdog Trigger)
 * Retorna estatísticas de alcance.
 */
const triggerGeoAlert = async (incidentId, incidentData, adminUser) => {
    const { title, description, priority, coordinates, radius, location, whatsapp_template_id } = incidentData;
    
    // Filtro de Severidade: Apenas Nível 3 e 4 disparam broadcast automático
    if (!String(priority).includes('NÍVEL 3') && !String(priority).includes('NÍVEL 4')) {
        return { triggered: false, count: 0 };
    }
    if (!coordinates || !radius || radius <= 0) {
        return { triggered: false, count: 0 };
    }

    const incidentCoords = parseCoords(coordinates);
    if (!incidentCoords) return { triggered: false, count: 0 };

    console.log(`[WATCHDOG] Iniciando varredura de perímetro para Incidente #${incidentId} (Raio: ${radius}km)`);

    try {
        // 1. Buscar todos os usuários ativos com coordenadas
        const [users] = await pool.query(
            "SELECT id, name, phone, coordinates, unit FROM users WHERE active = 1 AND coordinates IS NOT NULL AND phone IS NOT NULL"
        );

        // 2. Filtrar usuários dentro do raio (Geofence)
        const affectedUsers = users.filter(user => {
            const userCoords = parseCoords(user.coordinates);
            if (!userCoords) return false;
            const dist = calculateDistance(incidentCoords.lat, incidentCoords.lng, userCoords.lat, userCoords.lng);
            return dist <= parseFloat(radius);
        });

        if (affectedUsers.length === 0) {
            console.log(`[WATCHDOG] Nenhum morador localizado no raio de ${radius}km.`);
            return { triggered: true, count: 0 };
        }

        const userIds = affectedUsers.map(u => u.id);
        const alertLevel = String(priority).includes('NÍVEL 4') ? '🚨 CRÍTICO' : '⚠️ ALERTA';

        // 3. Montar a mensagem (Template ou Padrão)
        let messageBody = '';
        let templateIdToUse = null;

        if (whatsapp_template_id) {
            // Se um template foi selecionado, buscar conteúdo e substituir tags de incidente
            const [[tpl]] = await pool.query('SELECT content, id FROM message_templates WHERE id = ?', [whatsapp_template_id]);
            if (tpl) {
                // Substituição de variáveis do incidente (user tags like {nome} are handled by communicationController later)
                messageBody = tpl.content
                    .replace(/{titulo}/gi, title || '')
                    .replace(/{local}/gi, location || '')
                    .replace(/{descricao}/gi, description || '')
                    .replace(/{severidade}/gi, priority || '');
                
                // Set template ID to pass media and other configs if needed by the scheduler
                templateIdToUse = tpl.id; 
            }
        }

        // Fallback se não houver template ou falhar
        if (!messageBody) {
            messageBody = `*${alertLevel}: OCORRÊNCIA NA ÁREA*\n\n` +
                `*Evento:* ${title}\n` +
                `*Local:* ${location}\n` +
                `*Detalhes:* ${description || 'Siga os protocolos de segurança.'}\n\n` +
                `_Você está na zona de notificação (${radius}km)._`;
        }

        // 4. Enfileirar Broadcast
        // Insere na fila de agendamento com status PENDING. 
        // O Cronjob do sistema pegará esses registros e usará o communicationController para envio real.
        
        for (const uid of userIds) {
             await pool.query(
                'INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, template_id, scheduled_at, status) VALUES (?, "USER", ?, ?, ?, NOW(), "PENDING")',
                [adminUser.id, uid, messageBody, templateIdToUse]
            );
        }

        console.log(`[WATCHDOG] ${affectedUsers.length} Alertas enfileirados com sucesso usando template ${templateIdToUse || 'STANDARD'}.`);

        // Auditoria
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "WATCHDOG_TRIGGER", "incidents", ?, ?)',
            [adminUser.id, incidentId, `Disparo geo-fenced para ${affectedUsers.length} membros. Template: ${whatsapp_template_id || 'N/A'}`]
        );

        return { triggered: true, count: affectedUsers.length };

    } catch (e) {
        console.error("[WATCHDOG FAIL]", e);
        return { triggered: false, count: 0, error: e.message };
    }
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
        // Remove campo que não é coluna direta da tabela (é usado só no trigger)
        const tplId = payload.whatsapp_template_id;
        delete payload.whatsapp_template_id;

        if (payload.coordinates && typeof payload.coordinates === 'object') {
            payload.coordinates = JSON.stringify(payload.coordinates);
        }
        
        const [result] = await pool.query("INSERT INTO incidents SET ?", [payload]);
        const incidentId = result.insertId;

        // Restore template ID for the trigger function
        req.body.whatsapp_template_id = tplId;

        // SRE SYNC: Aguarda o processamento do trigger para informar o alcance na resposta
        const alertStats = await triggerGeoAlert(incidentId, req.body, req.user);

        res.json({ 
            id: incidentId, 
            success: true,
            alert_triggered: alertStats.triggered,
            affected_users: alertStats.count
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = { ...req.body };
        // Remove campo auxiliar
        const tplId = payload.whatsapp_template_id;
        delete payload.whatsapp_template_id;

        if (payload.coordinates && typeof payload.coordinates === 'object') {
            payload.coordinates = JSON.stringify(payload.coordinates);
        }
        delete payload.id;
        delete payload.created_at;

        await pool.query("UPDATE incidents SET ? WHERE id = ?", [payload, id]);

        // Restore for trigger
        req.body.whatsapp_template_id = tplId;

        // No update também verificamos se a severidade aumentou para disparar alerta
        const alertStats = await triggerGeoAlert(id, req.body, req.user);

        res.json({ 
            success: true,
            alert_triggered: alertStats.triggered,
            affected_users: alertStats.count
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteIncident = async (req, res) => {
    try {
        await pool.query("DELETE FROM incidents WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
