import express from 'express';
import { authenticate } from '../middleware/auth.js';
import HealthInformationRepository from '../services/HealthInformationRepository.js';

const router = express.Router();

/**
 * POST /api/profile/health
 * Quick 건강기록 저장
 */
router.post('/health', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { allergies, goal, preferences, heightCm, weightKg, age, gender } = req.body;

    // 입력값 검증
    if (heightCm !== undefined) {
      const height = parseFloat(heightCm);
      if (isNaN(height) || height < 50 || height > 250) {
        return res.status(400).json({ message: '키는 50-250 범위로 입력해주세요' });
      }
    }

    if (weightKg !== undefined) {
      const weight = parseFloat(weightKg);
      if (isNaN(weight) || weight < 10 || weight > 300) {
        return res.status(400).json({ message: '체중은 10-300 범위로 입력해주세요' });
      }
    }

    if (age !== undefined) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        return res.status(400).json({ message: '나이는 1-120 범위로 입력해주세요' });
      }
    }

    if (gender !== undefined) {
      if (!['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: '성별은 male, female, other 중 하나여야 합니다' });
      }
    }

    // 알레르기 데이터 변환 (문자열 배열 → 객체 배열)
    let transformedAllergies = [];
    if (allergies && Array.isArray(allergies)) {
      transformedAllergies = allergies.map(allergy => {
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

    // 식단 목표 매핑
    const goalMapping = {
      'lose': 'weight_loss',
      'maintain': 'maintenance',
      'gain': 'weight_gain',
      'health': 'maintenance'
    };

    // 건강 정보 저장
    const healthData = {
      allergies: transformedAllergies,
      dietaryGoal: goal ? goalMapping[goal] : undefined,
      height: heightCm ? parseFloat(heightCm) : undefined,
      weight: weightKg ? parseFloat(weightKg) : undefined,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      // preferences는 나중에 확장 가능
      medicalConditions: preferences || []
    };

    // 빈 값 제거
    Object.keys(healthData).forEach(key => {
      if (healthData[key] === undefined) {
        delete healthData[key];
      }
    });

    const result = await HealthInformationRepository.update(userId, healthData);

    if (result.success) {
      res.json({ ok: true });
    } else {
      res.status(500).json({ message: result.error || '저장에 실패했습니다' });
    }
  } catch (error) {
    console.error('Quick health save error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

export default router;
