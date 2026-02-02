import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import pool from '../config/database.js';

/**
 * S.I.E AI CONTROLLER - V15.2
 * Protocolo SRE: Inteligência com Contexto Local e Otimização de Performance Neural.
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
 * AUTO-DOC SRE: Gera manuais de instrução otimizados
 */
export const generateSystemManuals = async (req, res) => {
    const { modules } = req.body;
    try {
        // Redução de carga: Prompt mais direto para evitar geração de HTML pesado que causa timeout
        const prompt = `Atue como Documentador SRE. 
        Crie manuais de instrução CONCISOS em HTML para estes módulos:
        ${JSON.stringify(modules)}

        REQUISITOS (MÁX 1500 caracteres por manual):
        - Objetivo direto.
        - 3 Passos principais do fluxo.
        - Protocolo SRE sugerido.

        RETORNE UM JSON ARRAY:
        [
           {
             "category": "CORE|OPERATIONAL|GOVERNANCE|FINANCE",
             "title": "MANUAL: [NOME]",
             "slug": "manual-id",
             "content": "HTML CONCISO"
           }
        ]`;

        const aiResponse = await IAProviderManager.execute('auto_doc', {
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "SRE Documentation Specialist. Seja técnico e extremamente conciso para evitar latência excessiva."
            }
        });

        let entries = [];
        try {
            entries = JSON.parse(aiResponse.text);
        } catch (parseError) {
            console.error("FALHA NO PARSE AUTO-DOC:", aiResponse.text);
            throw new Error("Resposta da IA não é um JSON válido.");
        }
        
        if (!Array.isArray(entries)) entries = [entries];

        for (const entry of entries) {
            if (!entry.title || !entry.content) continue;
            await pool.query(
                "INSERT INTO wiki_entries (category, title, slug, content, is_system) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                [entry.category || 'CORE', entry.title, entry.slug || `manual-${Date.now()}`, entry.content]
            );
        }

        res.json({ success: true, count: entries.length });
    } catch (e) {
        console.error("[SRE AUTO-DOC FAIL]", e.message);
        res.status(500).json({ error: "Falha na Auto-Documentação: " + e.message });
    }
};

export const bulkWikiIngestion = async (req, res) => {
    const { rawText } = req.body;
    try {
        const prompt = `Analise o seguinte texto bruto e fragmente-o em múltiplos artigos para uma Wiki.
        TEXTO BRUTO: ${rawText}
        
        REQUISITOS DE SAÍDA (JSON ARRAY):
        [
          {
            "category": "CORE|LEGAL|FINANCE|OPERATIONAL|ESG|AI|DESIGN",
            "title": "Título Curto",
            "slug": "slug-unico",
            "content": "HTML/Markdown"
          }
        ]
        Mínimo 1 e máximo 3 artigos.`;

        const aiResponse = await IAProviderManager.execute('wiki_ingestion', {
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "SRE Wiki Architect. Organize dados brutos em doutrina estruturada JSON."
            }
        });

        let entries = [];
        try {
            entries = JSON.parse(aiResponse.text);
        } catch (parseError) {
            throw new Error("Erro ao converter resposta da IA em dados estruturados.");
        }

        if (!Array.isArray(entries)) entries = [entries];
        
        for (const entry of entries) {
            if (!entry.title || !entry.content) continue;
            await pool.query(
                "INSERT INTO wiki_entries (category, title, slug, content, is_system) VALUES (?, ?, ?, ?, 0) ON DUPLICATE KEY UPDATE content = VALUES(content)",
                [entry.category || 'OPERATIONAL', entry.title, entry.slug || `ingest-${Date.now()}`, entry.content]
            );
        }

        res.json({ success: true, count: entries.length, entries });
    } catch (e) {
        console.error("[SRE WIKI INGESTION FAIL]", e.message);
        res.status(500).json({ error: "Falha no processamento neural da Wiki: " + e.message });
    }
};

export const generateDossier = async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT id, name, cpf_cnpj, unit, age, role, status, cep, street, number, complement, neighborhood, city, state, socialData FROM users WHERE id = ?",
            [req.params.id]
        );
        if (!users.length) return res.status(404).json({ error: 'Membro não localizado.' });
        const user = users[0];
        const [financials] = await pool.query("SELECT * FROM financials WHERE user_id = ? LIMIT 50", [req.params.id]);
        const [censos] = await pool.query("SELECT answers FROM survey_responses WHERE cpf = ? LIMIT 1", [user.cpf_cnpj]);

        const context = { membro: user, ledger: financials, censo: censos[0]?.answers || {} };
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
            contents: `Ghostwriter SRE. Redija em HTML: ${prompt}. Contexto: ${context}`,
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

export const textToSpeech = async (req, res) => {
    const { text, voice } = req.body;
    try {
        const result = await IAProviderManager.execute('tts', { contents: text, voice: voice || 'Zephyr' });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
};