# OpenAI 기반 레시피 추천 구현

## 개요

레시피 추천 시스템을 OpenAI GPT-4o-mini를 활용하여 사용자의 재료와 건강 기록을 기반으로 맞춤형 레시피를 생성하도록 개선했습니다.

## 주요 기능

### 1. AI 기반 레시피 생성
- OpenAI GPT-4o-mini 모델 사용
- 사용자의 재료 목록 분석
- 건강 프로필 기반 맞춤 추천
- 영양 목표에 맞는 레시피 생성

### 2. 건강 정보 통합
레시피 생성 시 다음 정보를 활용:
- 나이, 성별
- 알레르기 정보 (해당 재료 절대 사용 금지)
- 식단 목표 (체중 감량, 증가, 근육 증가, 건강 유지)
- 선호 식단 (한식, 간편식, 고단백, 저탄수화물, 채식 등)
- 목표 영양 정보 (칼로리, 단백질, 탄수화물, 지방)

### 3. 폴백 메커니즘
- OpenAI API 키가 없거나 오류 발생 시
- 자동으로 DB 기반 레시피 추천으로 전환
- 서비스 중단 없이 안정적 운영

## 구현 상세

### 수정된 파일

**server/services/RecipeRecommendationService.js**

#### 1. OpenAI 클라이언트 초기화
```javascript
_getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  
  return new OpenAI({ apiKey });
}
```

#### 2. AI 레시피 생성
```javascript
async _generateRecipesWithAI(availableIngredients, healthProfile, nutritionTargets) {
  const openai = this._getOpenAIClient();
  
  if (!openai) {
    console.log('⚠️  OpenAI API 키 없음 - DB 레시피 사용');
    return null;
  }

  const prompt = this._buildRecipePrompt(availableIngredients, healthProfile, nutritionTargets);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 전문 셰프이자 영양사입니다..."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.recipes || [];
}
```

#### 3. 프롬프트 구성
```javascript
_buildRecipePrompt(ingredients, healthProfile, nutritionTargets) {
  let prompt = `다음 재료를 사용하여 레시피를 추천해주세요.

사용 가능한 재료: ${ingredients.join(', ')}

`;

  // 건강 프로필 정보 추가
  if (healthProfile) {
    // 나이, 성별
    // 알레르기 (절대 사용 금지)
    // 식단 목표
    // 선호 식단
  }

  // 영양 목표 추가
  if (nutritionTargets) {
    // 칼로리, 단백질, 탄수화물, 지방
  }

  // JSON 형식 요청
  return prompt;
}
```

#### 4. 메인 추천 로직
```javascript
async recommendRecipes(availableIngredients, healthProfile, nutritionTargets, userId) {
  // 1. OpenAI로 레시피 생성 시도
  const aiRecipes = await this._generateRecipesWithAI(
    availableIngredients, 
    healthProfile, 
    nutritionTargets
  );
  
  if (aiRecipes && aiRecipes.length > 0) {
    // AI 생성 레시피를 exact/extended로 분류
    const exactMatches = [];
    const extendedMatches = [];
    
    for (const recipe of aiRecipes) {
      const allAvailable = recipe.ingredients.every(ing => ing.isAvailable);
      
      if (allAvailable) {
        exactMatches.push(recipe);
      } else {
        extendedMatches.push(recipe);
      }
    }
    
    return { exactMatches, extendedMatches };
  }

  // 2. OpenAI 실패 시 DB 기반 추천으로 폴백
  // ... 기존 로직
}
```

## 레시피 응답 형식

OpenAI가 생성하는 레시피 JSON 형식:

```json
{
  "recipes": [
    {
      "name": "김치 두부 볶음",
      "description": "단백질이 풍부한 간단한 한식 요리",
      "cuisine": "한식",
      "ingredients": [
        {
          "name": "김치",
          "amount": "200",
          "unit": "g",
          "isAvailable": true
        },
        {
          "name": "두부",
          "amount": "1",
          "unit": "모",
          "isAvailable": true
        },
        {
          "name": "대파",
          "amount": "1",
          "unit": "대",
          "isAvailable": false
        }
      ],
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "김치를 송송 썰어주세요",
          "duration": 3
        },
        {
          "stepNumber": 2,
          "instruction": "두부를 한입 크기로 잘라주세요",
          "duration": 3
        },
        {
          "stepNumber": 3,
          "instruction": "팬에 김치와 두부를 넣고 볶아주세요",
          "duration": 10
        }
      ],
      "nutrition": {
        "calories": 280,
        "protein": 18,
        "carbs": 25,
        "fat": 12
      },
      "difficulty": "쉬움",
      "cookingTime": 20,
      "servings": 2,
      "image": "🍲",
      "rationale": "고단백 + 저칼로리 - 체중 감량 목표에 적합"
    }
  ]
}
```

