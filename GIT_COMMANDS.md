# Git 커밋 및 PR 생성 가이드

## 1. 현재 상태 확인

```bash
git status
```

## 2. 변경사항 스테이징

### 모든 파일 추가
```bash
git add .
```

### 또는 개별 파일 추가
```bash
# 테마 관련
git add src/theme.css
git add src/main.jsx

# 컴포넌트
git add src/components/HomeHub.jsx
git add src/components/Login.jsx
git add src/components/QuickHealthInfo.jsx
git add src/components/RecipeRecommendationPage.jsx
git add src/components/IngredientInputForm.jsx
git add src/components/FridgePage.jsx
git add src/components/AppRouter.jsx

# 백엔드
git add server/services/RecipeRecommendationService.js

# 문서
git add OPENAI_RECIPE_RECOMMENDATION.md
git add DRAG_DROP_COMPLETION.md
git add IMAGE_RECOGNITION_FIX.md
git add FRIDGE_TO_RECOMMEND_INTEGRATION.md
git add COLOR_THEME_UPDATE.md
git add PR_DESCRIPTION.md
```

## 3. 커밋 메시지 작성

### 옵션 1: 단일 커밋 (권장)
```bash
git commit -m "feat: UI/UX 개선 및 OpenAI 레시피 추천 기능 구현

- 컬러 테마를 은은한 오렌지 톤으로 변경
- OpenAI GPT-4o-mini 기반 맞춤형 레시피 생성
- 드래그 앤 드롭 이미지 업로드 및 재료 인식
- 냉장고 → 레시피 추천 페이지 플로우 개선
- 한글 입력 IME 이슈 해결
- CSS 변수 시스템 도입

BREAKING CHANGE: 없음
"
```

### 옵션 2: 기능별 커밋

#### 2-1. 컬러 테마 변경
```bash
git add src/theme.css src/main.jsx src/components/HomeHub.jsx src/components/Login.jsx src/components/QuickHealthInfo.jsx COLOR_THEME_UPDATE.md

git commit -m "style: 컬러 테마를 은은한 오렌지 톤으로 변경

- CSS 변수 시스템 도입 (src/theme.css)
- 보라색 → 은은한 오렌지 (#ff8c42)
- 음식 앱에 적합한 따뜻한 색상
- HomeHub, Login, QuickHealthInfo 컴포넌트 적용
"
```

#### 2-2. OpenAI 레시피 추천
```bash
git add server/services/RecipeRecommendationService.js OPENAI_RECIPE_RECOMMENDATION.md

git commit -m "feat: OpenAI 기반 맞춤형 레시피 추천 기능 추가

- GPT-4o-mini를 활용한 레시피 생성
- 사용자 건강 정보 및 재료 기반 개인화
- 알레르기 자동 필터링
- 영양 목표 반영
- DB 레시피로 자동 폴백
"
```

#### 2-3. 드래그 앤 드롭
```bash
git add src/components/FridgePage.jsx DRAG_DROP_COMPLETION.md

git commit -m "feat: 드래그 앤 드롭 이미지 업로드 기능 추가

- 이미지 드래그 앤 드롭 지원
- OpenAI Vision API로 재료 자동 인식
- 시각적 피드백 (드래그 중 하이라이트)
"
```

#### 2-4. 페이지 플로우 개선
```bash
git add src/components/RecipeRecommendationPage.jsx src/components/IngredientInputForm.jsx src/components/AppRouter.jsx FRIDGE_TO_RECOMMEND_INTEGRATION.md IMAGE_RECOGNITION_FIX.md

git commit -m "feat: 레시피 추천 페이지 플로우 개선

- 냉장고 → 레시피 추천 재료 자동 전달
- 추천 결과를 같은 페이지에 표시
- 이미지 인식 후 재료 즉시 표시
- 한글 입력 IME 이슈 해결
"
```

## 4. 브랜치 생성 및 푸시

### 새 브랜치 생성
```bash
git checkout -b feature/ui-improvements-and-ai-recipes
```

### 원격 저장소에 푸시
```bash
git push origin feature/ui-improvements-and-ai-recipes
```

### 또는 upstream 설정과 함께 푸시
```bash
git push -u origin feature/ui-improvements-and-ai-recipes
```

## 5. PR 생성

### GitHub에서 PR 생성
1. GitHub 저장소 페이지로 이동
2. "Pull requests" 탭 클릭
3. "New pull request" 버튼 클릭
4. base: main ← compare: feature/ui-improvements-and-ai-recipes
5. "Create pull request" 클릭

### PR 제목
```
🎨 UI/UX 개선 및 OpenAI 레시피 추천 기능 구현
```

### PR 설명
`PR_DESCRIPTION.md` 파일의 내용을 복사하여 붙여넣기

## 6. PR 라벨 추가 (선택사항)

- `enhancement` - 기능 개선
- `feature` - 새로운 기능
- `ui/ux` - UI/UX 관련
- `ai` - AI 기능

## 7. 추가 명령어

### 커밋 수정 (마지막 커밋)
```bash
git commit --amend -m "새로운 커밋 메시지"
```

### 변경사항 확인
```bash
git diff
```

### 커밋 로그 확인
```bash
git log --oneline
```

### 특정 파일만 스테이징 취소
```bash
git reset HEAD <파일명>
```

### 모든 변경사항 취소 (주의!)
```bash
git reset --hard HEAD
```

## 8. 체크리스트

- [ ] 모든 변경사항 커밋 완료
- [ ] 커밋 메시지 작성 완료
- [ ] 브랜치 생성 및 푸시 완료
- [ ] PR 생성 완료
- [ ] PR 설명 작성 완료
- [ ] 리뷰어 지정 완료
- [ ] 라벨 추가 완료

## 9. 참고사항

### Conventional Commits 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 변경 (포맷팅, 세미콜론 등)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

### 좋은 커밋 메시지 작성 팁
1. 제목은 50자 이내
2. 본문은 72자마다 줄바꿈
3. 제목과 본문 사이 빈 줄
4. 제목은 명령형으로 작성
5. 본문에는 "무엇을", "왜" 변경했는지 설명

## 10. 문제 해결

### 푸시 거부 (rejected)
```bash
# 원격 변경사항 가져오기
git pull origin main --rebase

# 충돌 해결 후
git push origin feature/ui-improvements-and-ai-recipes
```

### 잘못된 브랜치에 커밋한 경우
```bash
# 커밋 취소 (변경사항 유지)
git reset --soft HEAD~1

# 올바른 브랜치로 이동
git checkout -b correct-branch

# 다시 커밋
git commit -m "커밋 메시지"
```
