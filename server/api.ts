import express, { Request, Response } from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint para upload de PDF
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  try {
    // Simulação de upload. No ambiente real, o arquivo seria enviado para um serviço de armazenamento.
    // O nome do arquivo é usado para criar uma URL mockada.
    const mockPdfUrl = `https://s3.manus.im/calculadora-telaco/${req.file.originalname}`;
    
    // Retorna a URL mockada para que o frontend possa usá-la.
    res.json({ url: mockPdfUrl });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor durante o upload.' });
  }
});

export default router;
