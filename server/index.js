import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRouter from './routes/auth.js';
import recipesRouter from './routes/recipes.js';
import usersRouter from './routes/users.js';
import ingredientsRouter from './routes/ingredients.js';
import mealsRouter from './routes/meals.js';
import uploadRouter from './routes/upload.js';
import aiRouter from './routes/ai.js';
import webhooksRouter from './routes/webhooks.js';
import polarRouter from './routes/polar.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 정적 파일 제공 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '서버가 정상 작동 중입니다',
    mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
  });
});

// 라우터 연결
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/users', usersRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/polar', polarRouter);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 API를 찾을 수 없습니다' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '서버 오류가 발생했습니다' });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
