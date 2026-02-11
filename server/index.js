import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import recipesRouter from './routes/recipes.js';
import usersRouter from './routes/users.js';
import ingredientsRouter from './routes/ingredients.js';
import mealsRouter from './routes/meals.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 연결
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log('⚠️  MONGODB_URI가 설정되지 않았습니다.');
  console.log('💡 .env 파일에 MONGODB_URI를 추가해주세요.');
}

// 미들웨어
app.use(cors());
app.use(express.json());

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '서버가 정상 작동 중입니다',
    mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
  });
});

// 라우터 연결
app.use('/api/recipes', recipesRouter);
app.use('/api/users', usersRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/meals', mealsRouter);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 API를 찾을 수 없습니다' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 오류가 발생했습니다' });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
