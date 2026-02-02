
import pool from '../config/database.js';

// Marketplace Handlers
export const getMarketplace = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM marketplace_items ORDER BY id DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createMarketplaceItem = async (req, res) => {
    try {
        const payload = { ...req.body, merchant_id: req.user.id };
        const [result] = await pool.query("INSERT INTO marketplace_items SET ?", [payload]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// Reservations Handlers
export const getReservations = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, u.name as userName 
            FROM reservations r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.date DESC
        `);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createReservation = async (req, res) => {
    try {
        const payload = { ...req.body, user_id: req.user.id };
        const [result] = await pool.query("INSERT INTO reservations SET ?", [payload]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteReservation = async (req, res) => {
    try {
        // ADMIN pode deletar qualquer um, RESIDENT só o seu
        const q = req.user.role === 'ADMIN' ? 
            'DELETE FROM reservations WHERE id = ?' : 
            'DELETE FROM reservations WHERE id = ? AND user_id = ?';
        const params = req.user.role === 'ADMIN' ? [req.params.id] : [req.params.id, req.user.id];
        
        await pool.query(q, params);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// Suggestions (Ouvidoria) Handlers
export const getSuggestions = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT s.*, u.name as userName FROM suggestions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.id DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createSuggestion = async (req, res) => {
    try {
        const payload = { ...req.body, user_id: req.user.id };
        const [result] = await pool.query("INSERT INTO suggestions SET ?", [payload]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
