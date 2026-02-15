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
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 이메일 전송 프로세스 시작');
    console.log('   - 수신자:', email);
    console.log('   - 이름:', name);
    console.log('   - 인증 코드:', verificationCode);
    console.log('   - RESEND_API_KEY 존재:', !!process.env.RESEND_API_KEY);
    
    if (process.env.RESEND_API_KEY) {
      console.log('📧 sendVerificationEmail 함수 호출 중...');
      const emailResult = await sendVerificationEmail(email, name, verificationToken, verificationCode);
      console.log('📧 이메일 전송 결과:', JSON.stringify(emailResult, null, 2));
      
      if (emailResult.success) {
        console.log('✅ 이메일이 성공적으로 전송되었습니다!');
      } else {
        console.log('❌ 이메일 전송에 실패했습니다:', emailResult.error);
        
        // 이메일 전송 실패 시 터미널에 인증 코드 표시
        if (emailResult.restricted) {
          console.log('\n📧 [개발 모드] 이메일 인증 코드');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📨 수신자: ${email}`);
          console.log(`👤 이름: ${name}`);
          console.log(`🔑 인증 코드: ${verificationCode}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      }
    } else {
      console.log('⚠️  RESEND_API_KEY가 없어서 이메일을 전송하지 않습니다.');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

// 인증 코드 재발송
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: '이미 인증된 이메일입니다' });
    }

    // 새로운 인증 코드 생성
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // 인증 이메일 재발송
    if (process.env.RESEND_API_KEY) {
      await sendVerificationEmail(user.email, user.name, verificationToken, verificationCode);
    }

    res.json({
      success: true,
      message: '인증 코드가 재발송되었습니다'
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
    const { email, password, username } = req.body;

    // 아이디 또는 이메일로 로그인 지원
    let user;
    if (username) {
      // 아이디로 로그인 (username 필드가 있으면)
      // admin 계정은 이메일로 찾기
      if (username === 'admin') {
        user = await User.findOne({ email: 'admin@adcookingclass.com' });
      } else {
        user = await User.findOne({ 
          $or: [
            { email: `${username}@user.local` },
            { email: username }
          ]
        });
      }
    } else {
      // 이메일로 로그인
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
    }

    // 이메일 인증 확인 (관리자는 제외)
    if (!user.isEmailVerified && !user.isAdmin) {
      return res.status(403).json({ 
        error: '이메일 인증이 필요합니다',
        code: 'EMAIL_NOT_VERIFIED',
        message: '가입 시 발송된 이메일을 확인하여 인증을 완료해주세요.',
        email: user.email
      });
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
        name: user.name,
        isPremium: user.isPremium || false,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 이메일로 로그인 (결제 완료 후 자동 로그인용)
router.post('/login-with-email', async (req, res) => {
  try {
    const { email } = req.body;

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // Pro 구독 확인
    if (!user.isPro && !user.isPremium) {
      return res.status(403).json({ error: 'Pro 구독이 필요합니다' });
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
        name: user.name,
        isPremium: user.isPremium || user.isPro || false,
        isPro: user.isPro || false,
        isAdmin: user.isAdmin || false
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
        healthProfile: req.user.healthProfile || {},
        preferences: req.user.preferences || {}
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 프로필 업데이트
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, healthProfile } = req.body;

    if (name) {
      req.user.name = name;
    }

    if (healthProfile) {
      req.user.healthProfile = {
        ...req.user.healthProfile,
        ...healthProfile
      };
    }

    await req.user.save();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        healthProfile: req.user.healthProfile,
        preferences: req.user.preferences
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
