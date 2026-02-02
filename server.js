
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import apiRoutes from './routes/api.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const UPLOAD_DIR = path.join(__dirname, 'uploads');

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

const addColumnSafe = async (table, column, definition) => {
    try {
        const [columns] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
        if (columns.length === 0) {
            console.log(`🛡️ [SRE HEAL] Injetando coluna ${column} em ${table}...`);
            await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
    } catch (e) {
        if (e.code !== 'ER_NO_SUCH_TABLE') {
            console.error(`🚨 [SRE HEAL FAIL] Coluna ${column} em ${table}:`, e.message);
        }
    }
};

const healSchema = async () => {
    console.log("🛡️ [SRE HEAL] Auditando integridade do Kernel S.I.E PRO...");
    try {
        const coreTables = [
            `CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), primaryColor VARCHAR(20) DEFAULT "#4f46e5", whatsapp_config JSON, module_metadata JSON, dictionary JSON, context_rules TEXT, cep VARCHAR(10), street VARCHAR(255), city VARCHAR(255), state VARCHAR(2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255), provider VARCHAR(50), model VARCHAR(100), tier VARCHAR(20), status VARCHAR(20), priority INT, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS wiki_entries (id INT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(50), title VARCHAR(255), slug VARCHAR(255) UNIQUE, content LONGTEXT, is_system TINYINT(1) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS studio_tokens (id INT PRIMARY KEY, border_radius INT, container_padding INT, shadow_intensity DECIMAL(3,2), font_size_base INT, font_scale DECIMAL(3,2), primary_color VARCHAR(20), config_json JSON) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS plans (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, price DECIMAL(10, 2) NOT NULL, billing_cycle ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly', active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS subscriptions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, plan_id INT NOT NULL, status ENUM('active', 'inactive', 'suspended') DEFAULT 'active', start_date DATE NOT NULL, last_billing_date DATE, next_billing_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_sub_user (user_id)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), user_name VARCHAR(255), answers JSON, risk_score INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS vehicles (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, plate VARCHAR(20) NOT NULL UNIQUE, brand VARCHAR(50), model VARCHAR(100), color VARCHAR(30), unit VARCHAR(50), type VARCHAR(20), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS access_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, visitor_id INT, direction VARCHAR(10), method VARCHAR(20), point VARCHAR(100), photo_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(255), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20), error_log TEXT, sent_at DATETIME, campaign_id INT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS automation_rules (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(100), conditions JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS campaigns (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(100), rule_id INT, template_id INT, status VARCHAR(20) DEFAULT 'DRAFT', total_targets INT DEFAULT 0, sent_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`
        ];

        for (const sql of coreTables) { try { await pool.query(sql); } catch (e) { console.warn("Table Init Warn:", e.message); } }

        // HEALING COLUMNS (FINANCIALS & OPERATIONS)
        await addColumnSafe('financials', 'plan_id', 'INT DEFAULT NULL AFTER user_id');
        await addColumnSafe('financials', 'due_date', 'DATE DEFAULT NULL AFTER amount');
        await addColumnSafe('financials', 'is_recurring', 'TINYINT(1) DEFAULT 0 AFTER type');
        await addColumnSafe('scheduled_broadcasts', 'campaign_id', 'INT DEFAULT NULL');
        
        // HEALING COLUMNS (SURVEYS)
        await addColumnSafe('survey_responses', 'risk_score', 'INT DEFAULT 0');
        await addColumnSafe('survey_responses', 'user_id', 'INT NULL');
        
        // HEALING COLUMNS (USERS - CRITICAL FOR CENSUS V2)
        await addColumnSafe('users', 'socialData', 'JSON');
        await addColumnSafe('users', 'cep', 'VARCHAR(20)');
        await addColumnSafe('users', 'street', 'VARCHAR(255)');
        await addColumnSafe('users', 'number', 'VARCHAR(20)');
        await addColumnSafe('users', 'complement', 'VARCHAR(100)');
        await addColumnSafe('users', 'neighborhood', 'VARCHAR(100)');
        await addColumnSafe('users', 'city', 'VARCHAR(100)');
        await addColumnSafe('users', 'state', 'VARCHAR(5)');
        await addColumnSafe('users', 'rg', 'VARCHAR(20)');
        await addColumnSafe('users', 'issuing_authority', 'VARCHAR(50)');
        await addColumnSafe('users', 'gender', 'VARCHAR(20)');
        await addColumnSafe('users', 'profession', 'VARCHAR(100)');
        await addColumnSafe('users', 'resident_type', 'VARCHAR(20) DEFAULT "TITULAR"');
        await addColumnSafe('users', 'voting_rights', 'TINYINT(1) DEFAULT 1');
        await addColumnSafe('users', 'preferred_channel', 'VARCHAR(20) DEFAULT "WHATSAPP"');
        
        // SRE WATCHDOG FIX: Colunas de log de mensageria
        await addColumnSafe('scheduled_broadcasts', 'sent_at', 'DATETIME NULL');
        await addColumnSafe('scheduled_broadcasts', 'error_log', 'TEXT NULL');

    } catch (e) { console.error("Critical Healing Fail:", e.message); }
};

/**
 * HELPER: RESOLVE TEMPLATE VARIABLES
 */
const resolveTemplate = (content, data) => {
    if (!content) return "";
    let resolved = content;
    Object.entries(data).forEach(([key, val]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        resolved = resolved.replace(regex, val || '');
    });
    return resolved;
};

/**
 * SRE MESSENGER WORKER: Processa a fila de mensagens
 * Executa a cada 10 segundos para garantir near-realtime
 */
const runMessageQueue = async () => {
    try {
        const [pending] = await pool.query(`
            SELECT sb.*, u.phone, u.name as user_name, u.unit 
            FROM scheduled_broadcasts sb
            LEFT JOIN users u ON sb.target_value = u.id
            WHERE sb.status = 'PENDING' AND sb.scheduled_at <= NOW()
            LIMIT 20
        `);

        if (pending.length === 0) return;

        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        let config = settings?.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);
        
        if (!config?.api_key || !config?.gateway_url) return;

        const rawBase = config.gateway_url;
        const baseUrl = rawBase.replace(/\/send-message$/, '').replace(/\/send-media$/, '').replace(/\/send-button$/, '').replace(/\/$/, '');

        for (const item of pending) {
            try {
                // Se não achou telefone no join (ex: target manual), tenta usar o valor direto se for número
                let phone = item.phone;
                if (!phone && /^\d+$/.test(item.target_value)) {
                    phone = item.target_value;
                }
                
                if (!phone) {
                    await pool.query('UPDATE scheduled_broadcasts SET status = "FAILED", error_log = "NO_PHONE" WHERE id = ?', [item.id]);
                    continue;
                }

                // Resolver Template
                let message = item.message_body;
                let mediaUrl = null;
                let mediaType = 'image';

                if (item.template_id) {
                    const [[tpl]] = await pool.query('SELECT content, media_url, media_type FROM message_templates WHERE id = ?', [item.template_id]);
                    if (tpl) {
                        message = tpl.content;
                        mediaUrl = tpl.media_url;
                        mediaType = tpl.media_type;
                    }
                }

                // Resolver Variáveis
                const context = {
                    nome: (item.user_name || 'Membro').split(' ')[0],
                    unidade: item.unit || '---',
                    sigla: settings.shortName
                };
                
                const finalMessage = resolveTemplate(message, context);
                
                // Normalizar Telefone (BR)
                const cleanPhone = phone.replace(/\D/g, '');
                const targetNumber = cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone;

                const payload = {
                    api_key: config.api_key,
                    sender: config.sender,
                    number: targetNumber,
                    message: finalMessage,
                    footer: config.footer
                };

                const endpoint = mediaUrl ? `${baseUrl}/send-media` : `${baseUrl}/send-message`;

                if (mediaUrl) {
                    payload.url = mediaUrl;
                    payload.media_type = mediaType || 'image';
                    payload.caption = finalMessage;
                    delete payload.message;
                }

                await axios.post(endpoint, payload);
                await pool.query('UPDATE scheduled_broadcasts SET status = "SENT", sent_at = NOW() WHERE id = ?', [item.id]);
                
                // SRE: Update Campaign Stats if linked
                if (item.campaign_id) {
                    await pool.query('UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?', [item.campaign_id]);
                }

            } catch (err) {
                console.error(`[SRE MSG FAIL] ID ${item.id}:`, err.message);
                await pool.query('UPDATE scheduled_broadcasts SET status = "FAILED", error_log = ? WHERE id = ?', [err.message.substring(0, 255), item.id]);
            }
        }
    } catch (e) {
        console.error("Queue Error:", e.message);
    }
};

