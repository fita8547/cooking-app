import express from 'express';
import HealthInformationRepository from '../services/HealthInformationRepository.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 건강 프로필 생성/업데이트 (확장된 정보 포함)
router.post('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const profile = req.body;

    // Input validation
    if (!profile.age || !profile.gender || !profile.height || !profile.weight || !profile.dietaryGoal) {
      return res.status(400).json({ error: '필수 항목을 모두 입력해주세요 (나이, 성별, 키, 몸무게, 식단 목표)' });
    }

    // Validate age
    const age = parseInt(profile.age);
    if (isNaN(age) || age <= 0 || age > 120) {
      return res.status(400).json({ error: '나이는 1세에서 120세 사이여야 합니다' });
    }

    // Validate height
    const height = parseFloat(profile.height);
    if (isNaN(height) || height <= 0) {
      return res.status(400).json({ error: '키는 0보다 커야 합니다' });
    }

    // Validate weight
    const weight = parseFloat(profile.weight);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ error: '몸무게는 0보다 커야 합니다' });
    }

    // Validate gender
    if (!['male', 'female', 'other'].includes(profile.gender)) {
      return res.status(400).json({ error: '성별은 male, female, other 중 하나여야 합니다' });
    }

    // Validate dietary goal
    const validGoals = ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'];
    if (!validGoals.includes(profile.dietaryGoal)) {
      return res.status(400).json({ error: '유효하지 않은 식단 목표입니다' });
    }

    // Transform allergies from string array to object array if needed
    if (profile.allergies && Array.isArray(profile.allergies)) {
      profile.allergies = profile.allergies.map(allergy => {
        // If already an object, keep it
        if (typeof allergy === 'object' && allergy !== null) {
          return allergy;
        }
        // If string, convert to object
        if (typeof allergy === 'string') {
          return {
            id: allergy.toLowerCase().replace(/\s+/g, '_'),
            name: allergy,
            nameKo: allergy,
            severity: 'Moderate'
          };
        }
        return allergy;
      });
    }

    const result = await HealthInformationRepository.createProfile(userId, profile);

    if (result.success) {
      res.json({
        success: true,
        profileId: result.data.profileId,
        calculatedMetrics: result.data.calculatedMetrics
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Create health profile error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 건강 프로필 조회
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await HealthInformationRepository.getProfile(userId);

    if (result.success) {
      res.json({ profile: result.data });
    } else {
      if (result.error === 'ProfileNotFound') {
        res.status(404).json({ error: '건강 프로필을 찾을 수 없습니다' });
      } else {
        res.status(500).json({ error: result.error });
      }
    }
  } catch (error) {
    console.error('Get health profile error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 영양 목표 조회
router.get('/nutrition-targets', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await HealthInformationRepository.getNutritionTargets(userId);

    if (result.success) {
      res.json({ targets: result.data });
    } else {
      res.status(404).json({ error: '영양 목표를 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('Get nutrition targets error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 건강 정보 존재 여부 확인
router.get('/exists', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await HealthInformationRepository.exists(userId);

    if (result.success) {
      res.json({ exists: result.data });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Check health info exists error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 건강 정보 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await HealthInformationRepository.get(userId);

    if (result.success) {
      res.json({ healthInfo: result.data });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Get health info error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

export default router;
