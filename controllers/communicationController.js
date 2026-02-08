
import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * S.I.E MESSENGER CORE - V35.2 (SRE PATCH MEDIA FIX)
 * Protocolo de Comunicação Soberana com RAG Neural e Automação CRM.
 */

// SRE HELPER: Persistência de Base64 para Disco
const persistBase64Media = async (dataUrl, req) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;

    try {
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return dataUrl;

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Extensão baseada no mime
        const ext = mimeType.split('/')[1] || 'bin';
        const filename = `template_media_${Date.now()}_${Math.round(Math.random() * 1E9)}.${ext}`;
        
        // Caminho absoluto para uploads
        const uploadDir = path.resolve(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, buffer);

        // Retorna URL pública
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        return `${protocol}://${host}/uploads/${filename}`;

    } catch (e) {
        console.error("[SRE MEDIA PERSIST ERROR]", e);
        // Em caso de erro, retorna null ou string vazia para não quebrar o banco com base64 gigante
        return ""; 
    }
};

const normalizePhone = (num) => {
    const clean = String(num || '').replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 10 || clean.length === 11) return '55' + clean;
    return clean;
};

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
 * MOTOR RAG (Retrieval-Augmented Generation)
 * Orquestra consulta entre WIKI e LEDGER para respostas neurais no WhatsApp.
 */
export const processChatbotResponse = async (incomingMsg, fromNumber) => {
    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, name, shortName FROM settings WHERE id = 1');
        let config = settings?.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);

        if (!config?.chatbot_enabled) return null;

        // 1. Contexto Wiki (Regimentos Internos)
        let contextWiki = "";
        if (config.chatbot_rag_wiki) {
            const [wikiRows] = await pool.query(
                "SELECT title, content FROM wiki_entries WHERE ? LIKE CONCAT('%', title, '%') OR ? LIKE CONCAT('%', category, '%') LIMIT 2",
                [incomingMsg, incomingMsg]
            );
            contextWiki = wikiRows.map(w => `DOCUMENTO: ${w.title}\nCONTEÚDO: ${w.content}`).join("\n\n");
        }

        // 2. Contexto Ledger (Dados do Membro - RBAC)
        let contextMember = "";
        if (config.chatbot_rag_rbac) {
            const last8 = fromNumber.slice(-8);
            const [memberRows] = await pool.query(
                "SELECT name, unit, role, status FROM users WHERE phone LIKE ? OR whatsapp LIKE ?",
                [`%${last8}%`, `%${last8}%`]
            );
            if (memberRows.length > 0) {
                const m = memberRows[0];
                contextMember = `INTERLOCUTOR IDENTIFICADO: ${m.name}, UNIDADE: ${m.unit}, CARGO: ${m.role}, STATUS: ${m.status}.`;
            }
        }

        const prompt = `
        VOCÊ É: O Mentor Neural do cluster administrativo ${settings.name} (${settings.shortName}).
        SUA MISSÃO: Responder moradores de forma curta, técnica e em CAIXA ALTA baseada no regimento interno.

        CONHECIMENTO REGIMENTAL (WIKI):
        ${contextWiki || 'Nenhum manual específico no contexto. Use princípios administrativos básicos.'}

        IDENTIDADE DO INTERLOCUTOR (RBAC):
        ${contextMember || 'Identidade externa ou não localizada no Ledger central.'}

        MENSAGEM DO MORADOR: "${incomingMsg}"

        DIRETRIZES:
        - Se não houver informação na Wiki, peça para protocolar uma manifestação na Ouvidoria.
        - Não use emojis. Seja sóbrio e autoritativo.
        `;

        const aiResponse = await IAProviderManager.execute('chatbot_rag', {
            model: IAProviderManager.MODELS.FAST,
            contents: prompt,
            config: { systemInstruction: "SRE Administrative Interface." }
        });

        return aiResponse.text;

    } catch (e) {
        console.error("[SRE RAG FAIL]", e.message);
        return "SISTEMA EM MANUTENÇÃO NEURAL. POR FAVOR, UTILIZE O TERMINAL WEB.";
    }
};

