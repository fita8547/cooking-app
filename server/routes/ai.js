import express from 'express';
import OpenAI from 'openai';
import { optionalAuth } from '../middleware/auth.js';
import AICoachingService from '../services/AICoachingService.js';

const router = express.Router();

// OpenAI 클라이언트 초기화 함수 (지연 초기화)
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  
  return new OpenAI({ apiKey });
}

// AI 레시피 생성
router.post('/generate-recipes', optionalAuth, async (req, res) => {
  try {
    const { ingredients, profile, mode } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: '재료를 입력해주세요' });
    }

    const openai = getOpenAIClient();
    
    // OpenAI API 키가 없으면 목업 데이터 반환
    if (!openai) {
      console.log('⚠️  OpenAI API 키 없음 - 목업 데이터 반환');
      return res.json({ recipes: getMockRecipes(ingredients) });
    }

    console.log('✅ OpenAI API로 레시피 생성 중...');
    const prompt = buildRecipePrompt(ingredients, profile, mode);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 전문 셰프이자 영양사입니다. 사용자의 재료와 건강 정보를 바탕으로 맛있고 건강한 레시피를 추천합니다. 항상 JSON 형식으로 응답하세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);
    
    res.json({ recipes: result.recipes || [] });
  } catch (error) {
    console.error('레시피 생성 오류:', error);
    res.status(500).json({ 
      error: '레시피를 생성하는 중 오류가 발생했습니다',
      message: error.message 
    });
  }
});

// AI 재료 인식
router.post('/recognize-ingredients', optionalAuth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '이미지를 업로드해주세요' });
    }

    const openai = getOpenAIClient();
    
    // OpenAI API 키가 없으면 목업 데이터 반환
    if (!openai) {
      console.log('⚠️  OpenAI API 키 없음 - 목업 데이터 반환');
      return res.json({ 
        ingredients: [
          { name: '김치', confidence: 0.9 },
          { name: '두부', confidence: 0.85 },
          { name: '대파', confidence: 0.8 }
        ]
      });
    }

    console.log('✅ OpenAI Vision API로 재료 인식 중...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이 이미지에 있는 식재료를 식별해주세요. 
              
다음 JSON 형식으로 응답해주세요:
{
  "ingredients": [
    {"name": "재료명 (한글)", "confidence": 0.0-1.0}
  ]
}

일반적인 식재료만 식별하고, 명확하지 않은 경우 confidence를 낮게 설정해주세요.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);
    
    res.json({ ingredients: result.ingredients || [] });
  } catch (error) {
    console.error('재료 인식 오류:', error);
    res.status(500).json({ 
      error: '재료를 인식하는 중 오류가 발생했습니다',
      message: error.message 
    });
  }
});

// 레시피 생성 프롬프트 구성
function buildRecipePrompt(ingredients, userProfile, mode) {
  const { age, gender, targetCalories, allergies = [], goal } = userProfile || {};
  
  let prompt = `다음 재료를 사용하여 레시피를 추천해주세요.

사용 가능한 재료: ${ingredients.join(', ')}

`;

  if (age && gender) {
    prompt += `사용자 정보:
- 나이: ${age}세, 성별: ${gender === 'male' ? '남성' : '여성'}
`;
  }

  if (targetCalories) {
    prompt += `- 목표 칼로리: ${targetCalories}kcal
`;
  }

  if (allergies.length > 0) {
    prompt += `- 알레르기: ${allergies.join(', ')} (이 재료들은 절대 사용하지 마세요)
`;
  }

  if (goal) {
    const goalText = {
      'lose': '체중 감량',
      'maintain': '체중 유지',
      'gain': '체중 증가',
      'muscle': '근육 증가'
    };
    prompt += `- 식단 목표: ${goalText[goal] || goal}
`;
  }

  if (mode === 'exact') {
    prompt += `
제공된 재료만 사용하는 레시피를 추천해주세요.
`;
  } else {
    prompt += `
필요시 추가 재료를 포함할 수 있습니다 (최대 3개까지).
`;
  }

  prompt += `
다음 JSON 형식으로 3개의 레시피를 반환해주세요:
{
  "recipes": [
    {
      "name": "레시피 이름",
      "description": "간단한 설명 (한 줄)",
      "cuisine": "한식|양식|중식|일식|기타",
      "ingredients": [
        {"name": "재료명", "amount": "양", "unit": "단위", "isAvailable": true/false}
      ],
      "steps": [
        {"stepNumber": 1, "instruction": "조리 단계 설명", "duration": 예상시간(분)}
      ],
      "nutrition": {
        "calories": 숫자,
        "protein": 숫자,
        "carbs": 숫자,
        "fat": 숫자
      },
      "difficulty": "쉬움|보통|어려움",
      "cookingTime": 총조리시간(분),
      "servings": 인분수,
      "image": "🍲" (적절한 이모지)
    }
  ]
}

레시피는 실용적이고 맛있으며, 사용자의 건강 목표에 맞춰주세요.`;

  return prompt;
}

