
import pool from '../config/database.js';

const handleError = (res, error) => {
    console.error("🛡️ [SRE GOV ERROR]", error);
    res.status(500).json({ error: "ERRO_INTERNO_KERN_GOVERNANCE" });
};

export const getAssemblies = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM assemblies ORDER BY date DESC");
        res.json({ data: rows });
    } catch (e) { handleError(res, e); }
};

export const createAssembly = async (req, res) => {
    try {
        const { title, date, location, description } = req.body;
        const [result] = await pool.query(
            "INSERT INTO assemblies (title, date, location, description) VALUES (?, ?, ?, ?)", 
            [title, date, location, description]
        );
        res.status(201).json({ id: result.insertId, success: true });
    } catch (e) { handleError(res, e); }
};

export const updateAssembly = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE assemblies SET ? WHERE id = ?", [req.body, id]);
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};

export const deleteAssembly = async (req, res) => {
    try {
        await pool.query("DELETE FROM assemblies WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};

export const getDocuments = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM documents ORDER BY updated_at DESC");
        res.json({ data: rows });
    } catch (e) { handleError(res, e); }
};

export const saveDocument = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id, title, content, type, status, metadata } = req.body;
        const isUpdate = id && !String(id).startsWith('temp_');

        const metaString = typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null);

        if (isUpdate) {
            // SRE Audit: Captura snapshot antes da modificação
            const [[current]] = await connection.query("SELECT content FROM documents WHERE id = ?", [id]);
            if (current && current.content !== content) {
                await connection.query("INSERT INTO document_versions (document_id, content) VALUES (?, ?)", [id, current.content]);
            }
            await connection.query("UPDATE documents SET title=?, content=?, type=?, status=?, metadata=?, updated_at=NOW() WHERE id=?", 
                [title, content, type, status, metaString, id]);
            await connection.commit();
            res.json({ success: true });
        } else {
            const [result] = await connection.query("INSERT INTO documents (title, content, type, status, metadata, created_at) VALUES (?,?,?,?,?, NOW())", 
                [title, content, type, status, metaString]);
            await connection.commit();
            res.status(201).json({ id: result.insertId, success: true });
        }
    } catch (e) { 
        await connection.rollback();
        handleError(res, e); 
    } finally {
        connection.release();
    }
};

export const getDocumentHistory = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM document_versions WHERE document_id = ? ORDER BY created_at DESC", [req.params.id]);
        res.json({ data: rows });
    } catch (e) { handleError(res, e); }
};

export const deleteDocument = async (req, res) => {
    try {
        await pool.query("DELETE FROM documents WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};

// --- ID TEMPLATES (MULTI-DESIGN ENGINE) ---

export const getIdTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM id_card_templates ORDER BY is_active DESC, updated_at DESC");
        // Parse JSON fields
        rows.forEach(r => {
            try { r.layout_front = JSON.parse(r.layout_front); } catch (e) { r.layout_front = []; }
            try { r.layout_back = JSON.parse(r.layout_back); } catch (e) { r.layout_back = []; }
        });
        res.json({ data: rows });
    } catch (e) { handleError(res, e); }
};

export const saveIdTemplate = async (req, res) => {
    try {
        const { id, name, layout_front, layout_back, is_active } = req.body;
        const frontStr = JSON.stringify(layout_front || []);
        const backStr = JSON.stringify(layout_back || []);
        
        if (is_active) {
            // Se for ativar este, desativa os outros primeiro
            await pool.query("UPDATE id_card_templates SET is_active = 0");
        }

        if (id) {
            await pool.query("UPDATE id_card_templates SET name=?, layout_front=?, layout_back=?, is_active=? WHERE id=?", 
                [name, frontStr, backStr, is_active ? 1 : 0, id]);
            res.json({ success: true });
        } else {
            const [result] = await pool.query("INSERT INTO id_card_templates (name, layout_front, layout_back, is_active) VALUES (?, ?, ?, ?)",
                [name, frontStr, backStr, is_active ? 1 : 0]);
            res.json({ id: result.insertId, success: true });
        }
    } catch (e) { handleError(res, e); }
};

export const deleteIdTemplate = async (req, res) => {
    try {
        await pool.query("DELETE FROM id_card_templates WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};

export const activateIdTemplate = async (req, res) => {
    try {
        await pool.query("UPDATE id_card_templates SET is_active = 0");
        await pool.query("UPDATE id_card_templates SET is_active = 1 WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};
