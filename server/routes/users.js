import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// 건강 프로필 저장/수정
router.post('/profile/health', async (req, res) => {
  try {
    const { userId, ...healthData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId가 필요합니다' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { healthProfile: healthData } },
      { new: true, upsert: false }
    );

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    res.json({ success: true, profile: user.healthProfile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 건강 프로필 조회
router.get('/:userId/profile/health', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    res.json({ profile: user.healthProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사용자 생성 (간단 버전)
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
