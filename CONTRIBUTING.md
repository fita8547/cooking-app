# 기여 가이드 (Contributing Guide)

## 📋 목차
- [브랜치 전략](#브랜치-전략)
- [워크플로우](#워크플로우)
- [커밋 규칙](#커밋-규칙)
- [Pull Request 가이드](#pull-request-가이드)
- [코드 리뷰](#코드-리뷰)

---

## 🌿 브랜치 전략

### 브랜치 구조

```
main (프로덕션)
  ↑
  └── dev (개발 통합)
        ↑
        ├── feature/35 (기능 개발)
        ├── feature/36 (기능 개발)
        ├── feature/37 (기능 개발)
        └── ...
```

### 브랜치 설명

| 브랜치 | 용도 | 보호 수준 | 배포 |
|--------|------|-----------|------|
| `main` | 프로덕션 배포용 | 🔒 **절대 직접 커밋 금지** | Vercel 자동 배포 |
| `dev` | 개발 통합 브랜치 | ⚠️ PR을 통해서만 머지 | 개발 서버 배포 |
| `feature/N` | 기능 개발 브랜치 | 자유롭게 커밋 가능 | 로컬 개발 |

### 브랜치 명명 규칙

```bash
# 기능 개발
feature/35
feature/36
feature/37

# 버그 수정
bugfix/issue-number

# 핫픽스 (긴급 수정)
hotfix/critical-bug

# 문서 작업
docs/update-readme
```

---

## 🔄 워크플로우

### 1. 새로운 작업 시작

```bash
# 1. dev 브랜치로 이동
git checkout dev

# 2. 최신 코드 받기
git pull origin dev

# 3. 새로운 기능 브랜치 생성 (번호는 순차적으로)
git checkout -b feature/35

# 4. 작업 시작!
```

### 2. 작업 중

```bash
# 변경사항 확인
git status

# 파일 추가
git add .

# 커밋 (커밋 규칙 참고)
git commit -m "feat: 재료 인식 API 연동"

# 원격 저장소에 푸시
git push origin feature/35
```

### 3. Pull Request 생성

1. GitHub에서 `feature/35` → `dev` PR 생성
2. PR 템플릿 작성 (아래 참고)
3. 리뷰어 지정 (팀원)
4. 리뷰 완료 후 머지

### 4. 머지 후 작업

```bash
# 1. dev 브랜치로 이동
git checkout dev

# 2. 최신 코드 받기 (머지된 내용 포함)
git pull origin dev

# 3. 다음 작업을 위한 새 브랜치 생성
git checkout -b feature/36

# 4. 작업 계속!
```

### 5. dev → main 배포

```bash
# dev에서 충분히 테스트 완료 후
# GitHub에서 dev → main PR 생성
# 팀 리더 승인 후 머지
# Vercel 자동 배포 시작
```

---

## 📝 커밋 규칙

### 커밋 메시지 형식

```
<type>: <subject>

<body> (선택사항)

<footer> (선택사항)
```

### Type 종류

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 추가 | `feat: 재료 인식 API 연동` |
| `fix` | 버그 수정 | `fix: 레시피 필터링 오류 수정` |
| `docs` | 문서 수정 | `docs: README 업데이트` |
| `style` | 코드 포맷팅, 세미콜론 등 | `style: 코드 포맷팅 적용` |
| `refactor` | 코드 리팩토링 | `refactor: 상태 관리 로직 개선` |
| `test` | 테스트 코드 추가/수정 | `test: 레시피 생성 테스트 추가` |
| `chore` | 빌드, 패키지 등 기타 작업 | `chore: 의존성 업데이트` |
| `perf` | 성능 개선 | `perf: 이미지 로딩 최적화` |

### 커밋 메시지 예시

```bash
# 좋은 예
git commit -m "feat: OpenAI Vision API 재료 인식 기능 추가"
git commit -m "fix: 레시피 카드 클릭 시 에러 수정"
git commit -m "docs: 배포 가이드 업데이트"

# 나쁜 예
git commit -m "수정"
git commit -m "작업중"
git commit -m "aaa"
```

---

## 🔀 Pull Request 가이드

### PR 템플릿

```markdown
## 📌 작업 내용
<!-- 무엇을 작업했는지 간단히 설명 -->

## 🎯 변경 사항
- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 문서 업데이트
- [ ] 리팩토링
- [ ] 기타: 

## 📸 스크린샷 (UI 변경 시)
<!-- 변경 전/후 스크린샷 -->

## ✅ 체크리스트
- [ ] 로컬에서 테스트 완료
- [ ] 코드 리뷰 준비 완료
- [ ] 문서 업데이트 (필요시)
- [ ] 충돌 해결 완료

## 📝 추가 설명
<!-- 리뷰어가 알아야 할 추가 정보 -->
```

### PR 생성 절차

1. **GitHub 저장소 접속**
   - https://github.com/fita8547/cooking-app

2. **Pull requests 탭 클릭**

3. **New pull request 클릭**

4. **브랜치 선택**
   - base: `dev`
   - compare: `feature/35`

5. **PR 제목 작성**
   ```
   [Feature] 재료 인식 API 연동 (#35)
   ```

6. **PR 설명 작성** (템플릿 사용)

7. **리뷰어 지정**
   - 팀원 1명 이상

8. **Create pull request 클릭**

---

## 👀 코드 리뷰

### 리뷰어 체크리스트

- [ ] 코드가 요구사항을 충족하는가?
- [ ] 버그나 에러가 없는가?
- [ ] 코드 스타일이 일관적인가?
- [ ] 불필요한 코드가 없는가?
- [ ] 성능 이슈가 없는가?
- [ ] 보안 이슈가 없는가?

### 리뷰 코멘트 예시

```markdown
# 승인
LGTM! (Looks Good To Me) 👍

# 수정 요청
이 부분은 `useMemo`를 사용하면 성능이 개선될 것 같습니다.

# 질문
이 로직이 필요한 이유를 설명해주실 수 있나요?
```

---

## 🚨 주의사항

### ❌ 절대 하지 말아야 할 것

1. **main 브랜치에 직접 커밋**
   ```bash
   # 절대 금지!
   git checkout main
   git commit -m "..."
   git push origin main
   ```

2. **dev 브랜치에 직접 커밋**
   ```bash
   # 금지! PR을 통해서만 머지
   git checkout dev
   git commit -m "..."
   git push origin dev
   ```

3. **Force Push (강제 푸시)**
   ```bash
   # 공유 브랜치에서 절대 금지!
   git push -f origin dev
   ```

4. **대용량 파일 커밋**
   - 이미지, 비디오 등은 CDN 사용
   - node_modules는 .gitignore에 포함

### ✅ 권장 사항

1. **자주 커밋하기**
   - 작은 단위로 자주 커밋
   - 의미 있는 단위로 분리

2. **자주 Pull 받기**
   ```bash
   # 작업 전 항상 최신 코드 받기
   git checkout dev
   git pull origin dev
   ```

3. **충돌 해결**
   ```bash
   # 충돌 발생 시
   git checkout feature/35
   git pull origin dev
   # 충돌 해결 후
   git add .
   git commit -m "merge: dev 브랜치 머지"
   git push origin feature/35
   ```

---

## 🔧 유용한 Git 명령어

### 브랜치 관리

```bash
# 현재 브랜치 확인
git branch

# 모든 브랜치 확인 (원격 포함)
git branch -a

# 브랜치 삭제 (로컬)
git branch -d feature/35

# 브랜치 삭제 (원격)
git push origin --delete feature/35

# 브랜치 이름 변경
git branch -m old-name new-name
```

### 변경사항 관리

```bash
# 변경사항 임시 저장
git stash

# 임시 저장 목록 확인
git stash list

# 임시 저장 복원
git stash pop

# 마지막 커밋 수정
git commit --amend

# 특정 파일만 커밋
git add src/App.jsx
git commit -m "feat: App 컴포넌트 수정"
```

### 히스토리 확인

```bash
# 커밋 로그 확인
git log

# 간단한 로그
git log --oneline

# 그래프로 보기
git log --graph --oneline --all

# 특정 파일의 변경 이력
git log -- src/App.jsx
```

---

## 📞 문의

- **팀 리더**: 장준수
- **팀원**: 강제형, 모예송

문제가 있거나 질문이 있으면 언제든지 팀원에게 문의하세요!

---

## 📚 참고 자료

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)