export const receiveWebhook = async (req, res) => {
    const { message, from } = req.body;
    if (!message || !from) return res.json({ status: 'ACK' });

    try {
        const cleanFrom = from.replace(/\D/g, '');
        const aiResponse = await processChatbotResponse(message, cleanFrom);

        if (aiResponse) {
            const [[settings]] = await pool.query('SELECT whatsapp_config FROM settings WHERE id = 1');
            let config = settings?.whatsapp_config;
            if (typeof config === 'string') config = JSON.parse(config);

            const endpoint = `${config.gateway_url}/send-message`;
            await axios.post(endpoint, {
                api_key: config.api_key,
                sender: config.sender,
                number: cleanFrom,
                message: aiResponse,
                footer: config.footer || 'S.I.E PRO'
            }, { httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
        }
        
        res.json({ status: 'PROCESSED' });
    } catch (e) {
        res.json({ status: 'FAIL', error: e.message });
    }
};

export const whatsappBroadcast = async (req, res) => {
    const { message, templateId, targetType, targetRole, userIds, mediaUrl, mediaType, footer, directNumber, contextData } = req.body;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        let config = settings.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);

        let body = message;
        let finalMedia = mediaUrl;
        let finalType = mediaType;

        if (templateId) {
            const [[tpl]] = await pool.query('SELECT content, media_url, media_type FROM message_templates WHERE id = ?', [templateId]);
            if (tpl) {
                body = tpl.content;
                finalMedia = tpl.media_url;
                finalType = tpl.media_type;
            }
        }

        let recipients = [];
        if (targetType === 'DIRECT') {
            recipients = [{ name: 'Membro', phone: directNumber, unit: 'HUB' }];
        } else if (targetType === 'SELECTED' && Array.isArray(userIds)) {
            const [rows] = await pool.query('SELECT name, phone, unit FROM users WHERE id IN (?)', [userIds]);
            recipients = rows;
        } else {
            const [rows] = await pool.query('SELECT name, phone, unit FROM users WHERE (role = ? OR ? = "ALL") AND active = 1', [targetRole, targetRole]);
            recipients = rows;
        }

        const endpoint = finalMedia ? `${config.gateway_url}/send-media` : `${config.gateway_url}/send-message`;
        let sent = 0;

        for (const user of recipients) {
            if (!user.phone) continue;
            const personalized = resolveTemplate(body, {
                nome: user.name.split(' ')[0],
                unidade: user.unit,
                sigla: settings.shortName,
                ...contextData
            });

            try {
                await axios.post(endpoint, {
                    api_key: config.api_key,
                    sender: config.sender,
                    number: normalizePhone(user.phone),
                    message: !finalMedia ? personalized : undefined,
                    caption: finalMedia ? personalized : undefined,
                    url: finalMedia,
                    media_type: finalType,
                    footer: footer || config.footer
                }, { httpsAgent: agent, timeout: 5000 });
                sent++;
            } catch (err) { console.warn(`Falha no disparo para ${user.phone}`); }
        }

        res.json({ success: true, sent });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const surveyBroadcast = async (req, res) => {
    const { surveyId, templateId, targetRole } = req.body;
    try {
        const [[survey]] = await pool.query("SELECT id, title FROM surveys WHERE id = ?", [surveyId]);
        if (!survey) return res.status(404).json({ error: "PESQUISA_NAO_LOCALIZADA" });

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const surveyLink = `${protocol}://${host}/census/${surveyId}`;

        req.body.targetType = 'ROLE';
        req.body.targetRole = targetRole || 'RESIDENT';
        req.body.contextData = {
            survey_title: survey.title,
            survey_link: surveyLink
        };
        
        if (!templateId) {
            req.body.message = `Olá {nome}! Solicitamos sua participação no censo: *{survey_title}*.\n\nClique no link abaixo para preencher:\n{survey_link}`;
        }

        return whatsappBroadcast(req, res);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const getTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM message_templates ORDER BY name ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveTemplate = async (req, res) => {
    try {
        // SRE JSON Sanitization Protocol
        const { id, created_at, updated_at, ...data } = req.body;
        
        // 1. SRE FIX: Conversão de Base64 para Arquivo Físico
        // Evita erro "Data too long" em colunas TEXT
        if (data.media_url && data.media_url.startsWith('data:')) {
            data.media_url = await persistBase64Media(data.media_url, req);
        }

        // 2. Sanitização de Campos JSON
        const jsonFields = ['buttons', 'variables_available'];
        jsonFields.forEach(field => {
            if (data[field] !== undefined) {
                if (typeof data[field] === 'object' && data[field] !== null) {
                    data[field] = JSON.stringify(data[field]);
                } else if (typeof data[field] === 'string') {
                    try {
                        JSON.parse(data[field]);
                    } catch (e) {
                        data[field] = JSON.stringify([]); 
                    }
                }
            }
        });

        if (id) await pool.query('UPDATE message_templates SET ? WHERE id = ?', [data, id]);
        else await pool.query('INSERT INTO message_templates SET ?', [data]);
        
        res.json({ success: true });
    } catch (e) { 
        console.error("[SRE TEMPLATE ERROR]", e.message);
        res.status(500).json({ error: e.message }); 
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        await pool.query('DELETE FROM message_templates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getRules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM automation_rules ORDER BY id DESC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createRule = async (req, res) => {
    try {
        const { title, conditions } = req.body;
        const [result] = await pool.query('INSERT INTO automation_rules (title, conditions) VALUES (?, ?)', [title, JSON.stringify(conditions)]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteRule = async (req, res) => {
    try {
        await pool.query('DELETE FROM automation_rules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_broadcasts ORDER BY scheduled_at ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createSchedule = async (req, res) => {
    try {
        const [result] = await pool.query('INSERT INTO scheduled_broadcasts SET ?', [req.body]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteSchedule = async (req, res) => {
    try {
        await pool.query('DELETE FROM scheduled_broadcasts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getCampaigns = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const executeCampaign = async (req, res) => {
    const { title, ruleId, templateId } = req.body;
    try {
        const [[rule]] = await pool.query("SELECT conditions FROM automation_rules WHERE id = ?", [ruleId]);
        const [[template]] = await pool.query("SELECT content FROM message_templates WHERE id = ?", [templateId]);
        
        const conds = JSON.parse(typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions));
        let query = "SELECT id, name, phone, unit FROM users WHERE active = 1 AND phone IS NOT NULL";
        let params = [];

        conds.forEach(c => {
            if (c.operator === 'EQUALS') { query += ` AND ${c.field} = ?`; params.push(c.value); }
            else if (c.operator === 'CONTAINS') { query += ` AND ${c.field} LIKE ?`; params.push(`%${c.value}%`); }
        });

        const [targets] = await pool.query(query, params);
        if (targets.length === 0) return res.json({ success: false, message: "Nenhum alvo localizado para esta regra." });

        const [camp] = await pool.query("INSERT INTO campaigns (title, rule_id, template_id, status, total_targets) VALUES (?, ?, ?, 'RUNNING', ?)", [title, ruleId, templateId, targets.length]);
        
        for (const user of targets) {
            const body = resolveTemplate(template.content, { nome: user.name.split(' ')[0], unidade: user.unit });
            await pool.query("INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, template_id, status, campaign_id) VALUES (?, 'USER', ?, ?, ?, 'PENDING', ?)", 
                [0, user.id, body, templateId, camp.insertId]);
        }

        res.json({ success: true, count: targets.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
