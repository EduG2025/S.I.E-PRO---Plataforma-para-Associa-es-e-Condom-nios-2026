import pool from '../config/database.js';

const tables = ['surveys', 'assets'];

async function safeAlter(table) {
    console.log(`\n--- Migrating table: ${table}`);
    try {
        // Try to modify column to BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY
        const alterSql = `ALTER TABLE \`${table}\` MODIFY COLUMN \`id\` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY`;
        console.log('Running:', alterSql);
        await pool.query(alterSql);
        console.log(`ALTER applied on ${table} (id set to AUTO_INCREMENT PRIMARY KEY)`);
    } catch (e) {
        console.warn(`Could not run MODIFY PRIMARY on ${table}:`, e && e.message ? e.message : e);
    }

    try {
        const [[{ maxId }]] = await pool.query(`SELECT COALESCE(MAX(id), 0) as maxId FROM \`${table}\``);
        const next = (parseInt(maxId, 10) || 0) + 1;
        if (next > 1) {
            const autoSql = `ALTER TABLE \`${table}\` AUTO_INCREMENT = ${next}`;
            console.log('Setting AUTO_INCREMENT to', next);
            await pool.query(autoSql);
            console.log(`AUTO_INCREMENT set to ${next} on ${table}`);
        } else {
            console.log(`Table ${table} appears empty (maxId=0); skipping AUTO_INCREMENT set`);
        }
    } catch (e) {
        console.warn(`Could not set AUTO_INCREMENT on ${table}:`, e && e.message ? e.message : e);
    }
}

async function run() {
    try {
        for (const t of tables) {
            await safeAlter(t);
        }
    } catch (e) {
        console.error('Migration run failed:', e && e.message ? e.message : e);
        process.exitCode = 2;
    } finally {
        try { await pool.end(); } catch (e) { /* ignore */ }
    }
}

run();
