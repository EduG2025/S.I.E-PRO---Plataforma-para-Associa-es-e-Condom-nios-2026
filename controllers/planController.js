import pool from '../config/database.js';

export const getAllPlans = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM plans WHERE active = 1 ORDER BY price ASC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createPlan = async (req, res) => {
    try {
        const [result] = await pool.query("INSERT INTO plans SET ?", [req.body]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updatePlan = async (req, res) => {
    try {
        await pool.query("UPDATE plans SET ? WHERE id = ?", [req.body, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deletePlan = async (req, res) => {
    try {
        await pool.query("UPDATE plans SET active = 0 WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getSubscriptions = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, p.name as plan_name, u.name as user_name 
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getMySubscription = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, p.name as plan_name, p.price, p.description, p.billing_cycle
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
        `, [req.user.id]);
        res.json({ data: rows[0] || null });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getUserSubscription = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, p.name as plan_name, p.price, p.description, p.billing_cycle
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
        `, [req.params.id]);
        res.json({ data: rows[0] || null });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const subscribeUser = async (req, res) => {
    const { user_id, plan_id } = req.body;
    try {
        await pool.query("UPDATE subscriptions SET status = 'inactive' WHERE user_id = ?", [user_id]);
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        const [result] = await pool.query(`
            INSERT INTO subscriptions (user_id, plan_id, status, start_date, next_billing_date)
            VALUES (?, ?, 'active', CURDATE(), ?)
        `, [user_id, plan_id, nextBilling]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
