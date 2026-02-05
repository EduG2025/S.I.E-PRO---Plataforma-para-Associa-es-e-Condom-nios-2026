import { GoogleGenAI, Type, Modality } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Cluster Manager - Protocolo V44.1 (SRE COMPLIANT)
 * Suporte a Raciocínio Avançado (Thinking Budget) e Unificação de Modelos.
 * Atualização: Modelos ajustados para Flash Preview conforme diretriz de eficiência.
 */
export const IAProviderManager = {

    MODELS: {
        // Modelos de Texto/Raciocínio
        FAST: 'gemini-3-flash-preview',
        INTELLIGENT: 'gemini-3-flash-preview', // Solicitado explicitamente como Flash
        LITE: 'gemini-flash-lite-latest',

        // Modelos Especializados
        MAPS_TARGET: 'gemini-2.5-flash',
        IMAGE: 'gemini-2.5-flash-image',
        TTS: 'gemini-2.5-flash-preview-tts',
        LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025'
    },

    async getAvailableKeys() {
        try {
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
        return text
            .replace(/^```[a-z]*\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
    },

    async execute(task, payload) {
        const keysPool = await this.getAvailableKeys();

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
                    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    return { audio: base64Audio };
                }

                // --- DETERMINAÇÃO DE MODELO ---
                let targetModel = keyObj.preferred || this.MODELS.FAST;

                // Ajuste dinâmico conforme a tarefa e overrides do sistema
                if (task === 'intelligent' || payload.priority === 'high') {
                    targetModel = this.MODELS.INTELLIGENT;
                }
                // Override explícito se passado no payload
                if (payload.model) {
                    targetModel = payload.model;
                }

                // --- CONFIGURAÇÃO DE THINKING (RACIOCÍNIO) ---
                // Max para Flash: 24576. Max para Pro: 32768.
                const isPro = targetModel.includes('pro');
                const thinkingBudget = payload.config?.thinkingLevel === 'HIGH' ? (isPro ? 32000 : 24000) : 0;

                const tools = [];
                const toolConfig = {};

                if (payload.useMaps) {
                    targetModel = this.MODELS.MAPS_TARGET;
                    tools.push({ googleMaps: {} });
                    if (payload.location) {
                        toolConfig.retrievalConfig = {
                            latLng: {
                                latitude: payload.location.lat,
                                longitude: payload.location.lng
                            }
                        };
                    }
                }

                if (payload.useSearch) {
                    tools.push({ googleSearch: {} });
                }

                const config = {
                    systemInstruction: payload.config?.systemInstruction || "Você é o Advisor Mentor do S.I.E PRO.",
                    temperature: payload.config?.temperature ?? 0.7,
                    tools: tools.length > 0 ? tools : undefined,
                    toolConfig: tools.length > 0 ? toolConfig : undefined
                };

                // Adiciona thinkingConfig apenas se houver budget e modelo suportar
                if (thinkingBudget > 0 && (targetModel.includes('gemini-3') || targetModel.includes('gemini-2.5'))) {
                    config.thinkingConfig = { thinkingBudget };
                }

                // Formato de Resposta (Apenas se não houver conflito com Maps)
                if (!payload.useMaps) {
                    config.responseMimeType = payload.config?.responseMimeType;
                    config.responseSchema = payload.config?.responseSchema;
                }

                const response = await ai.models.generateContent({
                    model: targetModel,
                    contents: payload.contents,
                    config: config,
                });

                const rawText = response.text;
                if (!rawText) throw new Error("NEURAL_EMPTY_SIGNAL");

                // Audit Sync: Sucesso
                if (keyObj.id !== 0) {
                    await pool.query("UPDATE ai_keys SET error_count = 0, last_checked = NOW() WHERE id = ?", [keyObj.id]);
                }

                return {
                    text: this.sanitizeOutput(rawText),
                    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
                    model: targetModel,
                    thinkingApplied: thinkingBudget > 0
                };

            } catch (error) {
                const maskedKey = keyObj.val.slice(-4);
                console.warn(`[SRE FAILOVER] Nodo ${keyObj.id} (...${maskedKey}) falhou: ${error.message}`);
                lastError = error;

                if (keyObj.id !== 0) {
                    await pool.query("UPDATE ai_keys SET error_count = error_count + 1, last_checked = NOW() WHERE id = ?", [keyObj.id]);
                }
                continue;
            }
        }

        throw new Error(`SRE_IA_FAULT: Cluster paralisado. Último erro: ${lastError?.message}`);
    }
};