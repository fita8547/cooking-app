# 백엔드 서버

Express 기반의 간단한 REST API 서버입니다.

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

### 레시피
- `POST /api/recipes/recommend` - 재료 기반 레시피 추천
  ```json
  {
    "ingredients": ["김치", "돼지고기", "두부"]
  }
  ```

### 식사 기록
- `POST /api/meals` - 식사 기록 저장
  ```json
  {
    "recipeName": "김치찌개",
    "date": "2026-02-11",
    "rating": 5
  }
  ```
- `GET /api/meals/history` - 식사 기록 조회

### 건강 프로필
- `POST /api/profile/health` - 건강 정보 저장
  ```json
  {
    "age": 25,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "goal": "다이어트"
  }
  ```

## 향후 작업

- [ ] OpenAI API 연결
- [ ] 데이터베이스 연동 (MongoDB/PostgreSQL)
- [ ] 사용자 인증 (JWT)
- [ ] 이미지 업로드 및 재료 인식
- [ ] 레시피 상세 정보 API
