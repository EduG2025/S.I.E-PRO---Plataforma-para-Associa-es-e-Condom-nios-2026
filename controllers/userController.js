
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const SAFE_FIELDS = "id, name, username, cpf_cnpj, email, role, status, active, unit, age, birth_date, rg, issuing_authority, gender, nationality, phone, whatsapp, preferred_channel, avatar_url, document_front_url, document_back_url, ocr_payload, socialData, coordinates, profession, voting_rights, resident_type, created_by, parent_id, last_login, created_at, updated_at, cep, street, number, complement, neighborhood, city, state";

const normalizeVal = (v) => String(v || '').replace(/\D/g, '').trim();

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
    return age;
};

// Sanitização profunda para MySQL - Previne SQL Injection e Garante Tipagem
const sanitizeUserPayload = (payload) => {
    const { id, created_at, updated_at, last_login, password, confirmPassword, ...clean } = payload;
    const finalData = {};
    const allowed = SAFE_FIELDS.split(', ').map(f => f.trim());
    
    for (const key in clean) {
        if (allowed.includes(key)) {
            let val = clean[key];
            if (key === 'cpf_cnpj') val = normalizeVal(val);
            if (val !== null && typeof val === 'object') val = JSON.stringify(val);
            finalData[key] = val;
        }
    }
    return finalData;
};

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        let query = `SELECT ${SAFE_FIELDS} FROM users WHERE active = 1`;
        let params = [];
        if (search) {
            const cleanSearch = normalizeVal(search);
            query += ` AND (name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ?)`;
            const s = `%${search}%`;
            const cs = `%${cleanSearch}%`;
            params = [s, cs, s];
        }
        query += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), offset);
        const [rows] = await pool.query(query, params);
        res.json({ data: rows, pagination: { page: parseInt(page), total: rows.length, pages: 1 } });
    } catch (e) { 
        res.status(500).json({ error: "ERRO_FETCH_USERS" }); 
    }
};

export const createUser = async (req, res) => {
    try {
        const raw = req.body;
        const cpfClean = normalizeVal(raw.cpf_cnpj);
        
        // SRE SHIELD: Validação de Unicidade
        const [existing] = await pool.query("SELECT id FROM users WHERE cpf_cnpj = ?", [cpfClean]);
        if (existing.length > 0) return res.status(400).json({ error: "CPF_OU_USUARIO_JA_EXISTE" });

        const data = sanitizeUserPayload(raw);
        if (raw.password) data.password_hash = await bcrypt.hash(raw.password, 10);
        if (data.birth_date) data.age = calculateAge(data.birth_date);

        const [result] = await pool.query("INSERT INTO users SET ?", [data]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

export const updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const raw = req.body;
        const cpfClean = normalizeVal(raw.cpf_cnpj);

        // SRE SHIELD: Validação de Unicidade (IGNORA O PRÓPRIO ID PARA PERMITIR SALVAR O MESMO CPF)
        if (cpfClean) {
            const [existing] = await pool.query("SELECT id FROM users WHERE cpf_cnpj = ? AND id != ?", [cpfClean, id]);
            if (existing.length > 0) return res.status(400).json({ error: "CPF_OU_USUARIO_JA_EXISTE" });
        }

        const data = sanitizeUserPayload(raw);
        if (raw.password && raw.password.trim()) {
            data.password_hash = await bcrypt.hash(raw.password, 10);
        }
        
        if (data.birth_date) {
            let bDate = data.birth_date;
            if (String(bDate).includes('/')) {
                bDate = bDate.split('/').reverse().join('-');
            }
            data.birth_date = bDate;
            data.age = calculateAge(bDate);
        }

        const [result] = await pool.query("UPDATE users SET ? WHERE id = ?", [data, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "MEMBRO_NAO_LOCALIZADO" });
        
        res.json({ success: true });
    } catch (e) { 
        console.error("[SRE UPDATE FAIL]", e.message);
        res.status(500).json({ error: "FALHA_AO_ATUALIZAR_MEMBRO" }); 
    }
};

export const getUserById = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: "NOT_FOUND" });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: "ERRO_FETCH_USER" }); }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE parent_id = ? AND active = 1`, [req.params.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_AO_BUSCAR_DEPENDENTES" }); }
};

export const searchNeural = async (req, res) => {
    try {
        const { query } = req.body;
        const s = `%${query}%`;
        const cs = `%${normalizeVal(query)}%`;
        const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE name LIKE ? OR cpf_cnpj LIKE ? LIMIT 15`, [s, cs]);
        res.json({ internal: rows });
    } catch (e) { res.status(500).json({ error: "AI_SEARCH_FAIL" }); }
};

export const getMyProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`, [req.user.id]);
        if (!rows.length) return res.status(404).json({ error: "PERFIL_NAO_ENCONTRADO" });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateMyProfile = async (req, res) => {
    try {
        const data = sanitizeUserPayload(req.body);
        await pool.query("UPDATE users SET ? WHERE id = ?", [data, req.user.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const activateUser = async (req, res) => {
    try {
        await pool.query("UPDATE users SET status = 'ACTIVE' WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const generateInvite = async (req, res) => {
    res.json({ success: true, invite_code: `SIE-${Math.random().toString(36).substring(7).toUpperCase()}` });
};

// SRE GEO-BATCH PROCESSOR
// Executa em background para não travar a requisição HTTP (pode demorar minutos)
export const batchGeocode = async (req, res) => {
    try {
        // 1. Identificar registros sem coordenadas ou com coordenadas zeradas
        const [users] = await pool.query(`
            SELECT id, street, number, city, state, neighborhood 
            FROM users 
            WHERE (coordinates IS NULL OR coordinates LIKE '%"lat":0%') 
            AND street IS NOT NULL 
            AND number IS NOT NULL
            LIMIT 50
        `);

        if (users.length === 0) {
            return res.json({ success: true, message: "Todos os registros já estão geolocalizados." });
        }

        // Responde imediatamente para não dar timeout no frontend
        res.json({ success: true, message: `Iniciando geocoding de ${users.length} registros em background...` });

        // Processamento Assíncrono
        (async () => {
            console.log(`[SRE GEO] Iniciando lote de ${users.length} registros...`);
            let updated = 0;
            
            for (const user of users) {
                try {
                    const query = `${user.street}, ${user.number}, ${user.neighborhood || ''}, ${user.city}, ${user.state}, Brasil`;
                    
                    // Delay para respeitar Rate Limit do Nominatim (1 req/sec)
                    await new Promise(r => setTimeout(r, 2000));

                    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                        params: { format: 'json', limit: 1, q: query },
                        headers: { 'User-Agent': 'SIE-PRO-System/1.0' }
                    });

                    if (geoRes.data && geoRes.data.length > 0) {
                        const coords = {
                            lat: parseFloat(geoRes.data[0].lat),
                            lng: parseFloat(geoRes.data[0].lon)
                        };
                        
                        await pool.query(
                            "UPDATE users SET coordinates = ? WHERE id = ?", 
                            [JSON.stringify(coords), user.id]
                        );
                        updated++;
                        console.log(`[SRE GEO] User #${user.id} updated: ${coords.lat}, ${coords.lng}`);
                    }
                } catch (err) {
                    console.error(`[SRE GEO FAIL] User #${user.id}:`, err.message);
                }
            }
            
            // Log final
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, table_name, details) VALUES (?, "BATCH_GEOCODE", "users", ?)',
                [req.user.id, `Geolocalização em massa: ${updated}/${users.length} processados.`]
            );
        })();

    } catch (e) {
        res.status(500).json({ error: "Falha ao iniciar processo em lote." });
    }
};
