import pool from '../config/database.js';

/**
 * S.I.E PRO - Generic CRUD Factory v2.8.2
 */
export const createHandlers = (table) => ({
    getAll: async (req, res) => {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
            res.json({ data: rows });
        } catch (e) { res.status(500).json({ error: `SRE_FETCH_FAIL: ${e.message}` }); }
    },
    getOne: async (req, res) => {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
            if (!rows.length) return res.status(404).json({ error: 'RECORD_NOT_FOUND' });
            res.json(rows[0]);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    create: async (req, res) => {
        try {
            const payload = { ...req.body };
            for (const key in payload) {
                if (payload[key] !== null && typeof payload[key] === 'object') {
                    payload[key] = JSON.stringify(payload[key]);
                }
            }
            const [result] = await pool.query(`INSERT INTO ${table} SET ?`, [payload]);
            if (req.user) {
                await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "CREATE", ?, ?, ?)',
                    [req.user.id, table, result.insertId, JSON.stringify(req.body)]);
            }
            res.json({ id: result.insertId, success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    update: async (req, res) => {
        try {
            const { id, created_at, updated_at, ...rawPayload } = req.body;
            const payload = {};

            const allowedFieldsMap = {
                'users': [
                    'name', 'username', 'email', 'role', 'status', 'active', 'unit', 'age', 'phone',
                    'avatar_url', 'socialData', 'coordinates', 'address', 'profession', 'password_hash', 'rg', 'issuing_authority',
                    'birth_date', 'gender', 'nationality', 'whatsapp', 'preferred_channel',
                    'document_front_url', 'document_back_url', 'ocr_payload', 'voting_rights',
                    'resident_type', 'created_by', 'parent_id', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state'
                ],
                'financials': ['user_id', 'description', 'amount', 'type', 'category', 'status', 'is_recurring', 'billing_cycle', 'date'],
                'incidents': ['title', 'location', 'priority', 'status', 'description', 'radius', 'coordinates', 'reporter_name'],
                'ai_keys': ['label', 'key_value', 'provider', 'status', 'priority', 'error_count', 'model', 'tier'],
                'marketplace_items': ['title', 'description', 'category', 'price', 'whatsapp', 'merchant_id']
            };

            const allowed = allowedFieldsMap[table] || Object.keys(rawPayload);

            for (const key of allowed) {
                if (rawPayload[key] !== undefined) {
                    if (rawPayload[key] !== null && typeof rawPayload[key] === 'object') {
                        payload[key] = JSON.stringify(rawPayload[key]);
                    } else {
                        payload[key] = rawPayload[key];
                    }
                }
            }

            if (Object.keys(payload).length === 0) return res.json({ success: true });

            await pool.query(`UPDATE ${table} SET ? WHERE id = ?`, [payload, req.params.id]);

            if (req.user) {
                await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "UPDATE", ?, ?, ?)',
                    [req.user.id, table, req.params.id, JSON.stringify(payload)]);
            }
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },
    delete: async (req, res) => {
        try {
            await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
            if (req.user) {
                await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "DELETE", ?, ?, "REGISTRO REMOVIDO")',
                    [req.user.id, table, req.params.id]);
            }
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }
});