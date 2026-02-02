import { validationResult } from 'express-validator';

/**
 * SRE VALIDATION ENGINE V1.0
 * Intercepta erros de validação e interrompe o fluxo antes de atingir o Kernel.
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path || err.param]: err.msg }));

    console.warn(`[SRE VALIDATION ALERT] Input rejected on ${req.originalUrl}:`, extractedErrors);

    return res.status(400).json({
        error: "FALHA_DE_VALIDACAO_SRE",
        details: extractedErrors
    });
};