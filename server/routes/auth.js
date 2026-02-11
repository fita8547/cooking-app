import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = new User({
      email,
      password: hashedPassword,
      name
    });

    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 현재 사용자 정보 조회
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        healthProfile: req.user.healthProfile,
        preferences: req.user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 비밀번호 변경
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다' });
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    req.user.password = hashedPassword;
    await req.user.save();

    res.json({ success: true, message: '비밀번호가 변경되었습니다' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
