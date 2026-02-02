
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante carregamento do env mesmo se chamado via PM2 em outro diretório
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * CONFIGURAÇÃO DE DATABASE SRE V6.0
 * Resiliência reforçada contra quedas de socket e timeouts.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'siecacaria',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'Gegerminal180',
  database: process.env.DB_NAME || 'siecacaria',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 50, 
  queueLimit: 0,
  timezone: '-03:00',
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 60000,
  maxIdle: 10,
  idleTimeout: 60000
});

export const testDatabaseConnection = async (retries = 10) => {
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ SRE KERNEL DATABASE SYNCED | STATUS: 200 OK');
            connection.release();
            return;
        } catch (err) {
            console.error(`❌ SRE DATABASE ATTEMPT FAILED (${retries} left):`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                console.error(`DETALHE SRE: O MySQL não está respondendo em ${process.env.DB_HOST}. Verifique se o serviço está rodando.`);
            }
            
            retries -= 1;
            if (retries > 0) await new Promise(res => setTimeout(res, 3000));
        }
    }
    console.error("🛑 SRE CRITICAL: O Kernel entrará em modo degradado ou encerrará.");
    process.exit(1);
};

export default pool;
