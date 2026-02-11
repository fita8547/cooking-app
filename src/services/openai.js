import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 프로덕션에서는 백엔드에서 호출해야 함
});

/**
 * 재료 기반 레시피 생성
 * @param {string[]} ingredients - 사용 가능한 재료 목록
 * @param {Object} userProfile - 사용자 건강 프로필
 * @param {string} mode - 'exact' (보유 재료만) 또는 'flexible' (추가 재료 허용)
 * @returns {Promise<Array>} 생성된 레시피 목록
 */
export async function generateRecipes(ingredients, userProfile = {}, mode = 'flexible') {
  try {
    const prompt = buildRecipePrompt(ingredients, userProfile, mode);
    
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
    
    return result.recipes || [];
  } catch (error) {
    console.error('레시피 생성 오류:', error);
    throw new Error('레시피를 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 이미지에서 재료 인식 (OpenAI Vision API)
 * @param {File} imageFile - 업로드된 이미지 파일
 * @returns {Promise<Array>} 인식된 재료 목록
 */
export async function recognizeIngredients(imageFile) {
  try {
    // 이미지를 base64로 변환
    const base64Image = await fileToBase64(imageFile);
    
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
                url: base64Image
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
    
    return result.ingredients || [];
  } catch (error) {
    console.error('재료 인식 오류:', error);
    throw new Error('재료를 인식하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 레시피 생성 프롬프트 구성
 */
function buildRecipePrompt(ingredients, userProfile, mode) {
  const { age, gender, targetCalories, allergies = [], goal } = userProfile;
  
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

/**
 * 파일을 Base64로 변환
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * API 키 유효성 검사
 */
export function isApiKeyConfigured() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.startsWith('sk-');
}
