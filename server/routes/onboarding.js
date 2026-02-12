import express from 'express';
import OnboardingService from '../services/OnboardingService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 건강 정보 저장
router.post('/health-info', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { dietaryRestrictions, allergies, healthGoals } = req.body;

    const result = await OnboardingService.saveHealthInformation(userId, {
      dietaryRestrictions,
      allergies,
      healthGoals
    });

    if (result.success) {
      // 온보딩 완료 처리
      await OnboardingService.completeOnboarding(userId);
      res.json({ success: true, message: '건강 정보가 저장되었습니다' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Health info save error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 건강 정보 스킵
router.post('/skip', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    await OnboardingService.skipHealthInformation(userId);
    await OnboardingService.completeOnboarding(userId);

    res.json({ success: true, message: '온보딩이 완료되었습니다' });
  } catch (error) {
    console.error('Skip onboarding error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 온보딩 상태 확인
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await OnboardingService.getOnboardingStatus(userId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

export default router;