/**
 * SRE BILLING WORKER: Automação Diária de Recorrência
 */
const runBillingCycle = async () => {
    console.log("💰 [SRE BILLING] Verificando ciclo de faturamento recorrente...");
    try {
        const [subs] = await pool.query(`
            SELECT s.*, p.price, p.name as plan_name, u.name as user_name 
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'active' AND (s.next_billing_date <= CURDATE() OR s.next_billing_date IS NULL)
        `);

        for (const sub of subs) {
            await pool.query(`
                INSERT INTO financials (user_id, plan_id, description, amount, due_date, type, is_recurring, category, status, date)
                VALUES (?, ?, ?, ?, ?, 'INCOME', 1, 'CONDOMÍNIO', 'PENDING', CURDATE())
            `, [sub.user_id, sub.plan_id, `COBRANÇA: ${sub.plan_name}`, sub.price, sub.next_billing_date || new Date()]);

            let nextDate = new Date();
            if (sub.next_billing_date) nextDate = new Date(sub.next_billing_date);
            nextDate.setMonth(nextDate.getMonth() + 1);

            await pool.query(`UPDATE subscriptions SET last_billing_date = CURDATE(), next_billing_date = ? WHERE id = ?`, [nextDate, sub.id]);
        }
    } catch (e) { console.error("🛑 BILLING CYCLE ERROR:", e.message); }
};

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', apiRoutes);

const boot = async () => {
    initStorage();
    await healSchema(); 
    
    // Workers SRE
    runBillingCycle();
    setInterval(runBillingCycle, 1000 * 60 * 60 * 12); // Billing: 12h
    
    console.log("📨 [SRE WORKER] Iniciando processador de fila de mensagens...");
    setInterval(runMessageQueue, 10000); // Messenger: 10s

    app.listen(PORT, () => {
        console.log(`🚀 [S.I.E PRO KERNEL] Sistema Ativo | Porta ${PORT}`);
    });
};
boot();
