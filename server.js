
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool, { testDatabaseConnection } from './config/database.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DIST_DIR = path.join(__dirname, 'dist');

const BOOT_TIME = Date.now();

const initStorage = () => {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) {
            console.log(`🛡️ [SRE HEAL] Criando diretório de mídia: ${UPLOAD_DIR}`);
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        fs.access(UPLOAD_DIR, fs.constants.W_OK, (err) => {
            if (err) {
                try { fs.chmodSync(UPLOAD_DIR, 0o755); } catch (e) {}
            }
        });
    } catch (e) { console.error(`🚨 [SRE BOOT FAIL] Storage:`, e.message); }
};

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const healSchema = async () => {
    console.log("🛡️ [SRE HEAL] Auditando integridade do Kernel S.I.E PRO...");
    const connection = await pool.getConnection();
    try {
        const coreTables = [
            `CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50), permission_id VARCHAR(100), PRIMARY KEY (role, permission_id)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY, 
                name VARCHAR(255), 
                shortName VARCHAR(50), 
                cnpj VARCHAR(50), 
                primaryColor VARCHAR(20) DEFAULT "#4f46e5", 
                logoUrl LONGTEXT,
                whatsapp_config JSON, 
                module_metadata JSON, 
                dictionary JSON, 
                license_status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE', 
                resident_ui_settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255), provider VARCHAR(50), model VARCHAR(100), tier VARCHAR(20), status VARCHAR(20), priority INT, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS ai_prompts (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, category VARCHAR(50) DEFAULT 'GERAL', role_restriction VARCHAR(50) DEFAULT 'ALL', is_favorite TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(100) UNIQUE, cpf_cnpj VARCHAR(20) UNIQUE, password_hash VARCHAR(255), email VARCHAR(255), role VARCHAR(50), status VARCHAR(20), active TINYINT(1) DEFAULT 1, unit VARCHAR(50), coordinates JSON, socialData JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_cpf (cpf_cnpj), INDEX idx_unit (unit)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, type VARCHAR(50), status VARCHAR(20), metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS document_versions (id INT AUTO_INCREMENT PRIMARY KEY, document_id INT, content LONGTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255), amount DECIMAL(15,2), type ENUM('INCOME', 'EXPENSE'), category VARCHAR(50), status ENUM('PAID', 'PENDING', 'OVERDUE', 'CANCELLED'), date DATE, due_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_user_fin (user_id)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), location VARCHAR(255), priority VARCHAR(50), status VARCHAR(20) DEFAULT 'OPEN', description TEXT, coordinates JSON, radius DECIMAL(5,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), date DATETIME, location VARCHAR(255), description TEXT, status VARCHAR(20) DEFAULT 'SCHEDULED', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS studio_tokens (id INT PRIMARY KEY, border_radius INT, container_padding INT, shadow_intensity DECIMAL(3,2), font_size_base INT, font_scale DECIMAL(3,2), primary_color VARCHAR(20), config_json JSON) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS cameras (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url TEXT, location VARCHAR(255), status VARCHAR(20) DEFAULT 'ACTIVE', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS decisions (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, ai_analysis TEXT, status ENUM('OPEN', 'CLOSED', 'EXECUTED') DEFAULT 'OPEN', due_date DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS votes (id INT AUTO_INCREMENT PRIMARY KEY, decision_id INT, user_id INT, choice ENUM('YES', 'NO', 'ABSTAIN') NOT NULL, voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY idx_user_decision (user_id, decision_id), FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS invitations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                guest_name VARCHAR(255),
                guest_document VARCHAR(50),
                visit_date DATE,
                status ENUM('PENDING', 'AUTHORIZED', 'COMPLETED', 'CANCELLED') DEFAULT 'AUTHORIZED',
                qr_code_hash VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS wiki_entries (id INT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(50), title VARCHAR(255), slug VARCHAR(100) UNIQUE, content LONGTEXT, is_system TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS visual_templates (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), header_html LONGTEXT, footer_html LONGTEXT, is_default TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, event_trigger VARCHAR(50), name VARCHAR(100), content TEXT, is_active TINYINT(1) DEFAULT 1, media_url TEXT, media_type VARCHAR(20) DEFAULT 'image', buttons JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS automation_rules (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), conditions JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS campaigns (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), rule_id INT, template_id INT, status VARCHAR(20) DEFAULT 'DRAFT', total_targets INT DEFAULT 0, sent_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(255), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20) DEFAULT 'PENDING', error_log TEXT, sent_at DATETIME, campaign_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, category VARCHAR(50), price DECIMAL(15,2), whatsapp VARCHAR(20), merchant_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, area_name VARCHAR(100), date DATE, startTime TIME, endTime TIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), content TEXT, category VARCHAR(50), status VARCHAR(20) DEFAULT 'OPEN', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS vehicles (id INT AUTO_INCREMENT PRIMARY KEY, plate VARCHAR(20) UNIQUE, brand VARCHAR(50), model VARCHAR(50), color VARCHAR(30), unit VARCHAR(50), status VARCHAR(20) DEFAULT 'AUTHORIZED', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS assets (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), value DECIMAL(15,2), status VARCHAR(50), date_acquired DATE, responsible_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS agenda (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, type VARCHAR(50), status VARCHAR(20), location VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS projects (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, budget DECIMAL(15,2), spent DECIMAL(15,2), progress INT DEFAULT 0, startDate DATE, category VARCHAR(50), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS id_card_templates (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, layout_front JSON, layout_back JSON, is_active TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`
        ];

        for (const sql of coreTables) { 
            try { await connection.query(sql); } catch (e) { console.warn("SRE TABLE SYNC WARN:", e.message); } 
        }

        const [sets] = await connection.query("SELECT id FROM settings WHERE id = 1");
        if (sets.length === 0) {
            await connection.query("INSERT INTO settings (id, name, shortName, license_status, module_metadata) VALUES (1, 'S.I.E — SISTEMA INTELIGENTE ATIVO PARA ASSOCIAÇÕES, CONDOMÍNIOS E GESTÃO COLETIVA', 'S.I.E PRO', 'ACTIVE', '{}')");
        }

        // --- SRE: Injeção Automática de Template ID Padrão (AMC) ---
        const [tpls] = await connection.query("SELECT id FROM id_card_templates LIMIT 1");
        if (tpls.length === 0) {
            console.log("🛠️ [SRE SEED] Injetando Template de Identidade Padrão AMC...");
            const defaultFront = [
                { id: 'header-bg', type: 'shape', x: 0, y: 0, width: 600, height: 95, visible: true, locked: true, style: { backgroundColor: '#15803d', zIndex: 1, borderRadius: '0px' } },
                { id: 'header-logo-bg', type: 'shape', x: 20, y: 8, width: 80, height: 80, visible: true, style: { backgroundColor: '#ffffff', borderRadius: '50%', zIndex: 2 } },
                { id: 'header-logo', type: 'image', field: 'logoUrl', x: 25, y: 13, width: 70, height: 70, visible: true, style: { zIndex: 5, backgroundColor: 'transparent', borderRadius: '50%', objectFit: 'contain' } },
                { id: 'assoc-title', type: 'text-static', value: 'ASSOCIAÇÃO DE MORADORES', x: 115, y: 35, width: 460, height: 30, visible: true, style: { color: '#ffffff', fontSize: '24px', fontWeight: '900', textAlign: 'left', zIndex: 10, letterSpacing: '0.02em', lineHeight: '1.1' } },
                { id: 'photo-frame', type: 'shape', x: 30, y: 120, width: 140, height: 170, visible: true, style: { backgroundColor: 'transparent', border: '3px solid #15803d', borderRadius: '20px', zIndex: 9 } },
                { id: 'member-photo', type: 'image', field: 'photoUrl', x: 33, y: 123, width: 134, height: 164, visible: true, style: { borderRadius: '17px', zIndex: 8, backgroundColor: '#f1f5f9', objectFit: 'cover' } },
                { id: 'lbl-name', type: 'text-static', value: 'NOME COMPLETO', x: 190, y: 125, width: 200, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, letterSpacing: '0.05em', textTransform: 'uppercase' } },
                { id: 'val-name', type: 'text-dynamic', field: 'name', x: 190, y: 142, width: 390, height: 40, visible: true, style: { fontSize: '26px', fontWeight: '900', color: '#1e293b', zIndex: 10, textAlign: 'left', lineHeight: '1.1', textTransform: 'uppercase' } },
                { id: 'lbl-rg', type: 'text-static', value: 'RG', x: 190, y: 195, width: 100, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, textTransform: 'uppercase' } },
                { id: 'val-rg', type: 'text-dynamic', field: 'rg', x: 190, y: 210, width: 180, height: 25, visible: true, style: { fontSize: '20px', fontWeight: '800', color: '#334155', zIndex: 10 } },
                { id: 'lbl-birth', type: 'text-static', value: 'NASCIMENTO', x: 400, y: 195, width: 120, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, textTransform: 'uppercase' } },
                { id: 'val-birth', type: 'text-dynamic', field: 'birth_date', x: 400, y: 210, width: 120, height: 25, visible: true, style: { fontSize: '20px', fontWeight: '800', color: '#334155', zIndex: 10 } },
                { id: 'lbl-cpf', type: 'text-static', value: 'CPF', x: 190, y: 250, width: 100, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, textTransform: 'uppercase' } },
                { id: 'val-cpf', type: 'text-dynamic', field: 'cpf_cnpj', x: 190, y: 265, width: 250, height: 25, visible: true, style: { fontSize: '22px', fontWeight: '900', color: '#1e293b', zIndex: 10 } },
                { id: 'watermark', type: 'image', field: 'logoUrl', x: 380, y: 140, width: 220, height: 220, visible: true, locked: true, style: { zIndex: 1, opacity: 0.1, backgroundColor: 'transparent' } },
                { id: 'role-badge', type: 'shape', x: 30, y: 300, width: 140, height: 32, visible: true, style: { backgroundColor: '#15803d', borderRadius: '16px', zIndex: 10 } },
                { id: 'role-text', type: 'text-dynamic', field: 'role', x: 30, y: 308, width: 140, height: 20, visible: true, style: { color: '#ffffff', fontSize: '12px', fontWeight: '900', textAlign: 'center', zIndex: 11, textTransform: 'uppercase' } },
                { id: 'footer-bg', type: 'shape', x: 0, y: 340, width: 600, height: 40, visible: true, locked: true, style: { backgroundColor: '#facc15', zIndex: 1, borderRadius: '0px' } },
                { id: 'footer-txt', type: 'text-static', value: 'DOCUMENTO OFICIAL DE IDENTIFICAÇÃO', x: 10, y: 353, width: 580, height: 15, visible: true, style: { fontSize: '11px', fontWeight: '900', color: '#000000', textAlign: 'center', zIndex: 10, textTransform: 'uppercase' } }
            ];
            const defaultBack = [
                { id: 'back-bg', type: 'shape', x: 0, y: 0, width: 600, height: 380, visible: true, locked: true, style: { backgroundColor: '#ffffff', zIndex: 1 } },
                { id: 'back-watermark', type: 'image', field: 'logoUrl', x: 200, y: 90, width: 200, height: 200, visible: true, style: { zIndex: 2, opacity: 0.1 } },
                { id: 'back-sign-line', type: 'text-static', value: '_________________________________________', x: 150, y: 150, width: 300, height: 20, visible: true, style: { color: '#cbd5e1', fontSize: '14px', fontWeight: '500', zIndex: 3, textAlign: 'center' } },
                { id: 'back-sign-img', type: 'image', field: 'signature', x: 200, y: 80, width: 200, height: 70, visible: true, style: { zIndex: 4, objectFit: 'contain' } },
                { id: 'back-sign-lbl', type: 'text-static', value: 'ASSINATURA DO PRESIDENTE', x: 150, y: 170, width: 300, height: 20, visible: true, style: { fontSize: '10px', fontWeight: '800', textAlign: 'center', color: '#64748b', zIndex: 4 } },
                { id: 'back-sign-holder-line', type: 'text-static', value: '_________________________________________', x: 150, y: 240, width: 300, height: 20, visible: true, style: { color: '#cbd5e1', fontSize: '14px', fontWeight: '500', zIndex: 3, textAlign: 'center' } },
                { id: 'back-sign-holder-lbl', type: 'text-static', value: 'ASSINATURA DO TITULAR', x: 150, y: 260, width: 300, height: 20, visible: true, style: { fontSize: '10px', fontWeight: '800', textAlign: 'center', color: '#64748b', zIndex: 4 } },
                { id: 'back-qr', type: 'qrcode', value: 'https://sie.pro/validate', x: 30, y: 260, width: 90, height: 90, visible: true, style: { zIndex: 5 } },
                { id: 'back-info', type: 'text-static', value: 'Este documento é pessoal e intransferível.\nEm caso de perda, comunique a administração imediatamente.', x: 150, y: 300, width: 400, height: 40, visible: true, style: { fontSize: '10px', color: '#334155', textAlign: 'center', fontWeight: '600', zIndex: 5 } },
                { id: 'footer-bg-back', type: 'shape', x: 0, y: 360, width: 600, height: 20, visible: true, locked: true, style: { backgroundColor: '#15803d', zIndex: 1 } }
            ];
            
            await connection.query(
                "INSERT INTO id_card_templates (name, layout_front, layout_back, is_active) VALUES (?, ?, ?, ?)",
                ["Modelo Padrão (AMC)", JSON.stringify(defaultFront), JSON.stringify(defaultBack), 1]
            );
        }
        
        console.log("✅ [SRE HEAL] Kernel Sincronizado.");
    } catch (e) { 
        console.error("Critical Healing Fail:", e.message); 
    } finally {
        connection.release();
    }
};

