import express from 'express';
import Meal from '../models/Meal.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 식사 기록 생성
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipeName, date, mealType, rating, notes, nutrition, imageUrl, recipeId } = req.body;

    const meal = new Meal({
      userId: req.user._id,
      recipeId,
      recipeName,
      date: date || new Date(),
      mealType,
      rating,
      notes,
      nutrition,
      imageUrl
    });

    await meal.save();

    res.status(201).json({
      success: true,
      meal
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 식사 기록 조회 (사용자별)
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, mealType, limit = 50 } = req.query;

    const query = { userId: req.user._id };

    // 날짜 필터
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // 식사 타입 필터
    if (mealType) {
      query.mealType = mealType;
    }

    const meals = await Meal.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('recipeId');

    res.json({
      success: true,
      meals,
      count: meals.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 식사 기록 조회
router.get('/:id', authenticate, async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('recipeId');

    if (!meal) {
      return res.status(404).json({ error: '식사 기록을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      meal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 식사 기록 수정
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { recipeName, date, mealType, rating, notes, nutrition, imageUrl } = req.body;

    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!meal) {
      return res.status(404).json({ error: '식사 기록을 찾을 수 없습니다' });
    }

    // 업데이트
    if (recipeName !== undefined) meal.recipeName = recipeName;
    if (date !== undefined) meal.date = date;
    if (mealType !== undefined) meal.mealType = mealType;
    if (rating !== undefined) meal.rating = rating;
    if (notes !== undefined) meal.notes = notes;
    if (nutrition !== undefined) meal.nutrition = nutrition;
    if (imageUrl !== undefined) meal.imageUrl = imageUrl;

    await meal.save();

    res.json({
      success: true,
      meal
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 식사 기록 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!meal) {
      return res.status(404).json({ error: '식사 기록을 찾을 수 없습니다' });
    }

    res.json({
      success: true,
      message: '식사 기록이 삭제되었습니다'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 식사 통계 조회
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const meals = await Meal.find(query);

    // 통계 계산
    const stats = {
      totalMeals: meals.length,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      averageRating: 0,
      mealTypeCount: {
        '아침': 0,
        '점심': 0,
        '저녁': 0,
        '간식': 0
      }
    };

    let ratingSum = 0;
    let ratingCount = 0;

    meals.forEach(meal => {
      if (meal.nutrition) {
        stats.totalCalories += meal.nutrition.calories || 0;
        stats.totalProtein += meal.nutrition.protein || 0;
        stats.totalCarbs += meal.nutrition.carbs || 0;
        stats.totalFat += meal.nutrition.fat || 0;
      }

      if (meal.rating) {
        ratingSum += meal.rating;
        ratingCount++;
      }

      stats.mealTypeCount[meal.mealType]++;
    });

    if (ratingCount > 0) {
      stats.averageRating = (ratingSum / ratingCount).toFixed(1);
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
