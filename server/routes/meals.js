import express from 'express';
import Meal from '../models/Meal.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 식사 기록 조회 (사용자별)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, limit = 100 } = req.query;
    
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const meals = await Meal.find(query)
      .populate('recipeId')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({ meals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 식사 기록 저장
router.post('/', authenticate, async (req, res) => {
  try {
    const meal = new Meal({
      ...req.body,
      userId: req.userId
    });
    await meal.save();
    res.status(201).json({ success: true, meal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 식사 기록 조회
router.get('/history', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const meals = await Meal.find(query)
      .populate('recipeId')
      .sort({ date: -1 })
      .limit(100);

    res.json({ meals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 식사 기록 수정
router.put('/:id', authenticate, async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!meal) {
      return res.status(404).json({ error: '식사 기록을 찾을 수 없습니다' });
    }
    
    res.json({ success: true, meal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 식사 기록 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ error: '식사 기록을 찾을 수 없습니다' });
    }
    
    res.json({ success: true, message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
