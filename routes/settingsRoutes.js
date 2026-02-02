
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';

const router = express.Router();

const parseSystemConfig = (settings) => {
    if (!settings) return {};
    // Fusão: Adicionado 'dictionary' do Passo 2 à lista de campos JSON do Passo 1
    const jsonFields = ['resident_ui_settings', 'whatsapp_config', 'coordinates', 'module_metadata', 'dictionary'];

    jsonFields.forEach(field => {
        if (settings[field] && typeof settings[field] === 'string') {
            try {
                settings[field] = JSON.parse(settings[field]);
            } catch (e) {
                settings[field] = {};
            }
        }
    });
    return settings;
};

const aiKeysHandlers = createHandlers('ai_keys');
const wikiHandlers = createHandlers('wiki_entries');

// --- NTP TIME SYNC (SRE CLOCK) ---
router.get('/time', (req, res) => {
    res.json({ 
        serverTime: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
});

router.get('/ai-keys', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.getAll);
router.post('/ai-keys', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.create);
router.put('/ai-keys/:id', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.update);
router.delete('/ai-keys/:id', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.delete);

// --- WIKI ROUTES ---
router.get('/wiki', authenticateToken, wikiHandlers.getAll);
router.get('/wiki/:id', authenticateToken, wikiHandlers.getOne);
router.post('/wiki', authenticateToken, checkPermission('manage_settings'), wikiHandlers.create);
router.put('/wiki/:id', authenticateToken, checkPermission('manage_settings'), wikiHandlers.update);
router.delete('/wiki/:id', authenticateToken, checkPermission('manage_settings'), wikiHandlers.delete);

// --- STUDIO TOKENS ENGINE ---
/** 
 * SRE FIX: Rota de leitura (GET) tornada pública para permitir que a tela de login 
 * e componentes públicos carreguem o branding correto. 
 */
router.get('/studio-tokens', async (req, res) => {
    try {
        const [[tokens]] = await pool.query("SELECT * FROM studio_tokens WHERE id = 1");
        if (tokens) {
            try {
                if (tokens.config_json) {
                    return res.json(JSON.parse(tokens.config_json));
                }
            } catch (e) { }
            return res.json({
                desktop: {
                    borderRadius: tokens.border_radius,
                    containerPadding: tokens.container_padding,
                    shadowIntensity: parseFloat(tokens.shadow_intensity),
                    fontSizeBase: tokens.font_size_base,
                    fontScale: parseFloat(tokens.font_scale),
                    primaryColor: tokens.primary_color,
                    sidebarWidth: 280,
                    viewportPadding: 32
                },
                mobile: {
                    borderRadius: tokens.border_radius,
                    containerPadding: tokens.container_padding,
                    shadowIntensity: parseFloat(tokens.shadow_intensity),
                    fontSizeBase: tokens.font_size_base,
                    fontScale: parseFloat(tokens.font_scale),
                    primaryColor: tokens.primary_color,
                    sidebarWidth: 280,
                    viewportPadding: 16
                }
            });
        }
        const initial = {
            borderRadius: 16, containerPadding: 24, shadowIntensity: 0.1,
            fontSizeBase: 16, fontScale: 1.2, primaryColor: "#4f46e5",
            sidebarWidth: 280, viewportPadding: 32
        };
        res.json({ desktop: initial, mobile: initial });
    } catch (e) {
        console.error("[SRE STUDIO GET FAIL]", e.message);
        res.status(500).json({ error: e.message });
    }
});

// A escrita (POST) permanece bloqueada para ADMIN
router.post('/studio-tokens', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const config = req.body;
        const primary = config.desktop || config;
        const sql = `
            INSERT INTO studio_tokens 
            (id, border_radius, container_padding, shadow_intensity, font_size_base, font_scale, primary_color, config_json) 
            VALUES (1, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            border_radius=VALUES(border_radius), 
            container_padding=VALUES(container_padding), 
            shadow_intensity=VALUES(shadow_intensity), 
            font_size_base=VALUES(font_size_base), 
            font_scale=VALUES(font_scale), 
            primary_color=VALUES(primary_color),
            config_json=VALUES(config_json)
        `;
        await pool.query(sql, [
            primary.borderRadius || 16,
            primary.containerPadding || 24,
            primary.shadowIntensity || 0.1,
            primary.fontSizeBase || 16,
            primary.fontScale || 1.2,
            primary.primaryColor || "#4f46e5",
            JSON.stringify(config)
        ]);
        
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "UPDATE_DESIGN_SYSTEM", "studio_tokens", 1, ?)',
            [req.user?.id || 0, `Novo ecossistema visual aplicado.`]
        );
        res.json({ success: true });
    } catch (e) {
        console.error("[SRE STUDIO POST FAIL]", e.message);
        res.status(500).json({ error: e.message });
    }
});