## 프롬프트 예시

### 기본 프롬프트
```
다음 재료를 사용하여 레시피를 추천해주세요.

사용 가능한 재료: 김치, 두부, 계란, 양파

사용자 건강 정보:
- 나이: 30세
- 성별: 남성
- 알레르기: 우유, 땅콩 (이 재료들은 절대 사용하지 마세요)
- 식단 목표: 체중 감량
- 선호 식단: 한식, 고단백

목표 영양 정보 (1끼 기준):
- 칼로리: 450kcal
- 단백질: 35g
- 탄수화물: 40g
- 지방: 15g

다음 JSON 형식으로 5개의 레시피를 반환해주세요:
...
```

## 사용자 플로우

1. **재료 입력**
   - 직접 입력 또는 사진 인식
   - 예: 김치, 두부, 계란, 양파

2. **레시피 추천받기 버튼 클릭**
   - 로딩 표시: "레시피를 찾고 있습니다..."

3. **백엔드 처리**
   - 사용자 건강 프로필 조회
   - 영양 목표 계산
   - OpenAI에 프롬프트 전송
   - 레시피 생성 (5개)

4. **결과 표시**
   - 보유 재료로만 만들 수 있는 레시피 (Exact Matches)
   - 추가 재료가 필요한 레시피 (Extended Matches)
   - 각 레시피의 영양 정보 및 추천 이유

## 장점

### 1. 개인화된 추천
- 사용자의 건강 상태와 목표에 맞춤
- 알레르기 자동 필터링
- 선호 식단 반영

### 2. 무한한 레시피
- DB에 저장된 레시피에 제한되지 않음
- 사용자의 재료 조합에 맞는 새로운 레시피 생성
- 창의적이고 다양한 요리 제안

### 3. 영양 정보 정확성
- AI가 영양 목표를 고려하여 레시피 생성
- 칼로리, 단백질, 탄수화물, 지방 균형 맞춤
- 건강 목표 달성 지원

### 4. 안정성
- OpenAI 오류 시 DB 레시피로 폴백
- 서비스 중단 없이 안정적 운영
- 점진적 개선 가능

## 비용 고려사항

### OpenAI API 비용
- 모델: GPT-4o-mini
- 입력 토큰: ~500-800 토큰/요청
- 출력 토큰: ~2000-3000 토큰/요청
- 예상 비용: $0.01-0.02/요청

### 최적화 방안
1. **캐싱**: 동일한 재료 조합은 캐시 사용
2. **배치 처리**: 여러 사용자 요청을 모아서 처리
3. **토큰 제한**: max_tokens 조정으로 비용 절감
4. **폴백 우선**: DB에 적합한 레시피가 있으면 AI 생략

## 테스트 시나리오

### 시나리오 1: 기본 추천
1. 재료: 김치, 두부, 계란
2. 건강 프로필: 30세 남성, 체중 감량 목표
3. **예상 결과**: 고단백 저칼로리 한식 레시피 5개

### 시나리오 2: 알레르기 필터링
1. 재료: 우유, 계란, 밀가루
2. 알레르기: 우유
3. **예상 결과**: 우유를 사용하지 않는 레시피만 생성

### 시나리오 3: 영양 목표 맞춤
1. 재료: 닭가슴살, 브로콜리, 현미
2. 목표: 근육 증가 (고단백)
3. **예상 결과**: 단백질 35g 이상의 레시피

### 시나리오 4: OpenAI 오류 시 폴백
1. OpenAI API 키 없음 또는 오류
2. **예상 결과**: DB 레시피로 자동 전환, 정상 추천

## 환경 설정

### .env 파일
```bash
OPENAI_API_KEY=sk-proj-...
```

### 확인 방법
```bash
# 서버 로그 확인
✅ OpenAI로 레시피 생성 중...
✅ OpenAI로 5개 레시피 생성 완료

# 또는
⚠️  OpenAI API 키 없음 - DB 레시피 사용
```

## 향후 개선 사항

1. **레시피 캐싱**: Redis를 사용한 결과 캐싱
2. **사용자 피드백**: 좋아요/싫어요로 추천 개선
3. **이미지 생성**: DALL-E로 레시피 이미지 생성
4. **다국어 지원**: 영어, 일본어 등 다국어 레시피
5. **조리 난이도 조절**: 사용자 요리 실력에 맞춤

## 관련 파일

- `server/services/RecipeRecommendationService.js` - 메인 추천 로직
- `server/routes/recipes.js` - 레시피 API 엔드포인트
- `src/services/api.js` - 프론트엔드 API 클라이언트
- `src/components/RecipeRecommendationPage.jsx` - 추천 페이지 UI
- `.env` - OpenAI API 키 설정
