
import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';

/**
 * SRE Helper: Normaliza tipos de mídia para o padrão do gateway.
 */
const normalizeMediaType = (type) => {
    const t = String(type || 'image').toLowerCase();
    if (t === 'document' || t === 'pdf' || t === 'file') return 'file';
    if (t === 'video') return 'video';
    if (t === 'audio') return 'audio';
    return 'image';
};

/**
 * SRE Personalization Engine: Resolve variáveis contextuais em templates.
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
 * SRE Helper: Normaliza o número para o padrão exigido pelo gateway (DDI 55 Brasil se ausente).
 */
const normalizePhone = (num) => {
    const clean = String(num || '').replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 10 || clean.length === 11) {
        return '55' + clean;
    }
    return clean;
};

// =========================================================================
// CRM & AUTOMATION ENGINE (NEW)
// =========================================================================

export const createRule = async (req, res) => {
    const { title, conditions } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO automation_rules (title, conditions) VALUES (?, ?)",
            [title, JSON.stringify(conditions || [])]
        );
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getRules = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM automation_rules ORDER BY id DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteRule = async (req, res) => {
    try {
        await pool.query("DELETE FROM automation_rules WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getCampaigns = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, r.title as rule_title, t.name as template_name
            FROM campaigns c
            LEFT JOIN automation_rules r ON c.rule_id = r.id
            LEFT JOIN message_templates t ON c.template_id = t.id
            ORDER BY c.created_at DESC
        `);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const executeCampaign = async (req, res) => {
    const { title, ruleId, templateId } = req.body;
    try {
        // 1. Fetch Rule & Template
        const [[rule]] = await pool.query("SELECT conditions FROM automation_rules WHERE id = ?", [ruleId]);
        const [[template]] = await pool.query("SELECT content FROM message_templates WHERE id = ?", [templateId]);
        
        if (!rule || !template) return res.status(404).json({ error: "REGRA_OU_TEMPLATE_NAO_ENCONTRADO" });

        // 2. Build Dynamic Query
        let query = "SELECT id, name, phone, unit FROM users WHERE active = 1 AND phone IS NOT NULL";
        const params = [];
        const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;

        const allowedFields = ['role', 'status', 'unit', 'resident_type', 'neighborhood', 'city'];

        if (Array.isArray(conditions) && conditions.length > 0) {
            conditions.forEach(cond => {
                if (allowedFields.includes(cond.field)) {
                    if (cond.operator === 'EQUALS') {
                        query += ` AND ${cond.field} = ?`;
                        params.push(cond.value);
                    } else if (cond.operator === 'NOT_EQUALS') {
                        query += ` AND ${cond.field} != ?`;
                        params.push(cond.value);
                    } else if (cond.operator === 'CONTAINS') {
                        query += ` AND ${cond.field} LIKE ?`;
                        params.push(`%${cond.value}%`);
                    }
                }
            });
        }

        const [targets] = await pool.query(query, params);

        if (targets.length === 0) return res.json({ success: false, message: "Nenhum alvo encontrado para esta regra." });

        // 3. Create Campaign Record
        const [campResult] = await pool.query(
            "INSERT INTO campaigns (title, rule_id, template_id, status, total_targets) VALUES (?, ?, ?, 'RUNNING', ?)",
            [title, ruleId, templateId, targets.length]
        );
        const campaignId = campResult.insertId;

        // 4. Fill Scheduled Broadcasts
        for (const user of targets) {
            const msgBody = resolveTemplate(template.content, { 
                nome: user.name.split(' ')[0], 
                unidade: user.unit || '---',
                sigla: 'S.I.E' // Can be fetched from settings if needed
            });

            await pool.query(
                "INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, template_id, scheduled_at, status, campaign_id) VALUES (?, 'CAMPAIGN', ?, ?, ?, NOW(), 'PENDING', ?)",
                [user.id, user.id, msgBody, templateId, campaignId]
            );
        }

        res.json({ success: true, targets: targets.length, campaignId });

    } catch (e) {
        console.error("Campaign Execution Fail:", e);
        res.status(500).json({ error: e.message });
    }
};

// =========================================================================
// STANDARD MESSAGING
// =========================================================================

export const whatsappBroadcast = async (req, res) => {
    const { 
        message, 
        templateId, 
        targetType, 
        targetRole, 
        userId, 
        userIds, 
        directNumber, 
        footer, 
        contextData, 
        mediaUrl, 
        mediaType,
        buttons 
    } = req.body;
    
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName, logoUrl FROM settings WHERE id = 1');
        if (!settings) return res.status(400).json({ error: 'CONFIG_NOT_FOUND' });

        let config = settings.whatsapp_config;
        if (config && typeof config === 'string') config = JSON.parse(config);

        if (!config || !config.api_key) {
            return res.status(400).json({ error: 'MESSENGER_NOT_CONFIGURED' });
        }

        let effectiveMessage = message;
        let effectiveMediaUrl = mediaUrl;
        let effectiveMediaType = mediaType;
        let effectiveButtons = buttons;

        if (templateId) {
            const [[tpl]] = await pool.query('SELECT content, media_url, media_type, buttons FROM message_templates WHERE id = ?', [templateId]);
            if (tpl) {
                if (!effectiveMessage) effectiveMessage = tpl.content;
                if (!effectiveMediaUrl) effectiveMediaUrl = tpl.media_url;
                if (!effectiveMediaType) effectiveMediaType = tpl.media_type;
                if (!effectiveButtons) {
                    effectiveButtons = typeof tpl.buttons === 'string' ? JSON.parse(tpl.buttons) : tpl.buttons;
                }
            }
        }

        effectiveMediaType = normalizeMediaType(effectiveMediaType || 'image');

        let recipients = [];
        if (targetType === 'DIRECT') {
            recipients = [{ phone: directNumber, name: 'Membro Externo' }];
        } else if (targetType === 'USER') {
            const [[user]] = await pool.query('SELECT phone, name, unit FROM users WHERE id = ?', [userId]);
            if (user && user.phone) recipients = [user];
        } else if (targetType === 'SELECTED' && Array.isArray(userIds) && userIds.length > 0) {
            const [rows] = await pool.query(
                'SELECT phone, name, unit FROM users WHERE id IN (?) AND active = 1 AND phone IS NOT NULL',
                [userIds]
            );
            recipients = rows;
        } else {
            const [rows] = await pool.query(
                'SELECT phone, name, unit FROM users WHERE (role = ? OR ? = "ALL") AND active = 1 AND phone IS NOT NULL',
                [targetRole, targetRole]
            );
            recipients = rows;
        }

        if (recipients.length === 0) return res.status(404).json({ error: 'NO_VALID_RECIPIENTS_FOUND' });

        const rawBase = config.gateway_url || 'https://jennyai.space';
        const baseUrl = rawBase.replace(/\/send-message$/, '').replace(/\/send-media$/, '').replace(/\/send-button$/, '').replace(/\/$/, '');
        
        const hasButtons = Array.isArray(effectiveButtons) && effectiveButtons.length > 0;
        const endpoint = hasButtons ? `${baseUrl}/send-button` : (effectiveMediaUrl ? `${baseUrl}/send-media` : `${baseUrl}/send-message`);
        
        const effectiveFooter = footer || config.footer || settings.shortName || 'S.I.E PRO';
        let successCount = 0;

        for (const contact of recipients) {
            try {
                const firstName = (contact.name || 'Membro').split(' ')[0];
                const resolvedContext = {
                    nome: firstName,
                    unidade: contact.unit || 'HUB',
                    sigla: settings.shortName,
                    ...(contextData || {})
                };

                const personalizedMessage = resolveTemplate(effectiveMessage, resolvedContext);
                const targetNumber = normalizePhone(contact.phone);
                if (!targetNumber) continue;

                const payload = {
                    api_key: config.api_key,
                    sender: config.sender,
                    number: targetNumber,
                    footer: effectiveFooter
                };

                if (hasButtons) {
                    payload.message = personalizedMessage;
                    payload.url = effectiveMediaUrl || "https://admcacaria.jennyai.space/uploads/Logo.png";
                    payload.button = effectiveButtons.map(btn => ({
                        type: btn.type,
                        displayText: resolveTemplate(btn.displayText, resolvedContext),
                        phoneNumber: btn.type === 'call' ? (btn.phoneNumber || "").replace(/\D/g, '') : undefined,
                        url: btn.type === 'url' ? btn.url : undefined,
                        copyText: btn.type === 'copy' ? btn.copyText : undefined
                    }));
                } else if (effectiveMediaUrl) {
                    payload.media_type = effectiveMediaType;
                    payload.url = effectiveMediaUrl;
                    payload.caption = personalizedMessage;
                } else {
                    payload.message = personalizedMessage;
                }

                await axios.post(endpoint, payload, { httpsAgent: agent });
                successCount++;
            } catch (err) {
                console.error(`[SRE DISPATCH FAIL] Recipient: ${contact.phone} | Error: ${err.message}`);
            }
        }

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "WHATSAPP_BROADCAST", "communication", 0, ?)',
            [req.user?.id || 0, `Disparados: ${successCount}/${recipients.length}. Tipo: ${targetType}`]
        );

        res.json({ success: true, delivered: successCount });
    } catch (e) {
        res.status(500).json({ error: `GATEWAY_PANIC: ${e.message}` });
    }
};

export const surveyBroadcast = async (req, res) => {
    const { surveyId, targetRole, customMessage } = req.body;
    try {
        const [[survey]] = await pool.query('SELECT title FROM surveys WHERE id = ?', [surveyId]);
        if (!survey) return res.status(404).json({ error: 'SURVEY_NOT_FOUND' });

        const host = req.get('host');
        const protocol = req.protocol === 'http' ? 'http' : 'https';
        const surveyLink = `${protocol}://${host}/census/${surveyId}`;

        const message = customMessage || `Olá {nome}, convidamos você para participar do censo: *${survey.title}*.\n\nSua participação é fundamental para o cluster {sigla}.\n\nAcesse pelo link: ${surveyLink}`;

        req.body = {
            message,
            targetType: 'ROLE',
            targetRole: targetRole || 'ALL',
            buttons: [
                { type: 'url', displayText: 'RESPONDER CENSO', url: surveyLink }
            ]
        };

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
    const { id, event_trigger, name, content, is_active, media_url, media_type, buttons } = req.body;
    try {
        const btnJson = JSON.stringify(buttons || []);
        const activeState = is_active === undefined ? 1 : is_active;
        const isUpdate = id && !String(id).startsWith('temp_');

        if (isUpdate) {
            await pool.query('UPDATE message_templates SET event_trigger=?, name=?, content=?, is_active=?, media_url=?, media_type=?, buttons=? WHERE id=?',
                [event_trigger, name, content, activeState, media_url || null, media_type || 'image', btnJson, id]);
        } else {
            await pool.query('INSERT INTO message_templates (event_trigger, name, content, is_active, media_url, media_type, buttons) VALUES (?,?,?,?,?,?,?)',
                [event_trigger, name, content, activeState, media_url || null, media_type || 'image', btnJson]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteTemplate = async (req, res) => {
    try {
        await pool.query('DELETE FROM message_templates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const receiveWebhook = async (req, res) => { res.json({ status: 'SRE_ACK' }); };

export const getSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_broadcasts ORDER BY scheduled_at ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createSchedule = async (req, res) => {
    const { message, templateId, targetType, targetValue, scheduledAt } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, template_id, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, "PENDING")',
            [req.user.id, targetType, targetValue, message, templateId, scheduledAt]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteSchedule = async (req, res) => {
    try {
        await pool.query('DELETE FROM scheduled_broadcasts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
