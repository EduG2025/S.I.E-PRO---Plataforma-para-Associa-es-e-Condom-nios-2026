import pool from '../config/database.js';

// Helper para tratar erros e não expor o banco
const handleError = (res, error) => {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Erro interno no servidor de banco de dados" });
};

export const getAssemblies = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM assemblies ORDER BY date DESC");
        res.json({ data: rows });
    } catch (e) { handleError(res, e); }
};

export const createAssembly = async (req, res) => {
    try {
        // Sugestão: Desestruturar para evitar campos indesejados
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
        const [result] = await pool.query("UPDATE assemblies SET ? WHERE id = ?", [req.body, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Assembleia não encontrada" });
        }
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};

export const deleteAssembly = async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM assemblies WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Registro não encontrado" });
        }
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
    try {
        const { id, title, content, type, status } = req.body;
        
        // Verifica se é atualização ou criação
        const isUpdate = id && !String(id).startsWith('temp_');

        if (isUpdate) {
            const [result] = await pool.query(
                "UPDATE documents SET title=?, content=?, type=?, status=?, updated_at=NOW() WHERE id=?", 
                [title, content, type, status, id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ error: "Documento não encontrado" });
            res.json({ success: true });
        } else {
            const [result] = await pool.query(
                "INSERT INTO documents (title, content, type, status, created_at) VALUES (?,?,?,?, NOW())", 
                [title, content, type, status]
            );
            res.status(201).json({ id: result.insertId, success: true });
        }
    } catch (e) { handleError(res, e); }
};

export const deleteDocument = async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM documents WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Documento não encontrado" });
        res.json({ success: true });
    } catch (e) { handleError(res, e); }
};