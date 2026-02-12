import express from 'express';
import AuthenticationService from '../services/AuthenticationService.js';
import OnboardingStatus from '../models/OnboardingStatus.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthenticationService.login(email, password);

    if (result.success) {
      res.json({
        success: true,
        token: result.data.token,
        user: {
          id: result.data.userId,
          email: result.data.email,
          name: result.data.name,
          onboardingComplete: result.data.onboardingComplete
        }
      });
    } else {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const result = await AuthenticationService.register(email, password, name);

    if (result.success) {
      res.status(201).json({
        success: true,
        token: result.data.token,
        user: {
          id: result.data.userId,
          email: result.data.email,
          name: result.data.name,
          onboardingComplete: result.data.onboardingComplete
        }
      });
    } else {
      if (result.error === 'UserAlreadyExists') {
        res.status(400).json({ error: '이미 사용 중인 이메일입니다' });
      } else {
        res.status(400).json({ error: '회원가입에 실패했습니다' });
      }
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 세션 복원
router.get('/session', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const onboardingStatus = await OnboardingStatus.findOne({ userId });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        onboardingComplete: onboardingStatus?.isComplete || false
      }
    });
  } catch (error) {
    console.error('Session restore error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

export default router;
