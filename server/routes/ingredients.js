import express from 'express';
import IngredientRepository from '../services/IngredientRepository.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 재료 개수 조회
router.get('/count', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await IngredientRepository.getIngredientCount(userId);

    if (result.success) {
      res.json({ count: result.data });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Get ingredient count error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 재료 목록 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await IngredientRepository.getIngredients(userId);

    if (result.success) {
      res.json({ ingredients: result.data });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 재료 추가
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const ingredient = req.body;

    const result = await IngredientRepository.addIngredient(userId, ingredient);

    if (result.success) {
      res.json({ ingredient: result.data });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Add ingredient error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 재료 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const ingredientId = req.params.id;

    const result = await IngredientRepository.removeIngredient(userId, ingredientId);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Remove ingredient error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

export default router;
