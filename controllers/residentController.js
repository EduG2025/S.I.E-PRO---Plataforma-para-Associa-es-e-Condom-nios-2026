import pool from '../config/database.js';

/**
 * SRE UTILS: Auxiliares de processamento
 */
const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

const safeParseJSON = (data, fallback = []) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch (e) { return fallback; }
};

/**
 * 1. DASHBOARD INTEGRADO (O CORAÇÃO DO PAINEL)
 */
export const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const [noticesRes, reservationsRes, balanceRes, surveysRes] = await Promise.all([
            pool.query('SELECT id, title, content, created_at FROM notices ORDER BY created_at DESC LIMIT 5'),
            pool.query('SELECT * FROM reservations WHERE user_id = ? AND date >= CURDATE() ORDER BY date ASC', [userId]),
            pool.query('SELECT SUM(amount) as total FROM financials WHERE user_id = ? AND status="PENDING"', [userId]),
            pool.query(`
                SELECT id, title, questions FROM surveys 
                WHERE status = 'ACTIVE' 
                AND id NOT IN (SELECT survey_id FROM survey_responses WHERE user_id = ?)
                LIMIT 3
            `, [userId])
        ]);

        const activeSurveys = surveysRes[0].map(survey => {
            const questions = safeParseJSON(survey.questions);
            return {
                id: survey.id,
                title: survey.title,
                totalQuestions: questions.length,
                progress: 0,
                status: 'PENDING'
            };
        });

        res.json({
            recentNotices: noticesRes[0],
            myReservations: reservationsRes[0],
            pendingBalance: parseFloat(balanceRes[0][0]?.total || 0).toFixed(2),
            activeSurveys: activeSurveys,
            server_status: { online: true, timestamp: new Date() }
        });
    } catch (e) {
        console.error("[SRE RESIDENT_DASH FAIL]", e);
        res.status(500).json({ error: "Erro ao sincronizar dados do dashboard." });
    }
};

/**
 * 2. AUTOGESTÃO DE IDENTIDADE (LGPD/SELF-SERVICE)
 */
export const getOwnProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            "SELECT id, name, email, phone, whatsapp, unit, profession, age, birth_date, avatar_url, resident_type, socialData FROM users WHERE id = ?",
            [userId]
        );

        if (!rows.length) return res.status(404).json({ error: "Perfil não encontrado." });

        const profile = rows[0];
        profile.socialData = safeParseJSON(profile.socialData, {});

        res.json({ data: profile });
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar dados do perfil." });
    }
};

export const updateOwnProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, phone, whatsapp, profession, birth_date, avatar_url } = req.body;

        const payload = {
            email,
            phone,
            whatsapp,
            profession,
            birth_date,
            avatar_url,
            age: calculateAge(birth_date),
            updated_at: new Date()
        };

        await pool.query("UPDATE users SET ? WHERE id = ?", [payload, userId]);

        // Auditoria SRE: Registrar que o próprio usuário alterou seus dados
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "SELF_UPDATE", "users", ?, "Dados biográficos atualizados pelo titular")',
            [userId, userId]
        );

        res.json({ success: true, message: "Informações atualizadas com sucesso." });
    } catch (e) {
        console.error("[SRE PROFILE_UPDATE FAIL]", e);
        res.status(500).json({ error: "Falha ao atualizar perfil." });
    }
};

/**
 * 3. LOGÍSTICA DA UNIDADE (HABITAÇÃO)
 */
export const getUnitData = async (req, res) => {
    try {
        const userId = req.user.id;
        const [[user]] = await pool.query("SELECT unit FROM users WHERE id = ?", [userId]);

        if (!user?.unit) {
            return res.status(400).json({ error: "Usuário não possui unidade vinculada." });
        }

        const [dependents, vehicles] = await Promise.all([
            pool.query("SELECT id, name, role, avatar_url, status FROM users WHERE parent_id = ?", [userId]),
            pool.query("SELECT * FROM vehicles WHERE unit = ?", [user.unit])
        ]);

        res.json({
            unit_id: user.unit,
            dependents: dependents[0],
            vehicles: vehicles[0]
        });
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar dados da habitação." });
    }
};

/**
 * 4. OUVIDORIA OPERACIONAL (REPORTAR E ACOMPANHAR)
 */
export const reportIncident = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, category, priority, coordinates } = req.body;

        const [result] = await pool.query(
            "INSERT INTO incidents (user_id, title, description, category, priority, coordinates, status) VALUES (?, ?, ?, ?, ?, ?, 'OPEN')",
            [userId, title, description, category || 'RECLAMAÇÃO', priority || 'NÍVEL 1', JSON.stringify(coordinates)]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "REPORT_INCIDENT", "incidents", ?, ?)',
            [userId, result.insertId, `Incidente aberto via Terminal Morador: ${title}`]
        );

        res.status(201).json({
            success: true,
            incidentId: result.insertId,
            message: "Sua solicitação foi registrada e enviada à governança."
        });
    } catch (e) {
        res.status(500).json({ error: "Erro ao registrar incidente." });
    }
};

// NOVO: Permite ao morador ver o status dos seus chamados
export const getMyIncidents = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            "SELECT id, title, status, category, created_at FROM incidents WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        res.json({ data: rows });
    } catch (e) {
        res.status(500).json({ error: "Erro ao carregar seus chamados." });
    }
};

/**
 * 5. FINANCEIRO DETALHADO (MY INVOICES)
 */
export const getMyFinancials = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            "SELECT id, title, amount, due_date, status, category FROM financials WHERE user_id = ? ORDER BY due_date DESC",
            [userId]
        );
        res.json({ data: rows });
    } catch (e) {
        res.status(500).json({ error: "Erro ao carregar histórico financeiro." });
    }
};

/**
 * 6. TRANSPARÊNCIA DE ACESSO
 */
// NOVO: Histórico de entradas/saídas do próprio morador e seus dependentes
export const getMyAccessLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            "SELECT * FROM access_logs WHERE user_id = ? OR user_id IN (SELECT id FROM users WHERE parent_id = ?) ORDER BY created_at DESC LIMIT 50",
            [userId, userId]
        );
        res.json({ data: rows });
    } catch (e) {
        res.status(500).json({ error: "Erro ao carregar logs de acesso." });
    }
};