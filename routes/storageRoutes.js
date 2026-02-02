
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// SRE: Caminho padronizado e absoluto para uploads (Raiz do Projeto)
const uploadPath = path.resolve(__dirname, '../uploads');

// Protocolo de Integridade de Diretório
if (!fs.existsSync(uploadPath)) {
    console.log(`🛡️ [SRE STORAGE] Criando diretório de mídia: ${uploadPath}`);
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Tenta garantir permissões de escrita (755)
try {
    fs.chmodSync(uploadPath, 0o755);
} catch (e) {
    console.warn(`⚠️ [SRE STORAGE] Falha ao definir permissões em ${uploadPath}: ${e.message}`);
}

// Configuração do Multer (Armazenamento Local SRE Standard)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Nome único e higienizado: timestamp + hash + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        // Remove espaços e caracteres especiais do nome original para evitar quebras em URLs de WhatsApp
        const cleanName = file.originalname.split('.')[0].replace(/\s+/g, '_').replace(/[^\w-]/g, '');
        cb(null, `sie_${cleanName}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Limite SRE: 20MB para documentos e mídia de WhatsApp
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo ${file.mimetype} não permitido pelo Kernel S.I.E`), false);
        }
    }
});

/**
 * @route POST /api/storage/upload
 * @desc  Endpoint Unificado de Mídia do Cluster
 */
router.post('/upload', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Erro Multer: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo detectado no payload.' });
            }

            // Construção da URL Pública
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.get('host');
            const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

            console.log(`✅ [SRE STORAGE] Upload Concluído: ${req.file.filename}`);

            res.json({ 
                url: fileUrl, 
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                status: 'SYNCHRONIZED'
            });
        } catch (error) {
            console.error('[SRE STORAGE FAIL]', error);
            res.status(500).json({ error: 'Falha interna no processamento de mídia.' });
        }
    });
});

export default router;
