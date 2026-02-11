import express from 'express';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 단일 이미지 업로드
router.post('/image', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 다중 이미지 업로드 (최대 5개)
router.post('/images', authenticate, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다' });
    }

    const images = req.files.map(file => ({
      imageUrl: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size
    }));

    res.json({
      success: true,
      images
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 재료 인식용 이미지 업로드 (AI 연동 준비)
router.post('/ingredient-recognition', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    // TODO: OpenAI Vision API 연동 (예송님 작업)
    // const recognizedIngredients = await recognizeIngredients(req.file.path);

    res.json({
      success: true,
      imageUrl,
      message: 'AI 재료 인식 기능은 곧 추가됩니다',
      // recognizedIngredients: [] // AI 연동 후 활성화
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
