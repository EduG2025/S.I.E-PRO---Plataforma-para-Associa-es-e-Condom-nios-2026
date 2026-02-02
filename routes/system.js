import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

/**
 * CONFIGURAÇÃO SRE - MEDIA BRIDGE STORAGE
 * Mapeamento direto para o diretório de assets públicos do Nginx
 */
const UPLOAD_DIR = '/home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space/uploads/';

// Garante existência do diretório sem comprometer permissões globais
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Normalização SRE: Timestamp + Nome Limpo para evitar quebras de URL
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
        cb(null, `${uniqueSuffix}-${cleanName}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'audio/mpeg', 'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido pelo protocolo de segurança S.I.E'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

/**
 * @route POST /api/system/upload
 * @desc  Upload de anexos para Messenger e Identidade Visual
 */
router.post('/upload', authenticateToken, checkPermission('manage_communication'), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo detectado no payload.' });
        }

        // URL gerada para consumo imediato pelo Gateway de Mensagens
        const publicUrl = `https://admcacaria.jennyai.space/uploads/${req.file.filename}`;

        res.json({
            message: 'Media Bridge: Upload concluído',
            url: publicUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error(`[SRE ERROR] Upload Failure: ${error.message}`);
        res.status(500).json({ error: 'Falha no processamento interno do storage.' });
    }
});

export default router;