router.get('/permissions/my', authenticateToken, async (req, res) => {
    try {
        if (req.user.virtual || req.user.role === 'ADMIN') {
            return res.json({ data: ['*'] });
        }
        const [rows] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [req.user.role]);
        res.json({ data: rows.map(r => r.permission_id) });
    } catch (e) { res.status(500).json({ error: 'ERRO_SYNC_PERMISSOES' }); }
});

router.get('/roles', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles ORDER BY label ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: 'ERRO_LISTA_CARGOS' }); }
});

router.post('/roles', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { id, label } = req.body;
    if (!id || !label) return res.status(400).json({ error: 'DADOS_INCOMPLETOS' });
    try {
        await pool.query('INSERT INTO roles (id, label) VALUES (?, ?)', [id.toUpperCase(), label]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_CRIAR_CARGO' }); }
});

router.put('/roles/:id', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { label } = req.body;
    try {
        await pool.query('UPDATE roles SET label = ? WHERE id = ?', [label, req.params.id.toUpperCase()]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_ATUALIZAR_CARGO' }); }
});

router.delete('/roles/:id', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const roleId = req.params.id.toUpperCase();
        const protectedRoles = ['ADMIN', 'RESIDENT', 'MORADOR', 'DIRETORIA'];
        if (protectedRoles.includes(roleId)) return res.status(400).json({ error: 'CARGO_PROTEGIDO' });
        await pool.query('DELETE FROM roles WHERE id = ?', [roleId]);
        await pool.query('DELETE FROM role_permissions WHERE role = ?', [roleId]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_DELETAR' }); }
});

router.get('/permissions', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM role_permissions');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: 'ERRO_RBAC' }); }
});

router.post('/permissions/toggle', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { role, permission_id, active } = req.body;
    try {
        if (active) {
            await pool.query('INSERT IGNORE INTO role_permissions (role, permission_id) VALUES (?, ?)', [role, permission_id]);
        } else {
            await pool.query('DELETE FROM role_permissions WHERE role = ? AND permission_id = ?', [role, permission_id]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'ERRO_RBAC' }); }
});

router.get('/system', async (req, res) => {
    try {
        const [[s]] = await pool.query('SELECT * FROM settings WHERE id=1');
        if (!s) return res.status(404).json({ error: 'KERNEL_NOT_INITIALIZED' });
        res.json(parseSystemConfig(s));
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_LER_KERNEL' }); }
});

router.put('/system', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        // Fusão: Lista combinada do Passo 1 e Passo 2
        const allowed = [
            'name', 'shortName', 'cnpj', 'address', 'email', 'phone', 'website', 
            'primaryColor', 'registrationMode', 'logoUrl', 'resident_ui_settings', 
            'whatsapp_config', 'module_metadata', 'president_name', 'president_cpf', 
            'management_start', 'management_end', 'president_signature', 'coordinates', 
            'context_rules', 'dictionary', 'cep', 'street', 'number', 'complement', 
            'neighborhood', 'city', 'state'
        ];
        const payload = {};
        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                payload[field] = (typeof req.body[field] === 'object' && req.body[field] !== null) ? JSON.stringify(req.body[field]) : req.body[field];
            }
        });
        if (Object.keys(payload).length === 0) return res.json({ success: true });
        
        await pool.query('UPDATE settings SET ? WHERE id=1', [payload]);
        
        await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "UPDATE_SYSTEM_INFO", "settings", 1, "Sincronização Master do Kernel")', [req.user?.id || 0]);
        
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_UPDATE' }); }
});

export default router;
