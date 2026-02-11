import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendVerificationEmail } from '../utils/email.js';

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

    // 이메일 인증 토큰 및 코드 생성
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    // 사용자 생성
    const user = new User({
      email,
      password: hashedPassword,
      name,
      emailVerificationToken: verificationToken,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false
    });

    await user.save();

    // 인증 이메일 발송
    if (process.env.RESEND_API_KEY) {
      await sendVerificationEmail(email, name, verificationToken, verificationCode);
    }

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified
      },
      message: process.env.RESEND_API_KEY 
        ? '회원가입 완료! 이메일로 발송된 6자리 인증 코드를 입력해주세요.' 
        : '회원가입 완료!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 인증 코드로 이메일 인증
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      emailVerificationCode: code,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 인증 코드입니다' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      message: '이메일 인증이 완료되었습니다!',
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

// 이메일 인증
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 인증 링크입니다' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: '이메일 인증이 완료되었습니다!' 
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

    // 이메일 인증 확인 (임시로 비활성화)
    // if (!user.isEmailVerified) {
    //   return res.status(403).json({ 
    //     error: '이메일 인증이 필요합니다',
    //     code: 'EMAIL_NOT_VERIFIED',
    //     message: '가입 시 발송된 이메일을 확인하여 인증을 완료해주세요.'
    //   });
    // }

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

// 사용자 삭제 (관리자용 - 임시)
router.delete('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOneAndDelete({ email });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    res.json({ success: true, message: '사용자가 삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 이메일 강제 인증 (관리자용 - 임시)
router.post('/verify-force/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: '이메일 인증이 완료되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
