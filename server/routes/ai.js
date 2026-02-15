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
  console.log('🔍 재료 인식 요청 받음');
  
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      console.log('❌ 이미지 없음');
      return res.status(400).json({ error: '이미지를 업로드해주세요' });
    }

    console.log('📸 이미지 수신 완료, 크기:', Math.round(imageBase64.length / 1024), 'KB');

    // Base64 형식 검증
    if (!imageBase64.startsWith('data:image/')) {
      console.log('❌ 잘못된 이미지 형식');
      return res.status(400).json({ error: '올바른 이미지 형식이 아닙니다' });
    }

    const openai = getOpenAIClient();
    
    // OpenAI API 키가 없으면 목업 데이터 반환
    if (!openai) {
      console.log('⚠️  OpenAI API 키 없음 - 목업 데이터 반환');
      return res.json({ 
        ingredients: [
          { name: '김치', confidence: 0.9 },
          { name: '두부', confidence: 0.85 },
          { name: '대파', confidence: 0.8 },
          { name: '양파', confidence: 0.75 },
          { name: '당근', confidence: 0.7 }
        ]
      });
    }

    console.log('✅ OpenAI Vision API 호출 시작...');

    try {
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
    {"name": "재료명 (한글)", "confidence": 0.9}
  ]
}

일반적인 식재료만 식별하고, 명확하지 않은 경우 confidence를 낮게 설정해주세요.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      console.log('✅ OpenAI 응답 받음:', content.substring(0, 100) + '...');
      
      // JSON 파싱 시도
      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError.message);
        console.log('원본 응답:', content);
        
        // JSON이 아닌 경우 텍스트에서 재료 추출 시도
        const ingredientMatches = content.match(/[가-힣]+/g);
        if (ingredientMatches) {
          result = {
            ingredients: ingredientMatches.slice(0, 5).map(name => ({
              name,
              confidence: 0.7
            }))
          };
        } else {
          throw new Error('재료를 인식할 수 없습니다');
        }
      }
      
      console.log('✅ 재료 인식 완료:', result.ingredients?.length || 0, '개');
      res.json({ ingredients: result.ingredients || [] });
      
    } catch (openaiError) {
      console.error('❌ OpenAI API 오류:', openaiError.message);
      console.error('오류 상세:', openaiError);
      
      // OpenAI 오류 시 목업 데이터 반환
      console.log('⚠️  OpenAI 오류로 목업 데이터 반환');
      return res.json({ 
        ingredients: [
          { name: '김치', confidence: 0.9 },
          { name: '두부', confidence: 0.85 },
          { name: '대파', confidence: 0.8 }
        ]
      });
    }
    
  } catch (error) {
    console.error('❌ 재료 인식 오류:', error.message);
    console.error('에러 스택:', error.stack);
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
다음 JSON 형식으로 3개의 레시피를 반환해주세요 (쿡북 스타일로 상세하게):
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
        {
          "stepNumber": 1, 
          "instruction": "조리 단계 설명 (상세하고 친절하게)", 
          "duration": 예상시간(분),
          "tip": "이 단계의 팁이나 주의사항 (선택사항)",
          "imageDescription": "이 단계를 시각적으로 설명 (예: 김치가 노릇노릇하게 볶아진 모습)"
        }
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
      "image": "🍲" (적절한 이모지),
      "tags": ["간편식", "건강식", "다이어트" 등 태그 배열],
      "chefTip": "전체 레시피에 대한 셰프의 팁"
    }
  ]
}

