# 백엔드 서버

Express + MongoDB 기반의 REST API 서버입니다.

## 설치 및 설정

1. **MongoDB 설치**
   - 로컬: [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - 클라우드: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (무료)

2. **환경 변수 설정**
   ```bash
   cp .env.example .env
   ```
   
   `.env` 파일에 MongoDB URI 추가:
   ```
   MONGODB_URI=mongodb://localhost:27017/cooking-app
   # 또는 MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cooking-app
   ```

## 실행 방법

```bash
# 서버 실행
npm run server

# 개발 모드 (자동 재시작)
npm run server:dev
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### 헬스 체크
- `GET /api/health` - 서버 상태 확인

### 레시피 (Recipes)
- `POST /api/recipes/recommend` - 재료 기반 레시피 추천
  ```json
  {
    "ingredients": ["김치", "돼지고기", "두부"]
  }
  ```
- `GET /api/recipes/:id` - 레시피 상세 조회
- `POST /api/recipes` - 레시피 생성

### 재료 (Ingredients)
- `GET /api/ingredients?userId=xxx` - 사용자 재료 목록 조회
- `POST /api/ingredients` - 재료 추가
  ```json
  {
    "userId": "user_id",
    "name": "김치",
    "category": "채소",
    "quantity": "500",
    "unit": "g"
  }
  ```
- `PUT /api/ingredients/:id` - 재료 수정
- `DELETE /api/ingredients/:id` - 재료 삭제

### 식사 기록 (Meals)
- `POST /api/meals` - 식사 기록 저장
  ```json
  {
    "userId": "user_id",
    "recipeName": "김치찌개",
    "date": "2026-02-11",
    "mealType": "점심",
    "rating": 5
  }
  ```
- `GET /api/meals/history?userId=xxx` - 식사 기록 조회
- `PUT /api/meals/:id` - 식사 기록 수정
- `DELETE /api/meals/:id` - 식사 기록 삭제

### 사용자 (Users)
- `POST /api/users` - 사용자 생성
- `POST /api/users/profile/health` - 건강 프로필 저장
  ```json
  {
    "userId": "user_id",
    "age": 25,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "goal": "다이어트"
  }
  ```
- `GET /api/users/:userId/profile/health` - 건강 프로필 조회

## 데이터 모델

### User (사용자)
- email, password, name
- healthProfile (건강 정보)
- preferences (선호도)

### Recipe (레시피)
- name, description, ingredients, steps
- cookingTime, difficulty, servings
- nutrition, category, tags

### Ingredient (재료)
- userId, name, category
- quantity, unit, expiryDate

### Meal (식사 기록)
- userId, recipeId, recipeName
- date, mealType, rating
- nutrition

## 향후 작업

- [ ] OpenAI API 연결 (레시피 생성)
- [ ] JWT 인증 시스템
- [ ] 이미지 업로드 (재료 인식)
- [ ] 레시피 검색 및 필터링
- [ ] 영양소 자동 계산
- [ ] 사용자 취향 학습 알고리즘