// 목업 레시피 데이터
function getMockRecipes(ingredients) {
  return [
    {
      name: '김치찌개',
      description: '한국의 대표적인 찌개 요리',
      cuisine: '한식',
      ingredients: [
        { name: '김치', amount: '200', unit: 'g', isAvailable: ingredients.includes('김치') },
        { name: '돼지고기', amount: '150', unit: 'g', isAvailable: ingredients.includes('돼지고기') },
        { name: '두부', amount: '1/2', unit: '모', isAvailable: ingredients.includes('두부') },
        { name: '대파', amount: '1', unit: '대', isAvailable: ingredients.includes('대파') }
      ],
      steps: [
        { stepNumber: 1, instruction: '김치를 송송 썰어주세요', duration: 5 },
        { stepNumber: 2, instruction: '돼지고기를 한입 크기로 잘라주세요', duration: 5 },
        { stepNumber: 3, instruction: '냄비에 김치와 돼지고기를 넣고 볶아주세요', duration: 5 },
        { stepNumber: 4, instruction: '물을 붓고 끓여주세요', duration: 10 },
        { stepNumber: 5, instruction: '두부와 대파를 넣고 10분간 더 끓입니다', duration: 10 }
      ],
      nutrition: {
        calories: 450,
        protein: 25,
        carbs: 35,
        fat: 18
      },
      difficulty: '쉬움',
      cookingTime: 35,
      servings: 2,
      image: '🍲'
    },
    {
      name: '계란볶음밥',
      description: '간단하고 맛있는 볶음밥',
      cuisine: '한식',
      ingredients: [
        { name: '밥', amount: '2', unit: '공기', isAvailable: ingredients.includes('밥') },
        { name: '계란', amount: '2', unit: '개', isAvailable: ingredients.includes('계란') },
        { name: '양파', amount: '1/2', unit: '개', isAvailable: ingredients.includes('양파') },
        { name: '당근', amount: '1/4', unit: '개', isAvailable: ingredients.includes('당근') }
      ],
      steps: [
        { stepNumber: 1, instruction: '양파와 당근을 잘게 다져주세요', duration: 5 },
        { stepNumber: 2, instruction: '계란을 풀어주세요', duration: 2 },
        { stepNumber: 3, instruction: '팬에 기름을 두르고 야채를 볶아주세요', duration: 3 },
        { stepNumber: 4, instruction: '밥을 넣고 함께 볶아주세요', duration: 5 },
        { stepNumber: 5, instruction: '계란을 넣고 섞어가며 볶아주세요', duration: 3 }
      ],
      nutrition: {
        calories: 520,
        protein: 18,
        carbs: 75,
        fat: 15
      },
      difficulty: '쉬움',
      cookingTime: 18,
      servings: 2,
      image: '🍳'
    }
  ];
}

export default router;

// AI 코칭 - 오늘의 인사이트
router.post('/daily-insight', optionalAuth, async (req, res) => {
  try {
    const { mealHistory, healthProfile, nutritionTargets } = req.body;

    const insight = await AICoachingService.generateDailyInsight(
      mealHistory || [],
      healthProfile,
      nutritionTargets
    );

    res.json({ insight });
  } catch (error) {
    console.error('Daily insight generation error:', error);
    res.status(500).json({ 
      error: '인사이트 생성 중 오류가 발생했습니다',
      message: error.message 
    });
  }
});

// AI 코칭 - 주간 분석
router.post('/weekly-analysis', optionalAuth, async (req, res) => {
  try {
    const { mealHistory, healthProfile, nutritionTargets } = req.body;

    const analysis = await AICoachingService.generateWeeklyAnalysis(
      mealHistory || [],
      healthProfile,
      nutritionTargets
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Weekly analysis generation error:', error);
    res.status(500).json({ 
      error: '주간 분석 생성 중 오류가 발생했습니다',
      message: error.message 
    });
  }
});
