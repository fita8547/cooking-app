import express from 'express';
import Recipe from '../models/Recipe.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 레시피 검색 및 필터링
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { 
      keyword, 
      category, 
      difficulty, 
      maxCookingTime,
      tags,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 키워드 검색 (레시피명, 설명)
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 카테고리 필터
    if (category) {
      query.category = category;
    }

    // 난이도 필터
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // 조리 시간 필터
    if (maxCookingTime) {
      query.cookingTime = { $lte: parseInt(maxCookingTime) };
    }

    // 태그 필터
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Recipe.countDocuments(query)
    ]);

    res.json({
      recipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 레시피 추천 (재료 기반)
router.post('/recommend', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: '재료를 입력해주세요' });
    }

    // 재료 이름으로 레시피 검색
    const recipes = await Recipe.find({
      'ingredients.name': { $in: ingredients }
    }).limit(20);

    // 매칭된 재료와 부족한 재료 계산
    const recipesWithMatch = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name);
      const matched = ingredients.filter(i => recipeIngredients.includes(i));
      const missing = recipeIngredients.filter(i => !ingredients.includes(i));
      
      return {
        ...recipe.toObject(),
        matchedIngredients: matched,
        missingIngredients: missing,
        matchRate: (matched.length / recipeIngredients.length * 100).toFixed(0)
      };
    });

    // 매칭률 높은 순으로 정렬
    recipesWithMatch.sort((a, b) => b.matchRate - a.matchRate);

    res.json({ recipes: recipesWithMatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 인기 레시피 조회
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // TODO: 실제로는 조회수, 좋아요 수 등으로 정렬
    const recipes = await Recipe.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ recipes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 레시피 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: '레시피를 찾을 수 없습니다' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 레시피 생성 (AI 또는 관리자)
router.post('/', authenticate, async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 레시피 수정
router.put('/:id', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!recipe) {
      return res.status(404).json({ error: '레시피를 찾을 수 없습니다' });
    }
    
    res.json({ success: true, recipe });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 레시피 삭제
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ error: '레시피를 찾을 수 없습니다' });
    }
    
    res.json({ success: true, message: '삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
