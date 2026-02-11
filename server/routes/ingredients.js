import express from 'express';
import Ingredient from '../models/Ingredient.js';

const router = express.Router();

// 재료 목록 조회
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId가 필요합니다' });
    }

    const ingredients = await Ingredient.find({ userId }).sort({ addedDate: -1 });
    res.json({ ingredients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 재료 추가
router.post('/', async (req, res) => {
  try {
    const ingredient = new Ingredient(req.body);
    await ingredient.save();
    res.status(201).json({ success: true, ingredient });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 재료 수정
router.put('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!ingredient) {
      return res.status(404).json({ error: '재료를 찾을 수 없습니다' });
    }
    
    res.json({ success: true, ingredient });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 재료 삭제
router.delete('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    
    if (!ingredient) {
      return res.status(404).json({ error: '재료를 찾을 수 없습니다' });
    }
    
    res.json({ success: true, message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
