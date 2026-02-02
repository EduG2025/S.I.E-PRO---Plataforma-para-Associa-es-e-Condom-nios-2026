import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import { whatsappBroadcast } from './communicationController.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// SRE UTILS & HELPERS
// ============================================================================

/**
 * SRE Utils: Cálculo de idade biográfica (Preservado Passo 1)
 */
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

/**
 * SRE Helper: Converte data BR (DD/MM/AAAA) para MySQL (YYYY-MM-DD) (Preservado Passo 1)
 */
const formatToMySQLDate = (dob) => {
    if (!dob || typeof dob !== 'string') return null;
    const clean = dob.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    const brMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (brMatch) {
        let [_, d, m, y] = brMatch;
        if (y.length === 2) y = parseInt(y) > 30 ? `19${y}` : `20${y}`;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return null;
};

/**
 * SRE Helper: Parser de campos JSON (Atualizado Passo 2)
 * Garante tratamento de erros mais robusto.
 */
const parseField = (field, isArray = false) => {
    const fallback = isArray ? [] : {};
    if (!field) return fallback;
    try {
        const parsed = typeof field === 'string' ? JSON.parse(field) : field;
        if (isArray) return Array.isArray(parsed) ? parsed : fallback;
        return (typeof parsed === 'object' && parsed !== null) ? parsed : fallback;
    } catch (e) { return fallback; }
};

/**
 * SRE Helper: Limpeza de resposta JSON da IA (Atualizado Passo 2)
 */
const cleanAIJsonResponse = (text) => {
    if (!text) return "{}";
    return text.replace(/```json|```/g, "").trim();
};

/**
 * SRE Personalization Engine: Resolve variáveis contextuais em templates.
 * (Preservado do Passo 1 para compatibilidade Legacy)
 */
const resolveTemplate = (content, data) => {
    if (!content) return "";
    let resolved = content;
    Object.entries(data).forEach(([key, val]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        resolved = resolved.replace(regex, val || '---');
    });
    return resolved;
};

/**
 * SRE Helper: Persist base64 avatar to uploads and return public URL.
 */
const persistBase64Image = async (dataUrl, filenamePrefix, req) => {
    if (!dataUrl?.startsWith('data:')) return dataUrl;
    const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!matches) return dataUrl;

    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadDir = path.resolve(__dirname, '../uploads');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safePrefix = String(filenamePrefix || 'public').replace(/\W+/g, '_').toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const filename = `sie_public_${safePrefix}_${uniqueSuffix}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * SRE WELCOME DISPATCHER (LEGACY V12 - Preservado do Passo 1)
 * Fallback caso o whatsappBroadcast falhe ou para notificações não-broadcast.
 */
const sendWelcomeMessage = async (userData, shortName) => {
    if (!userData.phone) return;
    const agent = new https.Agent({ rejectUnauthorized: false });
    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config FROM settings WHERE id = 1');
        let config = settings?.whatsapp_config;
        if (config && typeof config === 'string') config = JSON.parse(config);
        if (!config?.welcome_msg || !config?.api_key) return;
        const [[tpl]] = await pool.query("SELECT content FROM message_templates WHERE event_trigger = 'WELCOME_CENSUS' AND is_active = 1 LIMIT 1");
        const welcomeText = tpl?.content || `Olá {nome}! Bem-vindo ao cluster {sigla}. Seu registro foi protocolado com sucesso no censo digital.`;
        const personalized = resolveTemplate(welcomeText, {
            nome: (userData.name || 'Membro').split(' ')[0],
            unidade: userData.unit || 'HUB',
            sigla: shortName
        });
        await axios({
            method: 'post',
            url: config.gateway_url || 'https://jennyai.space/send-message',
            params: {
                api_key: config.api_key,
                sender: config.sender,
                number: userData.phone.replace(/\D/g, ''),
                message: personalized,
                footer: config.footer || shortName
            },
            timeout: 10000,
            httpsAgent: agent
        });
        console.log(`[SRE WELCOME LEGACY] Mensagem enviada para: ${userData.phone}`);
    } catch (e) {
        console.error(`[SRE WELCOME LEGACY FAIL] Erro no disparo: ${e.message}`);
    }
};

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * NEURAL ARCHITECT V3.0 (Evolução Passo 2)
 * Substitui o suggestQuestions simples do Passo 1 por lógica de auditoria heurística.
 */
export const suggestQuestions = async (req, res) => {
    const { title, description, depth, maxQuestions, parentSurveyId, config } = req.body;

    try {
        let chainContext = "";
        if (parentSurveyId) {
            const [[parent]] = await pool.query("SELECT title, questions FROM surveys WHERE id = ?", [parentSurveyId]);
            if (parent) {
                const parentQs = parseField(parent.questions, true).map(q => q.text).join(", ");
                chainContext = `ESTA PESQUISA É UMA CONTINUAÇÃO DE: "${parent.title}". 
                JÁ TEMOS DADOS SOBRE: [${parentQs}]. 
                FOQUE EM NOVOS ATRIBUTOS E AVANCE NA INVESTIGAÇÃO SEM SER REDUNDANTE.`;
            }
        }

        const depthGuides = {
            1: "BÁSICO (Essencial): Identificação core, demografia simples, contatos e dados binários (Sim/Não). Baixo atrito.",
            2: "INTERMEDIÁRIO (Operacional): Comportamento de uso, frequência, satisfação setorial e hábitos de convivência.",
            3: "PROFUNDO (Estratégico): Diagnóstico psicossocial, vulnerabilidades, talentos ocultos e sugestões de infraestrutura detalhadas."
        };

        // Fallback para config legacy se depth não for passado
        const contextDesc = description || config?.targetAudience || "Mapeamento multissetorial de moradores";

        const prompt = `
        ATUE COMO: Arquiteto Social e Analista de UX Research SRE do S.I.E PRO.
        OBJETIVO: Estruturar uma PESQUISA INTELIGENTE para o cluster: "${title}".
        DESCRIÇÃO DO CONTEXTO: ${contextDesc}.
        
        PARÂMETROS TÁTICOS:
        - NÍVEL DE PROFUNDIDADE: ${depth || 1} (${depthGuides[depth || 1]})
        - LIMITE DE ATRIBUTOS: Máximo ${maxQuestions || 10} perguntas.
        ${chainContext}

        DIRETRIZES RIGOROSAS:
        1. CARGA COGNITIVA: Estime o esforço mental necessário para responder.
        2. ANÁLISE SETORIAL: Distribua as perguntas entre os pilares (EDUCAÇÃO, ESPORTE, LAZER, SAÚDE, ASSISTÊNCIA, TURISMO).
        3. LOGICA: Use mapping_tag compatível com o BI territorial.

        FORMATO DE SAÍDA (JSON PURO):
        {
          "audit": {
            "cognitive_load": "LOW|MEDIUM|HIGH",
            "estimated_minutes": number,
            "logic_complexity": "LINEAR|BRANCHED",
            "sectoral_analysis": { "SAUDE": percentage, "LAZER": percentage, "OUTROS": percentage },
            "strategy_summary": "Explique por que este roteiro é eficiente para o nível ${depth}"
          },
          "questions": [
            { 
              "id": "slug", 
              "text": "Pergunta clara e objetiva?", 
              "type": "text|select|boolean|number", 
              "mapping_tag": "EDUCACAO|SAUDE|ESPORTE|LAZER|ASSISTENCIA_SOCIAL|TURISMO|OUTROS",
              "required": true,
              "options": ["Opção 1", "Opção 2"],
              "cognitive_weight": 1|2|3
            }
          ]
        }
        `;

        const aiResponse = await IAProviderManager.execute('survey_suggestion', {
            model: IAProviderManager.MODELS.FAST,
            contents: prompt,
            config: {
                systemInstruction: "Você é um gerador de pesquisas sociais balanceadas. Priorize UX e profundidade de dados sem cansar o usuário. Retorne apenas JSON.",
                responseMimeType: "application/json"
            }
        });

        const cleanedData = JSON.parse(cleanAIJsonResponse(aiResponse.text));
        res.json({ data: cleanedData });
    } catch (e) {
        console.error("[SRE IA FAIL]", e);
        res.status(500).json({ error: "FALHA_NA_ARQUITETURA_NEURAL" });
    }
};

/**
 * SUBMIT RESPONSE (Preservado Passo 1 - Crítico)
 * Mantém transações, criação/update de usuário, logs de auditoria e triggers WhatsApp.
 * A versão do Passo 2 foi descartada por ser incompleta.
 */
export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf).replace(/\D/g, '');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [[surveyConfig]] = await connection.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
        if (!surveyConfig) throw new Error("CENSO_NAO_LOCALIZADO");

        const [existing] = await connection.query('SELECT id, socialData, phone, whatsapp, avatar_url FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        let userId = existing[0]?.id;
        const isoBirthDate = formatToMySQLDate(userData.birth_date);
        const avatarUrl = await persistBase64Image(userData.avatar_url || existing[0]?.avatar_url, cleanCPF || 'public', req);

        const userPayload = {
            name: (userData.name || '').toUpperCase(),
            unit: userData.unit,
            email: userData.email,
            phone: userData.phone,
            whatsapp: userData.whatsapp,
            birth_date: isoBirthDate,
            age: calculateAge(isoBirthDate),
            cep: userData.cep,
            street: userData.street,
            number: userData.number,
            complement: userData.complement,
            neighborhood: userData.neighborhood,
            city: userData.city,
            state: userData.state,
            profession: userData.profession,
            rg: userData.rg,
            issuing_authority: userData.issuing_authority,
            gender: userData.gender,
            resident_type: userData.resident_type,
            voting_rights: userData.voting_rights,
            preferred_channel: userData.preferred_channel,
            avatar_url: avatarUrl,
            active: 1
        };

        if (!userId) {
            userPayload.cpf_cnpj = cleanCPF;
            userPayload.status = 'PENDING';
            userPayload.role = 'RESIDENT';
            userPayload.socialData = JSON.stringify(answers);
            if (userData.password) userPayload.password_hash = await bcrypt.hash(userData.password, 10);
            const [result] = await connection.query('INSERT INTO users SET ?', [userPayload]);
            userId = result.insertId;
        } else {
            const currentSocial = parseField(existing[0]?.socialData, false);
            userPayload.socialData = JSON.stringify({ ...currentSocial, ...answers });
            await connection.query('UPDATE users SET ? WHERE id = ?', [userPayload, userId]);
        }

        await connection.query(
            'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cleanCPF, userData.name || 'Membro Externo', JSON.stringify(answers)]
        );

        await connection.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "SUBMIT_CENSUS", "surveys", ?, ?)',
            [userId, surveyId, `Resposta comitada para ${surveyConfig.title}`]
        );

        await connection.commit();

        // Lógica de Trigger WhatsApp (Preservada Passo 1)
        if (surveyConfig.whatsapp_trigger_enabled && surveyConfig.whatsapp_template_id) {
            const targetPhone = userData.whatsapp || userData.phone || existing[0]?.whatsapp || existing[0]?.phone;
            if (targetPhone) {
                const broadcastReq = {
                    body: {
                        templateId: surveyConfig.whatsapp_template_id,
                        targetType: 'DIRECT',
                        directNumber: targetPhone.replace(/\D/g, ''),
                        contextData: {
                            survey_title: surveyConfig.title,
                            nome: (userData.name || 'Membro').split(' ')[0]
                        }
                    },
                    user: { id: 0 }
                };
                whatsappBroadcast(broadcastReq, { json: () => { }, status: () => ({ json: () => { } }) }).catch(e => console.error("[SRE TRIGGER FAIL]", e.message));
            }
        } else {
            const [[settings]] = await connection.query('SELECT shortName FROM settings WHERE id = 1');
            await sendWelcomeMessage(userPayload, settings?.shortName || 'S.I.E');
        }

        res.json({ success: true, protocol: Date.now(), userId: userId, next_survey_id: surveyConfig.next_survey_id });
    } catch (e) {
        await connection.rollback();
        console.error("[SRE CENSO CRITICAL FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_GRAVAR_LEDGER", details: e.message });
    } finally {
        connection.release();
    }
};

export const getAllSurveys = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM surveys ORDER BY created_at DESC");
        rows.forEach(r => { r.questions = parseField(r.questions, true); });
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "DATABASE_READ_ERROR" }); }
};

/**
 * CHECK RESIDENT (Preservado Passo 1 - Crítico)
 * Mantém a seleção extensa de dados necessária para o frontend (Passo 2 estava incompleto).
 */
export const checkResident = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query(
            `SELECT name, unit, email, phone, age, avatar_url, rg, issuing_authority, gender, birth_date, resident_type, voting_rights, role, status, whatsapp, preferred_channel, profession, cep, street, number, complement, neighborhood, city, state, socialData FROM users WHERE cpf_cnpj = ?`,
            [cleanCPF]
        );
        if (rows.length > 0) {
            const userData = rows[0];
            userData.socialData = parseField(userData.socialData, false);
            res.json({ found: true, ...userData });
        } else {
            res.json({ found: false });
        }
    } catch (e) {
        res.status(500).json({ error: "ERRO_VALIDACAO_KERNEL" });
    }
};

export const generateAISummary = async (req, res) => {
    const { userData, answers } = req.body;
    try {
        // Prompt Evoluído (Passo 2)
        const prompt = `Analise os dados sociodemográficos de um morador e gere um resumo tático de 3 linhas em CAIXA ALTA sobre seu perfil para a gestão. Perfil: ${JSON.stringify(userData)}. Respostas: ${JSON.stringify(answers)}`;
        const aiResponse = await IAProviderManager.execute('census_summary', { contents: prompt });
        res.json({ text: aiResponse.text });
    } catch (e) { res.status(500).json({ error: "FALHA_SUMARIO_IA" }); }
};

/**
 * GET ALL RESPONSES (Evolução Passo 2)
 * Inclui LEFT JOIN com surveys para trazer o título, melhorando a visualização.
 */
export const getAllResponses = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT sr.*, s.title as survey_title 
            FROM survey_responses sr
            LEFT JOIN surveys s ON sr.survey_id = s.id
            ORDER BY sr.created_at DESC
        `);
        rows.forEach(r => r.answers = parseField(r.answers, false));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_AO_LER_RESPOSTAS" }); }
};

export const getAllSurveyResponses = getAllResponses; // Alias para compatibilidade

export const getResponses = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE survey_id = ? ORDER BY created_at DESC", [req.params.id]);
        rows.forEach(r => r.answers = parseField(r.answers, false));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_FETCH_DATA" }); }
};

export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'CENSO_INDISPONIVEL' });
        const survey = rows[0];
        survey.questions = parseField(survey.questions, true);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: "ERRO_FORM_PUBLICO" }); }
};

export const getResponsesByCpf = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC", [cleanCPF]);
        rows.forEach(r => r.answers = parseField(r.answers, false));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_HISTORICO_MEMBRO" }); }
};

export const getPublicResponseByCpf = async (req, res) => {
    const cleanCPF = String(req.params.cpf).replace(/\D/g, '');
    try {
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE survey_id = ? AND cpf = ? LIMIT 1", [req.params.surveyId, cleanCPF]);
        if (rows.length > 0) {
            res.json({ found: true, answers: parseField(rows[0].answers, false), data: rows[0] });
        } else {
            res.json({ found: false });
        }
    } catch (e) { res.status(500).json({ error: "FALHA_RECOMPOSICAO" }); }
};
