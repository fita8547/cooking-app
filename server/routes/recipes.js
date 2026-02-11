import express from 'express';
import Recipe from '../models/Recipe.js';

const router = express.Router();

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
    }).limit(10);

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
router.post('/', async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
