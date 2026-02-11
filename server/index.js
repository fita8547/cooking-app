import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '서버가 정상 작동 중입니다' });
});

// 레시피 추천 API (목업)
app.post('/api/recipes/recommend', (req, res) => {
  const { ingredients } = req.body;
  
  // 나중에 AI 연결
  const mockRecipes = [
    {
      id: 1,
      name: '김치찌개',
      ingredients: ['김치', '돼지고기', '두부', '대파'],
      matchedIngredients: ingredients.filter(i => ['김치', '돼지고기', '두부'].includes(i)),
      missingIngredients: ['대파'],
      cookingTime: 30,
      difficulty: '쉬움'
    }
  ];
  
  res.json({ recipes: mockRecipes });
});

// 식사 기록 저장 API (목업)
app.post('/api/meals', (req, res) => {
  const { recipeName, date, rating } = req.body;
  
  res.json({ 
    success: true, 
    meal: { id: Date.now(), recipeName, date, rating }
  });
});

// 식사 기록 조회 API (목업)
app.get('/api/meals/history', (req, res) => {
  const mockHistory = [
    { id: 1, recipeName: '김치찌개', date: '2026-02-10', rating: 5 },
    { id: 2, recipeName: '된장찌개', date: '2026-02-09', rating: 4 }
  ];
  
  res.json({ meals: mockHistory });
});

// 건강 프로필 저장 API (목업)
app.post('/api/profile/health', (req, res) => {
  const { age, gender, height, weight, goal } = req.body;
  
  res.json({ 
    success: true, 
    profile: { age, gender, height, weight, goal }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