// SRE HEALTH ENDPOINT - REAL TELEMETRY
app.get('/health', async (req, res) => {
    try {
        const start = Date.now();
        const connection = await pool.getConnection();
        const [[sets]] = await connection.query("SELECT license_status FROM settings WHERE id = 1");
        const latency = Date.now() - start;
        connection.release();
        
        res.json({
            status: 'OPERATIONAL',
            database: 'CONNECTED',
            license: sets?.license_status || 'UNKNOWN',
            uptime: Math.floor((Date.now() - BOOT_TIME) / 1000),
            dbLatency: latency,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ status: 'DEGRADED', database: 'DISCONNECTED', error: e.message });
    }
});

// Middleware de Logs SRE
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] SRE_REQ: ${req.method} ${req.path}`);
    }
    next();
});

// Serving Static Assets
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(DIST_DIR));

// API Bridge
app.use('/api', apiRoutes);

// SPA Routing Fallback (Must be last)
app.get('*', (req, res) => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("SRE_CRITICAL: Build 'dist' não localizado. Execute 'npm run build'.");
    }
});

const boot = async () => {
    initStorage();
    await testDatabaseConnection(); 
    await healSchema(); 
    app.listen(PORT, () => { 
        console.log("--------------------------------------------------");
        console.log(`🚀 [S.I.E PRO KERNEL] ATIVO NA PORTA ${PORT}`);
        console.log(`📡 ENDPOINT API: http://localhost:${PORT}/api`);
        console.log(`📁 STATIC DIST: ${DIST_DIR}`);
        console.log("--------------------------------------------------");
    });
};
boot();
