# 배포 가이드

## Vercel 배포 (권장)

Vercel은 Vite 프로젝트를 위한 최적의 배포 플랫폼입니다.

### 방법 1: GitHub 연동 (자동 배포)

1. **GitHub 저장소 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/adhoc-cooking-class.git
   git push -u origin main
   ```

2. **Vercel 대시보드에서 프로젝트 연동**
   - https://vercel.com 접속
   - "New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정 확인 (자동 감지됨)
   - "Deploy" 클릭

3. **환경 변수 설정** (필요시)
   - Vercel 대시보드 → Settings → Environment Variables
   - `VITE_OPENAI_API_KEY` 등 추가

4. **자동 배포**
   - main 브랜치에 푸시할 때마다 자동 배포
   - Pull Request 생성 시 프리뷰 배포

### 방법 2: Vercel CLI

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **배포**
   ```bash
   # 개발 배포
   vercel

   # 프로덕션 배포
   vercel --prod
   ```

## Netlify 배포

1. **Netlify CLI 설치**
   ```bash
   npm i -g netlify-cli
   ```

2. **빌드**
   ```bash
   npm run build
   ```

3. **배포**
   ```bash
   netlify deploy --prod --dir=dist
   ```

또는 Netlify 대시보드에서 GitHub 연동

## GitHub Pages 배포

1. **vite.config.js 수정**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/adhoc-cooking-class/', // 저장소 이름
   })
   ```

2. **배포 스크립트 추가** (package.json)
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **gh-pages 설치**
   ```bash
   npm install --save-dev gh-pages
   ```

4. **배포**
   ```bash
   npm run deploy
   ```

## 환경별 설정

### 개발 환경
```bash
npm run dev
```
- 로컬 개발 서버
- Hot Module Replacement (HMR)
- 소스맵 활성화

### 프로덕션 빌드
```bash
npm run build
```
- 코드 최적화 및 압축
- 트리 쉐이킹
- 청크 분할

### 프리뷰
```bash
npm run preview
```
- 프로덕션 빌드 로컬 테스트

## 성능 최적화

### 1. 이미지 최적화
- WebP 형식 사용
- 적절한 크기로 리사이징
- Lazy loading 적용

### 2. 코드 스플리팅
```javascript
// 동적 import 사용
const LazyComponent = React.lazy(() => import('./Component'));
```

### 3. 캐싱 전략
- Vercel의 자동 캐싱 활용
- Service Worker 구현 (PWA)

### 4. CDN 활용
- 정적 파일은 CDN을 통해 제공
- Vercel Edge Network 자동 활용

## 모니터링

### Vercel Analytics
- 자동으로 활성화됨
- 페이지 뷰, 성능 지표 확인

### Google Analytics 추가
```html
<!-- index.html에 추가 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 도메인 연결

### Vercel에서 커스텀 도메인 설정
1. Vercel 대시보드 → Settings → Domains
2. 도메인 입력 (예: cooking.example.com)
3. DNS 레코드 설정
   - A 레코드: 76.76.21.21
   - CNAME: cname.vercel-dns.com

## 보안

### HTTPS
- Vercel은 자동으로 SSL 인증서 제공
- Let's Encrypt 사용

### 환경 변수
- 민감한 정보는 환경 변수로 관리
- `.env` 파일은 절대 커밋하지 않기
- Vercel 대시보드에서 환경 변수 설정

### CORS 설정
백엔드 API 구축 시:
```javascript
app.use(cors({
  origin: ['https://your-domain.vercel.app'],
  credentials: true
}));
```

## 롤백

### Vercel
- 대시보드에서 이전 배포 버전으로 즉시 롤백 가능
- "Promote to Production" 클릭

### Git
```bash
git revert HEAD
git push
```

## 문제 해결

### 빌드 실패
1. 로컬에서 빌드 테스트
   ```bash
   npm run build
   ```
2. 에러 로그 확인
3. 의존성 버전 확인

### 404 에러
- `vercel.json`의 rewrites 설정 확인
- SPA 라우팅 설정 확인

### 환경 변수 미적용
- Vercel 대시보드에서 환경 변수 확인
- 변수명이 `VITE_`로 시작하는지 확인
- 재배포 필요

## 체크리스트

배포 전 확인사항:
- [ ] 모든 기능 테스트 완료
- [ ] 빌드 에러 없음
- [ ] 환경 변수 설정 완료
- [ ] README.md 업데이트
- [ ] 라이선스 파일 추가
- [ ] .gitignore 확인
- [ ] 민감한 정보 제거
- [ ] 성능 최적화 적용
- [ ] 모바일 반응형 테스트
- [ ] 크로스 브라우저 테스트

## 참고 자료

- [Vercel 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
- [React 배포 가이드](https://react.dev/learn/start-a-new-react-project#deploying-to-production)
