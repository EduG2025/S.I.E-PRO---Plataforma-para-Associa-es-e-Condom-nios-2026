
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import pool from '../config/database.js';

/**
 * S.I.E AI CONTROLLER - V18.0 (VISION EXPANSION)
 * Protocolo SRE: Inteligência com Contexto Local e Visão Computacional.
 */

export const chat = async (req, res) => {
    const { contents, useSearch, useMaps } = req.body;
    try {
        const queryText = typeof contents === 'string' ? contents : JSON.stringify(contents);
        const [wikiContext] = await pool.query(
            "SELECT title, content FROM wiki_entries WHERE ? LIKE CONCAT('%', title, '%') OR ? LIKE CONCAT('%', category, '%') LIMIT 3",
            [queryText, queryText]
        );

        let localKnowledge = "";
        if (wikiContext.length > 0) {
            localKnowledge = "\nCONTEXTO DO REGIMENTO INTERNO/MANUAIS DO CLUSTER:\n" + 
                wikiContext.map(w => `--- ${w.title} ---\n${w.content}`).join("\n\n");
        }

        const tools = [];
        if (useSearch) tools.push({ googleSearch: {} });
        if (useMaps) tools.push({ googleMaps: {} });

        const result = await IAProviderManager.execute('chat', {
            contents: contents,
            config: {
                systemInstruction: `Você é o Advisor Mentor Multissetorial do S.I.E PRO. 
                Sua função é prover assistência de gestão baseada no conhecimento do sistema e nas leis vigentes.
                ${localKnowledge}
                
                DIRETRIZES:
                - Use o contexto acima (Regimento/Wiki) como verdade absoluta sobre este condomínio/associação.
                - Responda de forma clara, técnica e educada.`,
                tools: tools
            }
        });

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/**
 * NEURAL VISION LPR: Extração de metadados de veículos
 */
export const visionLPR = async (req, res) => {
    const { image } = req.body;
    try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const result = await IAProviderManager.execute('vision_lpr', {
            model: IAProviderManager.MODELS.FAST,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: "ATUE COMO: Sensor LPR SRE. Extraia em JSON: { 'plate': string, 'model': string, 'brand': string, 'color': string }. Se não houver veículo, retorne erro." }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        
        const vehicleData = JSON.parse(result.text);
        
        // Cruzamento instantâneo com o Ledger
        const [rows] = await pool.query("SELECT * FROM vehicles WHERE plate = ?", [vehicleData.plate]);
        
        res.json({
            ...vehicleData,
            status: rows.length > 0 ? 'AUTHORIZED' : 'UNKNOWN',
            owner_info: rows[0] || null
        });
    } catch (e) {
        res.status(500).json({ error: "FALHA_AO_PROCESSAR_VISAO" });
    }
};

/**
 * PERIMETER ANALYSIS: Detecção de anomalias em vídeo
 */
export const analyzePerimeter = async (req, res) => {
    const { image, location } = req.body;
    try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const result = await IAProviderManager.execute('perimeter_guard', {
            model: IAProviderManager.MODELS.FAST,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: `Analise a segurança deste perímetro (${location}). Identifique pessoas suspeitas, veículos mal posicionados ou situações de risco. Retorne um diagnóstico curto em CAIXA ALTA.` }
                ]
            }
        });
        res.json({ analysis: result.text });
    } catch (e) {
        res.status(500).json({ error: "DRONE_NEURAL_OFFLINE" });
    }
};

export const generateSystemManuals = async (req, res) => {
    const { modules } = req.body;
    try {
        const prompt = `Atue como Documentador SRE. 
        Crie manuais de instrução CONCISOS em HTML para estes módulos:
        ${JSON.stringify(modules)}
        RETORNE UM JSON ARRAY: [{ "category": "CORE", "title": "MANUAL", "slug": "manual-id", "content": "HTML" }]`;

        const aiResponse = await IAProviderManager.execute('auto_doc', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const entries = JSON.parse(aiResponse.text);
        for (const entry of entries) {
            await pool.query(
                "INSERT INTO wiki_entries (category, title, slug, content, is_system) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                [entry.category, entry.title, entry.slug, entry.content]
            );
        }
        res.json({ success: true, count: entries.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const bulkWikiIngestion = async (req, res) => {
    const { rawText } = req.body;
    try {
        const prompt = `Organize em JSON para Wiki: ${rawText}`;
        const aiResponse = await IAProviderManager.execute('wiki_ingestion', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const entries = JSON.parse(aiResponse.text);
        for (const entry of entries) {
            await pool.query(
                "INSERT INTO wiki_entries (category, title, slug, content, is_system) VALUES (?, ?, ?, ?, 0) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                [entry.category, entry.title, entry.slug, entry.content]
            );
        }
        res.json({ success: true, count: entries.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const generateDossier = async (req, res) => {
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
        const user = users[0];
        const [financials] = await pool.query("SELECT * FROM financials WHERE user_id = ? LIMIT 50", [req.params.id]);
        const context = { membro: user, ledger: financials };
        const result = await IAProviderManager.execute('dossier', {
            contents: `Gere um DOSSIÊ TÁTICO: ${JSON.stringify(context)}.`,
            config: { systemInstruction: "Analista de Risco S.I.E PRO." }
        });
        res.json({ text: result.text });
    } catch (e) { res.status(500).json({ error: "AI_DOSSIER_FAULT" }); }
};

export const generateDocument = async (req, res) => {
    const { prompt, context } = req.body;
    try {
        const result = await IAProviderManager.execute('ghostwriter', {
            contents: `HTML: ${prompt}. Contexto: ${context}`,
            config: { systemInstruction: "Ghostwriter Jurídico." }
        });
        res.json({ text: result.text });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const ocr = async (req, res) => {
    const { image, context } = req.body;
    try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const result = await IAProviderManager.execute('ocr', {
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: `Extraia JSON estruturado: ${context}` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        res.json(JSON.parse(result.text));
    } catch (e) { res.status(500).json({ error: e.message }); }
};