레시피는 실용적이고 맛있으며, 사용자의 건강 목표에 맞춰주세요.
각 단계는 초보자도 따라할 수 있도록 상세하고 친절하게 작성해주세요.`;

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
        { 
          stepNumber: 1, 
          instruction: '김치를 송송 썰어주세요', 
          duration: 5,
          tip: '김치는 너무 잘게 썰지 말고 한입 크기로 썰어주세요',
          imageDescription: '도마 위에 김치가 적당한 크기로 썰려있는 모습'
        },
        { 
          stepNumber: 2, 
          instruction: '돼지고기를 한입 크기로 잘라주세요', 
          duration: 5,
          tip: '고기는 냉동실에 10분 정도 두면 자르기 쉬워요',
          imageDescription: '돼지고기가 깔끔하게 한입 크기로 잘려있는 모습'
        },
        { 
          stepNumber: 3, 
          instruction: '냄비에 김치와 돼지고기를 넣고 중불에서 볶아주세요', 
          duration: 5,
          tip: '김치가 노릇노릇해질 때까지 볶으면 더 맛있어요',
          imageDescription: '냄비에서 김치와 고기가 지글지글 볶아지는 모습'
        },
        { 
          stepNumber: 4, 
          instruction: '물 2컵을 붓고 센불에서 끓여주세요', 
          duration: 10,
          tip: '물 대신 육수를 사용하면 더 깊은 맛이 나요',
          imageDescription: '냄비에 물이 부글부글 끓고 있는 모습'
        },
        { 
          stepNumber: 5, 
          instruction: '두부와 대파를 넣고 중불에서 10분간 더 끓입니다', 
          duration: 10,
          tip: '두부는 마지막에 넣어야 부서지지 않아요',
          imageDescription: '완성된 김치찌개가 보글보글 끓고 있는 모습'
        }
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
      image: '🍲',
      tags: ['한식', '찌개', '간편식', '집밥'],
      chefTip: '김치는 잘 익은 것을 사용하면 더 맛있고, 마지막에 참기름 한 방울을 넣으면 풍미가 살아나요!'
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
        { 
          stepNumber: 1, 
          instruction: '양파와 당근을 잘게 다져주세요', 
          duration: 5,
          tip: '야채는 최대한 잘게 다져야 밥과 잘 섞여요',
          imageDescription: '도마 위에 양파와 당근이 잘게 다져진 모습'
        },
        { 
          stepNumber: 2, 
          instruction: '계란을 그릇에 풀어주세요', 
          duration: 2,
          tip: '소금 한 꼬집을 넣으면 더 부드러워요',
          imageDescription: '그릇에 계란이 노란색으로 잘 풀어진 모습'
        },
        { 
          stepNumber: 3, 
          instruction: '팬에 기름을 두르고 야채를 중불에서 볶아주세요', 
          duration: 3,
          tip: '야채가 투명해질 때까지 볶아주세요',
          imageDescription: '팬에서 야채가 지글지글 볶아지는 모습'
        },
        { 
          stepNumber: 4, 
          instruction: '밥을 넣고 주걱으로 으깨가며 함께 볶아주세요', 
          duration: 5,
          tip: '밥은 차가운 것보다 따뜻한 것이 볶기 좋아요',
          imageDescription: '팬에서 밥과 야채가 잘 섞여 볶아지는 모습'
        },
        { 
          stepNumber: 5, 
          instruction: '계란을 넣고 빠르게 섞어가며 볶아주세요', 
          duration: 3,
          tip: '계란이 익으면서 밥을 코팅하도록 빠르게 저어주세요',
          imageDescription: '완성된 계란볶음밥이 노릇노릇하게 볶아진 모습'
        }
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
      image: '🍳',
      tags: ['한식', '볶음밥', '간편식', '5분요리'],
      chefTip: '간장 1스푼과 참기름 반 스푼을 넣으면 중국집 볶음밥 맛이 나요!'
    },
    {
      name: '된장찌개',
      description: '구수한 한국 전통 찌개',
      cuisine: '한식',
      ingredients: [
        { name: '된장', amount: '2', unit: '큰술', isAvailable: ingredients.includes('된장') },
        { name: '두부', amount: '1/2', unit: '모', isAvailable: ingredients.includes('두부') },
        { name: '감자', amount: '1', unit: '개', isAvailable: ingredients.includes('감자') },
        { name: '양파', amount: '1/2', unit: '개', isAvailable: ingredients.includes('양파') },
        { name: '애호박', amount: '1/2', unit: '개', isAvailable: ingredients.includes('애호박') }
      ],
      steps: [
        { 
          stepNumber: 1, 
          instruction: '감자와 양파를 큼직하게 썰어주세요', 
          duration: 5,
          tip: '감자는 너무 작게 썰면 쉽게 부서져요',
          imageDescription: '도마 위에 감자와 양파가 큼직하게 썰려있는 모습'
        },
        { 
          stepNumber: 2, 
          instruction: '냄비에 물 3컵을 붓고 된장을 풀어주세요', 
          duration: 3,
          tip: '된장은 체에 거르면 더 부드러워요',
          imageDescription: '냄비에 된장이 물에 풀어지는 모습'
        },
        { 
          stepNumber: 3, 
          instruction: '감자와 양파를 넣고 센불에서 끓여주세요', 
          duration: 10,
          tip: '감자가 익을 때까지 충분히 끓여주세요',
          imageDescription: '냄비에서 감자와 양파가 끓고 있는 모습'
        },
        { 
          stepNumber: 4, 
          instruction: '애호박과 두부를 넣어주세요', 
          duration: 5,
          tip: '애호박은 너무 오래 끓이면 물러지니 주의하세요',
          imageDescription: '냄비에 애호박과 두부가 추가된 모습'
        },
        { 
          stepNumber: 5, 
          instruction: '대파를 송송 썰어 마지막에 넣어주세요', 
          duration: 2,
          tip: '대파는 마지막에 넣어야 향이 살아나요',
          imageDescription: '완성된 된장찌개가 보글보글 끓고 있는 모습'
        }
      ],
      nutrition: {
        calories: 280,
        protein: 15,
        carbs: 30,
        fat: 8
      },
      difficulty: '쉬움',
      cookingTime: 25,
      servings: 2,
      image: '🍜',
      tags: ['한식', '찌개', '건강식', '집밥'],
      chefTip: '멸치 육수를 사용하면 훨씬 더 깊은 맛이 나요. 다시마와 멸치를 10분간 끓여 육수를 만들어보세요!'
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
