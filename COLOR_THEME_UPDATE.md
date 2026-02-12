# 컬러 테마 변경: 따뜻한 오렌지

## 변경 개요

앱 전체의 컬러 테마를 보라색 계열에서 따뜻한 오렌지 계열로 변경했습니다.

## 새로운 컬러 팔레트

### Primary Colors (주요 색상)
```css
--primary: #f97316          /* 메인 오렌지 */
--primary-dark: #ea580c     /* 진한 오렌지 */
--primary-light: #fb923c    /* 밝은 오렌지 */
--primary-lighter: #fed7aa  /* 더 밝은 오렌지 */
--primary-lightest: #ffedd5 /* 가장 밝은 오렌지 */
```

### Secondary Colors (보조 색상)
```css
--secondary: #fbbf24        /* 골드 */
--secondary-dark: #f59e0b   /* 진한 골드 */
--secondary-light: #fcd34d  /* 밝은 골드 */
```

### Background Colors (배경 색상)
```css
--bg-primary: #ffffff       /* 흰색 */
--bg-secondary: #fff7ed     /* 크림 */
--bg-tertiary: #ffedd5      /* 연한 오렌지 */
```

### Gradients (그라데이션)
```css
--gradient-primary: linear-gradient(135deg, #f97316 0%, #ea580c 100%)
--gradient-warm: linear-gradient(135deg, #fb923c 0%, #f97316 100%)
--gradient-gold: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)
```

## 변경된 파일

### 1. 새로 생성된 파일
- `src/theme.css` - 전역 CSS 변수 및 유틸리티 클래스

### 2. 수정된 파일
- `src/main.jsx` - theme.css import 추가
- `src/components/HomeHub.jsx` - CSS 변수 사용
- `src/components/Login.jsx` - CSS 변수 사용

### 3. 추가 수정 필요 파일
다음 파일들도 CSS 변수로 변경 권장:
- `src/components/RecipeRecommendationPage.jsx`
- `src/components/RecipeDisplay.jsx`
- `src/components/FridgePage.jsx`
- `src/components/HealthProfilePage.jsx`
- `src/components/HealthProfileForm.jsx`
- `src/components/MealHistoryPage.jsx`
- `src/components/IngredientInputForm.jsx`

## 사용 방법

### CSS 변수 사용
```css
/* 이전 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: #667eea;
border-color: #667eea;

/* 변경 후 */
background: var(--gradient-primary);
color: var(--primary);
border-color: var(--primary);
```

### 유틸리티 클래스 사용
```jsx
<div className="gradient-primary">그라데이션 배경</div>
<span className="text-primary">오렌지 텍스트</span>
<button className="btn-primary">버튼</button>
```

## 컬러 선택 이유

### 따뜻한 오렌지 테마의 장점

1. **식욕 자극**
   - 오렌지는 음식과 관련된 앱에 가장 적합한 색상
   - 따뜻하고 친근한 느낌
   - 식욕을 자극하는 심리적 효과

2. **에너지와 활력**
   - 긍정적이고 활기찬 분위기
   - 요리에 대한 열정 표현
   - 사용자의 동기 부여

3. **브랜드 차별화**
   - 대부분의 건강 앱은 그린/블루 사용
   - 오렌지로 독특한 정체성 확립
   - 기억에 남는 비주얼

4. **가독성**
   - 흰색 배경과 높은 대비
   - 명확한 시각적 계층 구조
   - 접근성 향상

## 적용 예시

### 버튼
```jsx
// Primary 버튼
<button className="btn-primary">
  레시피 추천받기
</button>

// Secondary 버튼
<button className="btn-secondary">
  취소
</button>
```

### 카드
```jsx
<div className="card">
  <h3>레시피 제목</h3>
  <p>레시피 설명</p>
</div>
```

### 그라데이션 배경
```jsx
<div style={{ background: 'var(--gradient-primary)' }}>
  <h1>환영합니다</h1>
</div>
```

## 일관성 유지

### CSS 변수 사용 규칙
1. 하드코딩된 색상 값 사용 금지
2. 항상 CSS 변수 사용: `var(--primary)`
3. 새로운 색상 필요 시 theme.css에 추가

### 네이밍 컨벤션
- Primary: 주요 액션, CTA 버튼
- Secondary: 보조 액션, 강조 요소
- Text: 텍스트 색상
- Background: 배경 색상
- Border: 테두리 색상

## 다크 모드 준비

현재는 라이트 모드만 지원하지만, 향후 다크 모드 추가 시:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --primary: #fb923c;
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
    /* ... */
  }
}
```

## 브라우저 지원

CSS 변수는 모든 모던 브라우저에서 지원:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## 성능

CSS 변수 사용의 장점:
- 런타임에 동적 변경 가능
- 파일 크기 감소 (중복 제거)
- 유지보수 용이
- 테마 전환 간편

## 다음 단계

1. ✅ 전역 CSS 변수 정의 (theme.css)
2. ✅ HomeHub 컴포넌트 적용
3. ✅ Login 컴포넌트 적용
4. ⏳ 나머지 컴포넌트 적용
5. ⏳ 다크 모드 지원 추가
6. ⏳ 접근성 테스트

## 참고 자료

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Color Psychology in UI Design](https://www.smashingmagazine.com/2010/01/color-theory-for-designers-part-1-the-meaning-of-color/)
- [Material Design Color System](https://material.io/design/color/the-color-system.html)
