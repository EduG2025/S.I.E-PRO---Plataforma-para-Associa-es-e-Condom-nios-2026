import { GoogleGenAI, Type, Modality } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Cluster Manager - Protocolo V40.0 (SRE COMPLIANT)
 * Configurado para Gemini 3 Flash Preview (Free Tier) e Resiliência Crítica.
 */
export const IAProviderManager = {

    MODELS: {
        FAST: 'gemini-3-flash-preview',
        INTELLIGENT: 'gemini-3-flash-preview', // Forçado Flash para manter Free Tier
        IMAGE: 'gemini-2.5-flash-image',
        TTS: 'gemini-2.5-flash-preview-tts',
        LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
    },

    async getAvailableKeys() {
        try {
            // SRE FIX: Busca unificada por chaves ativas no pool de failover
            const [rows] = await pool.query(`
                SELECT id, key_value, model, tier 
                FROM ai_keys 
                WHERE status = 'active' 
                AND error_count < 10 
                ORDER BY priority DESC, created_at ASC
            `);

            return rows.map(r => ({
                id: r.id,
                val: (r.key_value || '').trim(),
                preferred: r.model || this.MODELS.FAST,
                tier: r.tier
            })).filter(k => k.val.length > 10);
        } catch (e) {
            console.error("[SRE IA DB ERROR]", e.message);
            return [];
        }
    },

    sanitizeOutput(text) {
        if (!text) return "";
        if (typeof text !== 'string') return JSON.stringify(text);
        // Remove blocos de código markdown para retorno limpo ao frontend
        return text
            .replace(/^```[a-z]*\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
    },

    async execute(task, payload) {
        const keysPool = await this.getAvailableKeys();

        // Injeta chave mestre do ambiente se o banco estiver vazio
        if (keysPool.length === 0 && process.env.API_KEY) {
            keysPool.push({
                id: 0,
                val: process.env.API_KEY.trim(),
                preferred: this.MODELS.FAST,
                tier: 'MASTER_ENV'
            });
        }

        if (keysPool.length === 0) {
            throw new Error("SRE_CRITICAL: Cluster Neural Exaurido. Nenhuma chave válida.");
        }

        let lastError = null;

        for (const keyObj of keysPool) {
            try {
                // SRE SDK SYNC: Uso obrigatório de GoogleGenAI com objeto de config
                const ai = new GoogleGenAI({ apiKey: keyObj.val });

                // --- FLUXO DE VOZ (TTS) ---
                if (task === 'tts') {
                    const response = await ai.models.generateContent({
                        model: this.MODELS.TTS,
                        contents: [{ parts: [{ text: payload.contents }] }],
                        config: {
                            responseModalities: [Modality.AUDIO],
                            speechConfig: {
                                voiceConfig: { 
                                    prebuiltVoiceConfig: { voiceName: payload.voice || 'Kore' } 
                                }
                            }
                        }
                    });
                    const base64Audio = response.candidates?.[0]?.content?.parts[0]?.inlineData?.data;
                    return { audio: base64Audio };
                }

                // --- FLUXO INTELIGENTE (TEXT/JSON) ---
                const modelName = this.MODELS.FAST;

                const config = {
                    systemInstruction: payload.config?.systemInstruction || "Você é o Advisor Mentor do S.I.E PRO.",
                    temperature: payload.config?.temperature ?? 0.7,
                    responseMimeType: payload.config?.responseMimeType,
                    responseSchema: payload.config?.responseSchema,
                    // Desativado thinkingBudget para maximizar cota Free Tier
                    thinkingConfig: { thinkingBudget: 0 }
                };

                // Grounding via Google Search (Opcional)
                if (payload.useSearch) {
                    config.tools = [{ googleSearch: {} }];
                }

                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: payload.contents,
                    config: config,
                });

                // SRE SDK SYNC: Acesso via propriedade .text (não é método)
                const rawText = response.text;
                if (!rawText) throw new Error("NEURAL_EMPTY_SIGNAL");

                // Audit Sync: Reseta contador de erros em caso de sucesso
                if (keyObj.id !== 0) {
                    await pool.query("UPDATE ai_keys SET error_count = 0, last_checked = NOW() WHERE id = ?", [keyObj.id]);
                }

                // Extração de Grounding (Links Externos)
                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

                return {
                    text: this.sanitizeOutput(rawText),
                    groundingChunks: groundingChunks
                };

            } catch (error) {
                const maskedKey = keyObj.val.slice(-4);
                console.warn(`[SRE FAILOVER] Nodo Neural ${keyObj.id} (...${maskedKey}) falhou: ${error.message}`);
                lastError = error;

                // Penaliza a chave no banco para o próximo ciclo de failover
                if (keyObj.id !== 0) {
                    await pool.query("UPDATE ai_keys SET error_count = error_count + 1, last_checked = NOW() WHERE id = ?", [keyObj.id]);
                }
                continue;
            }
        }

        throw new Error(`SRE_IA_FAULT: Cluster paralisado. Último erro: ${lastError?.message}`);
    }
};