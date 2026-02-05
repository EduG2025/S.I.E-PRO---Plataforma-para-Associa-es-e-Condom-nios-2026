
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool, { testDatabaseConnection } from './config/database.js';
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

const healSchema = async () => {
    console.log("🛡️ [SRE HEAL] Auditando integridade do Kernel S.I.E PRO...");
    try {
        // 1. Criação de Tabelas (Idempotente) - ATUALIZADO COM SCHEMA COMPLETO
        const coreTables = [
            `CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50), permission_id VARCHAR(100), PRIMARY KEY (role, permission_id)) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY, 
                name VARCHAR(255), 
                shortName VARCHAR(50), 
                cnpj VARCHAR(50), 
                primaryColor VARCHAR(20) DEFAULT "#4f46e5", 
                logoUrl LONGTEXT,
                email VARCHAR(255),
                phone VARCHAR(20),
                website VARCHAR(255),
                cep VARCHAR(10), 
                street VARCHAR(255), 
                number VARCHAR(20),
                complement VARCHAR(255),
                neighborhood VARCHAR(255),
                city VARCHAR(255), 
                state VARCHAR(2), 
                coordinates JSON,
                president_name VARCHAR(255),
                president_cpf VARCHAR(20),
                management_start DATE,
                management_end DATE,
                president_signature LONGTEXT,
                whatsapp_config JSON, 
                module_metadata JSON, 
                dictionary JSON, 
                context_rules TEXT, 
                license_status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE', 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255), provider VARCHAR(50), model VARCHAR(100), tier VARCHAR(20), status VARCHAR(20), priority INT, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS ai_prompts (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, category VARCHAR(50) DEFAULT 'GERAL', role_restriction VARCHAR(50) DEFAULT 'ALL', is_favorite TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS visual_templates (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), paper VARCHAR(20) DEFAULT 'A4', header_html LONGTEXT, footer_html LONGTEXT, is_default TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, type VARCHAR(50), status VARCHAR(20), metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS wiki_entries (id INT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(50), title VARCHAR(255), slug VARCHAR(255) UNIQUE, content LONGTEXT, is_system TINYINT(1) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS plans (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, price DECIMAL(10, 2) NOT NULL, active TINYINT(1) DEFAULT 1) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, cpf_cnpj VARCHAR(20) UNIQUE, role VARCHAR(50), status VARCHAR(20), active TINYINT(1) DEFAULT 1, socialData JSON, coordinates JSON) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), content TEXT) ENGINE=InnoDB`,
            `CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, status VARCHAR(20), scheduled_at DATETIME) ENGINE=InnoDB`
        ];

        for (const sql of coreTables) { 
            try { await pool.query(sql); } catch (e) { console.warn("Table Init Warn:", e.message); } 
        }

        // 2. Migração de Colunas (SRE PATCH V253.0 - SYNC COMPLETO)
        const migrations = [
            { table: 'settings', column: 'license_status', type: "ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE'" },
            { table: 'ai_keys', column: 'model', type: "VARCHAR(100)" },
            { table: 'ai_keys', column: 'tier', type: "VARCHAR(20)" },
            { table: 'ai_prompts', column: 'category', type: "VARCHAR(50) DEFAULT 'GERAL'" },
            { table: 'ai_prompts', column: 'role_restriction', type: "VARCHAR(50) DEFAULT 'ALL'" },
            { table: 'ai_prompts', column: 'is_favorite', type: "TINYINT(1) DEFAULT 0" },
            { table: 'documents', column: 'metadata', type: "JSON" },
            
            // SRE SYNC: Campos de Identidade e Presidência
            { table: 'settings', column: 'logoUrl', type: "LONGTEXT" },
            { table: 'settings', column: 'email', type: "VARCHAR(255)" },
            { table: 'settings', column: 'phone', type: "VARCHAR(20)" },
            { table: 'settings', column: 'website', type: "VARCHAR(255)" },
            { table: 'settings', column: 'president_name', type: "VARCHAR(255)" },
            { table: 'settings', column: 'president_cpf', type: "VARCHAR(20)" },
            { table: 'settings', column: 'management_start', type: "DATE" },
            { table: 'settings', column: 'management_end', type: "DATE" },
            { table: 'settings', column: 'president_signature', type: "LONGTEXT" },
            
            // SRE SYNC: Campos de Endereço Detalhados
            { table: 'settings', column: 'cep', type: "VARCHAR(10)" },
            { table: 'settings', column: 'street', type: "VARCHAR(255)" },
            { table: 'settings', column: 'number', type: "VARCHAR(20)" },
            { table: 'settings', column: 'complement', type: "VARCHAR(255)" },
            { table: 'settings', column: 'neighborhood', type: "VARCHAR(255)" },
            { table: 'settings', column: 'city', type: "VARCHAR(255)" },
            { table: 'settings', column: 'state', type: "VARCHAR(2)" },
            { table: 'settings', column: 'coordinates', type: "JSON" }
        ];

        for (const m of migrations) {
            try {
                const [cols] = await pool.query(`SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`);
                if (cols.length === 0) {
                    console.log(`🔧 [SRE MIGRATION] Adicionando coluna ${m.column} em ${m.table}...`);
                    await pool.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`);
                }
            } catch (e) { console.warn(`Migration Fail (${m.table}.${m.column}):`, e.message); }
        }

        // 3. Singleton & Seed Check
        const [sets] = await pool.query("SELECT id FROM settings WHERE id = 1");
        if (sets.length === 0) {
            await pool.query("INSERT INTO settings (id, name, shortName, license_status) VALUES (1, 'S.I.E PRO - SISTEMA INTELIGENTE ATIVO', 'S.I.E PRO', 'ACTIVE')");
        }
        
        const [vTpls] = await pool.query("SELECT id FROM visual_templates LIMIT 1");
        if (vTpls.length === 0) {
            await pool.query("INSERT INTO visual_templates (name, paper, header_html, footer_html, is_default) VALUES ('PADRÃO AMC', 'A4', '<div style=\"text-align:center; padding: 20px; border-bottom: 2px solid #000;\"><h1>{entidade}</h1><p>CNPJ: {cnpj}</p></div>', '<div style=\"text-align:center; padding: 20px; font-size: 8pt; border-top: 1px solid #ccc;\">{endereco}</div>', 1)");
        }

        console.log("✅ [SRE HEAL] Kernel Sincronizado e Protegido.");

    } catch (e) { console.error("Critical Healing Fail:", e.message); }
};

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', apiRoutes);

const boot = async () => {
    initStorage();
    // SRE Protocol: Aguarda conexão com DB antes de tentar qualquer operação de Schema
    await testDatabaseConnection(); 
    await healSchema(); 
    app.listen(PORT, () => { console.log(`🚀 [S.I.E PRO KERNEL] Sistema Ativo | Porta ${PORT}`); });
};
boot();
