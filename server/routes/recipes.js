import express from 'express';
import Recipe from '../models/Recipe.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import RecipeRecommendationService from '../services/RecipeRecommendationService.js';
import HealthInformationRepository from '../services/HealthInformationRepository.js';

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

// 레시피 추천 (재료 + 건강 정보 기반)
router.post('/recommend', optionalAuth, async (req, res) => {
  try {
    const { ingredients, userId, healthProfile } = req.body;
    
    // Input validation
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: '재료는 배열 형식이어야 합니다' });
    }

    if (ingredients.length === 0) {
      return res.status(400).json({ error: '재료를 최소 1개 이상 입력해주세요' });
    }

    // Filter out empty strings
    const validIngredients = ingredients.filter(ing => ing && typeof ing === 'string' && ing.trim().length > 0);
    
    if (validIngredients.length === 0) {
      return res.status(400).json({ error: '유효한 재료를 입력해주세요' });
    }

    // Get user ID from auth or request body
    const targetUserId = req.userId || userId;

    // Get health profile and nutrition targets
    let userHealthProfile = healthProfile;
    let nutritionTargets = null;

    if (targetUserId && !healthProfile) {
      try {
        // Fetch stored health profile
        const profileResult = await HealthInformationRepository.getProfile(targetUserId);
        if (profileResult.success && profileResult.data) {
          userHealthProfile = profileResult.data;
          nutritionTargets = profileResult.data.calculatedMetrics?.macronutrientTargets;
        }
      } catch (profileError) {
        console.warn('Failed to fetch health profile:', profileError.message);
        // Continue without health profile
      }
    } else if (healthProfile && healthProfile.calculatedMetrics) {
      nutritionTargets = healthProfile.calculatedMetrics.macronutrientTargets;
    }

    // Get recommendations
    const recommendations = await RecipeRecommendationService.recommendRecipes(
      validIngredients,
      userHealthProfile,
      nutritionTargets,
      targetUserId
    );

    // Handle empty results
    if (!recommendations.exactMatches && !recommendations.extendedMatches) {
      return res.json({
        exactMatches: [],
        extendedMatches: [],
        nutritionTargets: nutritionTargets,
        calculatedMetrics: userHealthProfile?.calculatedMetrics,
        message: '추천 가능한 레시피가 없습니다. 다른 재료를 추가해보세요.'
      });
    }

    // Response
    res.json({
      exactMatches: recommendations.exactMatches || [],
      extendedMatches: recommendations.extendedMatches || [],
      nutritionTargets: nutritionTargets,
      calculatedMetrics: userHealthProfile?.calculatedMetrics
    });

  } catch (error) {
    console.error('Recipe recommendation error:', error);
    
    // Handle specific error types
    if (error.message.includes('OpenAI')) {
      return res.status(503).json({ 
        error: 'AI 서비스가 일시적으로 사용 불가능합니다. 잠시 후 다시 시도해주세요.' 
      });
    }
    
    res.status(500).json({ error: '레시피 추천 중 오류가 발생했습니다' });
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
