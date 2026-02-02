
import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import { Type } from "@google/genai";

// --- NÚCLEO DE SEGURANÇA E HIGIENIZAÇÃO ---
const sanitize = (str) => (typeof str === 'string' ? str.replace(/[<>]/g, '').trim() : '');

const parseField = (field, isArray = false) => {
    const fallback = isArray ? [] : {};
    if (!field) return fallback;
    try {
        const parsed = typeof field === 'string' ? JSON.parse(field) : field;
        if (isArray) return Array.isArray(parsed) ? parsed : fallback;
        return (typeof parsed === 'object' && parsed !== null) ? parsed : fallback;
    } catch (e) { return fallback; }
};

// =========================================================================
// 1. NEURAL ARCHITECT - LÓGICA DE EIXOS SELETIVOS
// =========================================================================
export const suggestQuestions = async (req, res) => {
    let { title, description, maxQuestions, excludedPillars = [], customPillarName = "" } = req.body;

    title = sanitize(title);
    description = sanitize(description);
    const cleanCustomName = sanitize(customPillarName);
    const safeMaxQuestions = Math.min(parseInt(maxQuestions) || 10, 40);

    const allPillars = {
        "1": "Demografia",
        "2": "Saúde",
        "3": "Social/Assistência",
        "4": "Educação",
        "5": "Esporte/Lazer",
        "6": cleanCustomName
    };

    const activePillarIds = Object.keys(allPillars).filter(id => {
        const isNotExcluded = !excludedPillars.includes(id);
        if (id === "6") return isNotExcluded && cleanCustomName.length > 0;
        return isNotExcluded;
    });

    if (activePillarIds.length === 0) {
        return res.status(400).json({
            error: "BLOQUEIO_NEURAL: Nenhum Eixo Estratégico ativo."
        });
    }

    try {
        const prompt = `
            ATUE COMO: Arquiteto de Dados Censitários Estrito e Especialista em UX Research.
            CONTEXTO: Protocolo "${title}" - ${description}.
            DIRETRIZES: Perguntas curtas (<40 chars), tom seco e direto.
            EIXOS PERMITIDOS:
            ${activePillarIds.map(id => `ID [${id}]: ${allPillars[id]}`).join('\n')}
            TOTAL: ${safeMaxQuestions} perguntas.
            `;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                audit: {
                    type: Type.OBJECT,
                    properties: { strategy_summary: { type: Type.STRING }, branching_factor: { type: Type.STRING } },
                    required: ["strategy_summary", "branching_factor"]
                },
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            temp_id: { type: Type.STRING },
                            logic_parent_temp_id: { type: Type.STRING },
                            logic_trigger_value: { type: Type.STRING },
                            pilar: { type: Type.STRING, enum: activePillarIds },
                            text: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["select", "text", "boolean", "number"] },
                            mapping_tag: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["temp_id", "pilar", "text", "type", "mapping_tag"]
                    }
                }
            },
            required: ["audit", "questions"]
        };

        const aiResponse = await IAProviderManager.execute('survey_suggestion', {
            contents: prompt,
            config: {
                systemInstruction: `Motor de classificação de dados. IDs: ${activePillarIds.join(', ')}.`,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1 
            }
        });

        const result = typeof aiResponse.text === 'string' ? JSON.parse(aiResponse.text) : aiResponse.text;

        if (result.questions && Array.isArray(result.questions)) {
            result.questions = result.questions.map(q => {
                let assignedPilar = String(q.pilar);
                if (!activePillarIds.includes(assignedPilar)) assignedPilar = activePillarIds[0];
                return { ...q, pilar: assignedPilar, logic_parent_id: q.logic_parent_temp_id || '' };
            });
        }

        res.json({ data: result });

    } catch (e) {
        console.error("[SRE IA CRITICAL FAIL]", e);
        res.status(500).json({ error: "FALHA_NA_ARQUITETURA_NEURAL", details: e.message });
    }
};

// =========================================================================
// 2. VALIDAÇÃO E SUBMISSÃO (PUBLIC FLOW)
// =========================================================================

export const checkResident = async (req, res) => {
    try {
        const rawCpf = req.params.cpf || '';
        const cleanCPF = rawCpf.replace(/\D/g, '');
        
        if (!cleanCPF) return res.status(400).json({ error: "CPF inválido" });

        // Busca o usuário na base para pré-preenchimento
        const [rows] = await pool.query(
            `SELECT id, name, unit FROM users WHERE cpf_cnpj = ? LIMIT 1`, 
            [cleanCPF]
        );

        if (rows.length > 0) {
            res.json({ found: true, ...rows[0] });
        } else {
            res.json({ found: false });
        }
    } catch (e) { 
        console.error("Check Resident Error:", e);
        res.status(500).json({ error: "ERRO_VALIDACAO_KERNEL" }); 
    }
};

