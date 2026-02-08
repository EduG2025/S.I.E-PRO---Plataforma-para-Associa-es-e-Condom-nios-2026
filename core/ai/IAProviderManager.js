import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Cluster Manager - Protocolo V46.5 (SRE COMPLIANT)
 * Gerencia chaves dinâmicas do banco com SDK v1.39
 */
export const IAProviderManager = {

    MODELS: {
        FAST: 'gemini-3-flash-preview',
        INTELLIGENT: 'gemini-3-pro-preview',
        LITE: 'gemini-flash-lite-latest',
    },

    async getAvailableKeys() {
        try {
            const [rows] = await pool.query(`
                SELECT key_value, model 
                FROM ai_keys 
                WHERE status = 'active' 
                AND error_count < 10 
                ORDER BY priority DESC
            `);
            return rows;
        } catch (e) {
            console.error("[SRE IA DB ERROR]", e.message);
            return [];
        }
    },

    async execute(task, payload, retries = 2) {
        const keysPool = await this.getAvailableKeys();
        
        // Fallback Master Key (.env) 
        const masterKey = process.env.API_KEY;
        const availableKeys = keysPool.length > 0 ? keysPool.map(k => k.key_value) : [masterKey];

        if (!availableKeys[0]) {
            throw new Error("SRE_CRITICAL: Cluster Neural Exaurido. Nenhuma chave válida.");
        }

        const selectedKey = availableKeys[0];
        
        try {
            // Inicialização conforme protocolo v1.39 (named parameter obrigatório)
            const ai = new GoogleGenAI({ apiKey: selectedKey });
            const targetModel = payload.model || this.MODELS.FAST;
            
            const response = await ai.models.generateContent({
                model: targetModel,
                contents: payload.contents,
                config: {
                    systemInstruction: payload.config?.systemInstruction || "Você é o Advisor S.I.E PRO.",
                    temperature: payload.config?.temperature ?? 0.7,
                    responseMimeType: payload.config?.responseMimeType,
                    responseSchema: payload.config?.responseSchema,
                    ...(targetModel === this.MODELS.INTELLIGENT ? { 
                        thinkingConfig: { thinkingBudget: 16000 } 
                    } : {})
                },
            });

            const text = response.text;
            if (text === undefined) throw new Error("NEURAL_EMPTY_SIGNAL");

            return {
                text: text.replace(/^```json|```$/g, "").trim(),
                model: targetModel,
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
            };

        } catch (error) {
            console.warn(`[SRE FAILOVER] Nodo Neural falhou: ${error.message} | Tentativas restantes: ${retries}`);
            
            if (keysPool.length > 0) {
                 await pool.query("UPDATE ai_keys SET error_count = error_count + 1, last_checked = NOW() WHERE key_value = ?", [selectedKey]);
            }

            if (retries > 0) {
                // Delay exponencial simples antes da retentativa
                await new Promise(r => setTimeout(r, 1000));
                return this.execute(task, payload, retries - 1);
            }
            
            throw error;
        }
    }
};
