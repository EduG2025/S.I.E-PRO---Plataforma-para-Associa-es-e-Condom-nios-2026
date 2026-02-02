import pool from '../config/database.js';

/**
 * S.I.E PRO - FINANCIAL ENGINE V12.8
 * Inteligência de Fluxo de Caixa e Balanço em Tempo Real
 */
export const getStats = async (req, res) => {
    try {
        // Execução em Paralelo (Performance SRE: reduz latência de 4 queries para 1)
        const [incomeRes, pendingRes, donationsRes, expenseRes] = await Promise.all([
            pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type="INCOME" AND status="PAID"'),
            pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE status="PENDING"'),
            pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE category="DOAÇÃO"'),
            pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type="EXPENSE" AND status="PAID"')
        ]);

        const income = parseFloat(incomeRes[0][0].total);
        const pending = parseFloat(pendingRes[0][0].total);
        const donations = parseFloat(donationsRes[0][0].total);
        const expense = parseFloat(expenseRes[0][0].total);
        
        // Balanço Líquido (Realizado)
        const balance = income - expense;

        res.json({
            balance,
            income,
            pending,
            donations,
            expense,
            health_score: income > expense ? 'POSITIVE' : 'CRITICAL',
            timestamp: new Date()
        });
    } catch (e) { 
        console.error("[SRE FINANCE_STATS FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_PROCESSAR_BALANCO" }); 
    }
};

/**
 * ÁREA DO MORADOR: Consulta de Débitos e Histórico Pessoal
 */
export const getMyInvoices = async (req, res) => {
    try {
        const userId = req.user.id; // Injetado pelo authenticateToken
        const [rows] = await pool.query(
            "SELECT id, title, amount, due_date, status, category, type FROM financials WHERE user_id = ? ORDER BY due_date DESC", 
            [userId]
        );
        
        res.json({ data: rows });
    } catch (e) {
        console.error("[SRE MY_INVOICES FAIL]", e);
        res.status(500).json({ error: "ERRO_AO_BUSCAR_SUAS_CONTAS" });
    }
};

/**
 * RELATÓRIOS DE AUDITORIA (TRILHA FINANCEIRA)
 */
export const getReports = async (req, res) => {
    try {
        // Join com a tabela de usuários para saber QUEM fez a alteração no financeiro
        const [rows] = await pool.query(`
            SELECT a.*, u.name as operator_name 
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.table_name = "financials" 
            ORDER BY a.created_at DESC 
            LIMIT 100
        `);
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: "ERRO_AO_GERAR_RELATORIO" }); 
    }
};

/**
 * LOG DE EXPORTAÇÃO (COMPLIANCE LGPD)
 * Registra quem baixou dados financeiros e com quais filtros.
 */
export const logReportExport = async (req, res) => {
    try {
        const userId = req.user.id;
        const details = {
            format: req.body.format || 'PDF/EXCEL',
            filters: req.body.filters || {},
            ip: req.ip,
            timestamp: new Date()
        };

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, details) VALUES (?, "EXPORT_REPORT", "financials", ?)', 
            [userId, JSON.stringify(details)]
        );
        
        res.json({ success: true, message: "Exportação registrada para auditoria." });
    } catch (e) { 
        res.status(500).json({ error: "FALHA_AO_REGISTRAR_AUDITORIA" }); 
    }
};