export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf || '').replace(/\D/g, '');
    
    try {
        // 1. Tenta vincular a um usuário existente
        let userId = null;
        let finalUserName = userData?.name ? sanitize(userData.name) : "VISITANTE EXTERNO";
        let userPhone = userData?.phone || null; // Tenta pegar do form público se existir

        if (cleanCPF) {
            const [users] = await pool.query("SELECT id, name, phone FROM users WHERE cpf_cnpj = ?", [cleanCPF]);
            if (users.length > 0) {
                userId = users[0].id;
                if (users[0].name) finalUserName = users[0].name;
                if (users[0].phone) userPhone = users[0].phone; // Prioriza telefone do cadastro
            }
        }

        // 2. Cálculo de Risco (Risk Score Heurístico)
        let riskScore = 0;
        const answerValues = Object.values(answers || {}).map(v => String(v).toUpperCase());
        
        // Palavras-chave que elevam o risco social/operacional
        const criticalKeywords = ['CRÍTICO', 'PÂNICO', 'RUIM', 'PRECÁRIO', 'INSEGURO', 'FOME', 'DESEMPREGO', 'VIOLÊNCIA'];
        const warningKeywords = ['REGULAR', 'ATENÇÃO', 'DIFICULDADE', 'FALTA'];

        answerValues.forEach(val => {
            if (criticalKeywords.some(k => val.includes(k))) riskScore += 20;
            if (warningKeywords.some(k => val.includes(k))) riskScore += 10;
        });
        
        // Normaliza score até 100
        riskScore = Math.min(riskScore, 100);

        // 3. Persistência com Failover de Schema
        let insertId = null;
        try {
            const [result] = await pool.query(
                'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers, risk_score) VALUES (?, ?, ?, ?, ?, ?)',
                [surveyId, userId, cleanCPF, finalUserName, JSON.stringify(answers || {}), riskScore]
            );
            insertId = result.insertId;
        } catch (dbError) {
            // Fallback para bases legadas
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                const [result] = await pool.query(
                    'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
                    [surveyId, userId, cleanCPF, finalUserName, JSON.stringify(answers || {})]
                );
                insertId = result.insertId;
            } else {
                throw dbError;
            }
        }

        // 4. PROTOCOLO SRE: Gatilho de Mensagem WELCOME_CENSUS (Assíncrono)
        (async () => {
            try {
                // A. Verifica se há um template de evento global 'WELCOME_CENSUS' ativo
                const [templates] = await pool.query(
                    "SELECT id, content FROM message_templates WHERE event_trigger = 'WELCOME_CENSUS' AND is_active = 1 LIMIT 1"
                );

                if (templates.length > 0) {
                    const template = templates[0];
                    const targetPhone = userPhone || userData?.whatsapp; // Fallback para dado do form público

                    // Só enfileira se tiver telefone válido
                    if (targetPhone) {
                        const [[settings]] = await pool.query('SELECT shortName FROM settings WHERE id = 1');
                        
                        // Substituição básica de variáveis (O Worker fará a resolução completa)
                        // Injetamos o templateId para que o Worker resolva a mídia se houver
                        let msgBody = template.content
                            .replace(/{nome}/gi, finalUserName.split(' ')[0])
                            .replace(/{protocolo}/gi, insertId)
                            .replace(/{sigla}/gi, settings?.shortName || 'S.I.E');

                        await pool.query(
                            'INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, template_id, scheduled_at, status) VALUES (?, "DIRECT", ?, ?, ?, NOW(), "PENDING")',
                            [userId || 0, targetPhone, msgBody, template.id]
                        );
                        console.log(`[SRE TRIGGER] WELCOME_CENSUS disparado para ${cleanCPF}`);
                    }
                }
            } catch (triggerError) {
                console.warn("[SRE TRIGGER IGNORED]", triggerError.message);
                // Não falha a requisição principal, apenas loga o erro do gatilho
            }
        })();

        res.json({ success: true, protocol: insertId });

    } catch (e) { 
        console.error("[SRE SURVEY SUBMIT ERROR]", e.message);
        res.status(500).json({ error: "ERRO_AO_SALVAR", details: e.message }); 
    }
};

export const generateAISummary = async (req, res) => {
    const { answers } = req.body;
    try {
        const prompt = `Analise este snapshot social e gere um diagnóstico tático: ${JSON.stringify(answers)}`;
        const aiResponse = await IAProviderManager.execute('census_summary', { contents: prompt });
        res.json({ text: aiResponse.text });
    } catch (e) { res.status(500).json({ error: "FALHA_SUMARIO_IA" }); }
};

export const getAllSurveys = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM surveys ORDER BY created_at DESC");
        rows.forEach(r => r.questions = parseField(r.questions, true));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "DATABASE_READ_ERROR" }); }
};

export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'PESQUISA_INDISPONIVEL' });
        const survey = rows[0];
        survey.questions = parseField(survey.questions, true);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: "ERRO_FORM_PUBLICO" }); }
};

export const getAllResponses = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT sr.*, s.title as survey_title FROM survey_responses sr LEFT JOIN surveys s ON sr.survey_id = s.id ORDER BY sr.created_at DESC`);
        rows.forEach(r => r.answers = parseField(r.answers, false));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_AO_LER_RESPOSTAS" }); }
};

export const getResponses = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT sr.*, u.name as user_name, u.unit FROM survey_responses sr LEFT JOIN users u ON sr.user_id = u.id WHERE sr.survey_id = ? ORDER BY sr.created_at DESC`, [req.params.id]);
        rows.forEach(r => r.answers = parseField(r.answers, false));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_AO_FILTRAR_RESPOSTAS" }); }
};

export const getResponsesByCpf = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC", [cleanCPF]);
        rows.forEach(r => r.answers = parseField(r.answers, false));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_HISTORICO_MEMBRO" }); }
};
