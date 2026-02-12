import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import { ChefHat, Refrigerator, Heart, ShoppingCart, Clock, User, Sparkles, Flame, Leaf, AlertCircle, Camera, Plus, Minus, ThumbsUp, ThumbsDown, Calendar, TrendingUp, X, ExternalLink, Loader2 } from 'lucide-react';
import { generateRecipes, recognizeIngredients, isApiKeyConfigured } from './services/openai';

// 한글 입력 문제 해결을 위한 독립적인 입력 컴포넌트
const IngredientInput = memo(({ onAdd, onButtonClick }) => {
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onAdd(trimmed);
        setValue('');
      }
    }
  };

  const handleButtonClick = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
    }
  };

  // 부모에게 버튼 클릭 핸들러 전달
  React.useEffect(() => {
    if (onButtonClick) {
      onButtonClick.current = handleButtonClick;
    }
  }, [value, onButtonClick]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onKeyDown={handleKeyDown}
      placeholder="재료를 입력하세요 (예: 김치, 돼지고기)"
      className="input-field"
      autoComplete="off"
    />
  );
});

// 일반 텍스트 입력 컴포넌트 (한글 입력 문제 해결 - 완전 독립형)
const TextInput = memo(({ type = "text", placeholder, initialValue = "", onValueChange, required, autoComplete = "off", name }) => {
  const [value, setValue] = useState(initialValue);
  const [isComposing, setIsComposing] = useState(false);
  const updateTimeoutRef = useRef(null);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const handleBlur = (e) => {
    // 포커스를 잃을 때 부모에게 값 전달
    if (onValueChange) {
      onValueChange(e.target.value);
    }
  };

  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    setValue(e.target.value);
  };

  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className="input-field"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={handleCompositionEnd}
      required={required}
      autoComplete={autoComplete}
      tabIndex={0}
    />
  );
});

// 숫자 입력 컴포넌트 (한글 입력 문제 해결)
const NumberInput = memo(({ placeholder, value, onChange, name }) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (onChange) {
      onChange(localValue);
    }
  };

  return (
    <input
      type="number"
      name={name}
      placeholder={placeholder}
      className="input-field"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      tabIndex={0}
    />
  );
});

export default function AdCookingClass() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const inputRef = useRef(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [filterMode, setFilterMode] = useState('exact'); // 'exact' or 'partial'
  const [healthProfile, setHealthProfile] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    allergies: [],
    goal: '',
    disease: ''
  });
  const [healthProfileCompleted, setHealthProfileCompleted] = useState(false); // 건강정보 입력 완료 여부
  const [mealHistory, setMealHistory] = useState([
    { id: 1, date: '2026-02-10', meal: '김치찌개', rating: 'like', calories: 450 },
    { id: 2, date: '2026-02-09', meal: '샐러드 볼', rating: 'like', calories: 320 },
    { id: 3, date: '2026-02-08', meal: '된장찌개', rating: 'neutral', calories: 280 },
  ]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // AI 관련 상태
  const [aiRecipes, setAiRecipes] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isRecognizingImage, setIsRecognizingImage] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:3000/api';

  // 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    // FormData에서 값 읽기
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('authToken', data.token);
        
        // 건강정보가 이미 있으면 바로 추천 페이지로, 없으면 건강정보 입력 페이지로
        if (data.user.healthProfile && data.user.healthProfile.age) {
          setHealthProfile(data.user.healthProfile);
          setHealthProfileCompleted(true);
          setCurrentPage('recommend');
        } else {
          setCurrentPage('healthSetup');
        }
      } else {
        setAuthError(data.error || '로그인에 실패했습니다');
      }
    } catch (error) {
      setAuthError('서버 연결에 실패했습니다');
    } finally {
      setAuthLoading(false);
    }
  };

  // 회원가입
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');

    // FormData에서 값 읽기
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      setAuthError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      setAuthError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('authToken', data.token);
        
        // 회원가입 후에는 항상 건강정보 입력 페이지로
        setCurrentPage('healthSetup');
      } else {
        setAuthError(data.error || '회원가입에 실패했습니다');
      }
    } catch (error) {
      setAuthError('서버 연결에 실패했습니다');
    } finally {
      setAuthLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('authToken');
    setCurrentPage('login');
  };

  // 비밀번호 찾기
  const handleForgotPassword = () => {
    alert('비밀번호 찾기 기능은 추후 제공될 예정입니다');
  };

  // 샘플 레시피 데이터
  const sampleRecipes = [
    {
      id: 1,
      name: '김치찌개',
      ingredients: ['김치', '돼지고기', '두부', '양파', '고춧가루'],
      cookingTime: 30,
      difficulty: '쉬움',
      calories: 450,
      protein: 25,
      carbs: 35,
      fat: 18,
      image: '🍲',
      purchaseLinks: {
        '김치': 'https://example.com/kimchi',
        '돼지고기': 'https://example.com/pork',
        '두부': 'https://example.com/tofu'
      },
      steps: [
        '김치를 송송 썰어 준비합니다',
        '돼지고기를 한입 크기로 잘라주세요',
        '냄비에 김치와 돼지고기를 넣고 볶아주세요',
        '물을 붓고 끓여주세요',
        '두부와 양파를 넣고 10분간 더 끓입니다'
      ]
    },
    {
      id: 2,
      name: '샐러드 볼',
      ingredients: ['양상추', '토마토', '닭가슴살', '아보카도', '올리브오일'],
      cookingTime: 15,
      difficulty: '쉬움',
      calories: 320,
      protein: 30,
      carbs: 15,
      fat: 12,
      image: '🥗',
      purchaseLinks: {
        '양상추': 'https://example.com/lettuce',
        '닭가슴살': 'https://example.com/chicken',
        '아보카도': 'https://example.com/avocado'
      },
      steps: [
        '양상추를 깨끗이 씻어주세요',
        '닭가슴살을 삶아주세요',
        '토마토와 아보카도를 먹기 좋게 썰어주세요',
        '모든 재료를 그릇에 담아주세요',
        '올리브오일 드레싱을 뿌려주세요'
      ]
    },
    {
      id: 3,
      name: '된장찌개',
      ingredients: ['된장', '두부', '감자', '양파', '호박', '대파'],
      cookingTime: 25,
      difficulty: '쉬움',
      calories: 280,
      protein: 15,
      carbs: 30,
      fat: 8,
      image: '🍜',
      purchaseLinks: {
        '된장': 'https://example.com/doenjang',
        '두부': 'https://example.com/tofu',
        '감자': 'https://example.com/potato'
      },
      steps: [
        '감자와 양파를 큼직하게 썰어주세요',
        '냄비에 물을 붓고 된장을 풀어주세요',
        '감자와 양파를 넣고 끓여주세요',
        '호박과 두부를 넣어주세요',
        '대파를 송송 썰어 마지막에 넣어주세요'
      ]
    },
    {
      id: 4,
      name: '불고기',
      ingredients: ['소고기', '양파', '대파', '당근', '간장', '설탕', '마늘'],
      cookingTime: 40,
      difficulty: '보통',
      calories: 520,
      protein: 35,
      carbs: 28,
      fat: 22,
      image: '🥩',
      purchaseLinks: {
        '소고기': 'https://example.com/beef',
        '간장': 'https://example.com/soy-sauce'
      },
      steps: [
        '소고기를 얇게 썰어주세요',
        '양념장을 만들어주세요 (간장, 설탕, 마늘)',
        '소고기에 양념을 재워주세요',
        '야채를 먹기 좋게 썰어주세요',
        '팬에 고기와 야채를 함께 볶아주세요'
      ]
    },
    {
      id: 5,
      name: '계란말이',
      ingredients: ['계란', '파', '소금', '식용유'],
      cookingTime: 10,
      difficulty: '쉬움',
      calories: 180,
      protein: 12,
      carbs: 3,
      fat: 14,
      image: '🍳',
      purchaseLinks: {
        '계란': 'https://example.com/egg'
      },
      steps: [
        '계란을 풀어주세요',
        '파를 잘게 썰어 계란에 넣어주세요',
        '소금으로 간을 해주세요',
        '팬에 기름을 두르고 계란을 부어주세요',
        '돌돌 말아가며 익혀주세요'
      ]
    }
  ];

  const addIngredient = useCallback((ingredient) => {
    if (ingredient && !ingredients.includes(ingredient)) {
      setIngredients(prev => [...prev, ingredient]);
    }
  }, [ingredients]);

  const removeIngredient = useCallback((ing) => {
    setIngredients(prev => prev.filter(i => i !== ing));
  }, []);

  // 이미지 리사이징 함수 (최대 1024px, 품질 80%)
  const resizeImage = (file, maxWidth = 1024, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 비율 유지하면서 리사이징
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // base64로 변환
          const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 이미지 업로드 후 재료 인식 (OpenAI Vision API 사용)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // API 키 확인
    if (!isApiKeyConfigured()) {
      alert('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
      return;
    }

    setIsRecognizingImage(true);
    setError(null);

    try {
      // 이미지 리사이징 (파일 크기 줄이기)
      console.log('원본 이미지 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const resizedImage = await resizeImage(file);
      console.log('리사이징 후 크기:', (resizedImage.length / 1024 / 1024).toFixed(2), 'MB');

      // 리사이징된 이미지를 File 객체로 변환
      const response = await fetch(resizedImage);
      const blob = await response.blob();
      const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });

      const detected = await recognizeIngredients(resizedFile);
      const ingredientNames = detected
        .filter(item => item.confidence > 0.5) // 신뢰도 50% 이상만
        .map(item => item.name);
      
      setRecognizedIngredients(ingredientNames);
      setShowImageUpload(false);
    } catch (err) {
      console.error('재료 인식 실패:', err);
      setError(err.message);
      alert(err.message);
    } finally {
      setIsRecognizingImage(false);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isRecognizingImage) return;
    
    handleImageUpload(e);
  };

  const confirmRecognizedIngredient = (ing) => {
    if (!ingredients.includes(ing)) {
      setIngredients([...ingredients, ing]);
    }
    setRecognizedIngredients(recognizedIngredients.filter(i => i !== ing));
  };

  const rejectRecognizedIngredient = (ing) => {
    setRecognizedIngredients(recognizedIngredients.filter(i => i !== ing));
  };

  // BMR 및 목표 칼로리 계산 함수
  const calculateBMR = () => {
    const { age, gender, height, weight } = healthProfile;
    if (!age || !gender || !height || !weight) return null;
    
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * parseFloat(weight)) + (4.799 * parseFloat(height)) - (5.677 * parseFloat(age));
    } else {
      bmr = 447.593 + (9.247 * parseFloat(weight)) + (3.098 * parseFloat(height)) - (4.330 * parseFloat(age));
    }
    
    return Math.round(bmr);
  };

  const calculateTargetCalories = () => {
    const bmr = calculateBMR();
    if (!bmr || !healthProfile.goal) return null;
    
    const activityMultiplier = 1.375;
    const tdee = bmr * activityMultiplier;
    
    let targetCalories = tdee;
    if (healthProfile.goal === 'lose') {
      targetCalories = tdee - 500;
    } else if (healthProfile.goal === 'gain') {
      targetCalories = tdee + 500;
    } else if (healthProfile.goal === 'muscle') {
      targetCalories = tdee + 300;
    }
    
    return Math.round(targetCalories);
  };

  // AI 레시피 생성 함수
  const generateAIRecipes = async () => {
    if (ingredients.length === 0) {
      alert('재료를 먼저 입력해주세요.');
      return;
    }

    // API 키 확인
    if (!isApiKeyConfigured()) {
      alert('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
      return;
    }

    setIsLoadingRecipes(true);
    setError(null);

    try {
      // 건강 프로필 준비
      const profile = {
        age: healthProfile.age ? parseInt(healthProfile.age) : undefined,
        gender: healthProfile.gender,
        targetCalories: calculateTargetCalories(),
        allergies: healthProfile.allergies,
        goal: healthProfile.goal
      };

      const recipes = await generateRecipes(ingredients, profile, filterMode);
      
      // 레시피에 ID와 추가 정보 부여
      const recipesWithMetadata = recipes.map((recipe, index) => {
        const recipeIngredients = recipe.ingredients || [];
        return {
          ...recipe,
          id: Date.now() + index,
          matchedIngredients: recipeIngredients
            .filter(ing => ing.isAvailable)
            .map(ing => ing.name),
          missingIngredients: recipeIngredients
            .filter(ing => !ing.isAvailable)
            .map(ing => ing.name),
          canMakeWithOwned: recipeIngredients.length > 0 && recipeIngredients.every(ing => ing.isAvailable),
          purchaseLinks: {} // 실제로는 쇼핑몰 API 연동
        };
      });

      setAiRecipes(recipesWithMetadata);
    } catch (err) {
      console.error('레시피 생성 실패:', err);
      setError(err.message);
      alert(err.message);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // 레시피 필터링 및 정렬 (AI 레시피 + 샘플 레시피 통합)
  const getRecommendedRecipes = () => {
    // AI 레시피가 있으면 우선 사용
    if (aiRecipes.length > 0) {
      return aiRecipes;
    }

    // 샘플 레시피 사용 (기존 로직)
    if (ingredients.length === 0) return sampleRecipes;
    
    const recipesWithMatch = sampleRecipes.map(recipe => {
      const recipeIngredients = recipe.ingredients || [];
      const matchedIngredients = recipeIngredients.filter(recipeIng =>
        ingredients.some(userIng => 
          recipeIng.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(recipeIng.toLowerCase())
        )
      );
      const missingIngredients = recipeIngredients.filter(recipeIng =>
        !ingredients.some(userIng => 
          recipeIng.toLowerCase().includes(userIng.toLowerCase()) ||
          userIng.toLowerCase().includes(recipeIng.toLowerCase())
        )
      );
      
      return {
        ...recipe,
        matchCount: matchedIngredients.length,
        matchedIngredients,
        missingIngredients,
        canMakeWithOwned: missingIngredients.length === 0
      };
    });

    // 필터링
    let filtered = recipesWithMatch;
    if (filterMode === 'exact') {
      filtered = recipesWithMatch.filter(r => r.canMakeWithOwned);
    } else {
      filtered = recipesWithMatch.filter(r => r.matchCount > 0);
    }

    // 정렬: 보유 재료로만 가능한 것 우선, 그 다음 매칭 개수 많은 순
    return filtered.sort((a, b) => {
      if (a.canMakeWithOwned && !b.canMakeWithOwned) return -1;
      if (!a.canMakeWithOwned && b.canMakeWithOwned) return 1;
      return b.matchCount - a.matchCount;
    });
  };

  const addMealToHistory = (recipe, rating) => {
    const newMeal = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      meal: recipe.name,
      rating: rating,
      calories: recipe.calories
    };
    setMealHistory([newMeal, ...mealHistory]);
  };

  const updateMealRating = (mealId, newRating) => {
    setMealHistory(mealHistory.map(meal => 
      meal.id === mealId ? { ...meal, rating: newRating } : meal
    ));
  };

  const deleteMeal = (mealId) => {
    setMealHistory(mealHistory.filter(meal => meal.id !== mealId));
  };

  const getPersonalizedRecommendations = () => {
    // 좋아요 표시한 요리들의 재료 분석
    const likedMeals = mealHistory.filter(m => m.rating === 'like');
    // 실제로는 AI 분석 기반 추천
    return sampleRecipes.slice(0, 3);
  };

  const startCooking = (recipe) => {
    setSelectedRecipe(recipe);
    setCurrentStep(0);
    setCurrentPage('coaching');
  };

  const finishCooking = (rating) => {
    if (selectedRecipe) {
      addMealToHistory(selectedRecipe, rating);
      alert(`요리 완성! ${rating === 'like' ? '맛있게 드세요 😊' : rating === 'dislike' ? '다음엔 더 좋은 레시피를 추천해드릴게요!' : '기록되었습니다!'}`);
      setCurrentPage('home');
    }
  };

  // 홈 페이지 - 두 개의 큰 카드 with 상태 배지
  const HomePage = () => {
    const lastUpdate = ingredients.length > 0 ? '어제' : '비었어요';
    
    return (
      <div className="home-page">
        <div className="hero-section">
          <div className="hero-text">
            <h1 className="hero-title">
              냉장고 재료로<br />
              <span className="gradient-text">맛있는 요리</span>를<br />
              만들어보세요
            </h1>
            <p className="hero-subtitle">AI가 당신의 재료를 분석하고 최적의 레시피를 추천합니다</p>
          </div>
          <div className="hero-emoji">🍳</div>
        </div>

        <div className="main-cards-grid">
          {/* 우리집 냉장고 카드 */}
          <div className="main-card" onClick={() => setCurrentPage('fridge')}>
            <div className="card-header">
              <div className="card-icon">
                <Refrigerator size={48} />
              </div>
              <div className="card-badge">
                <span className="badge-count">{ingredients.length}개 재료</span>
              </div>
            </div>
            <h2 className="card-title">우리집 냉장고</h2>
            <p className="card-description">냉장고에 있는 재료를 입력하고 관리하세요</p>
            <div className="card-status">
              <span className="status-label">최근 업데이트:</span>
              <span className="status-value">{lastUpdate}</span>
            </div>
          </div>

          {/* 레시피 추천 카드 */}
          <div className="main-card" onClick={() => setCurrentPage('recommend')}>
            <div className="card-header">
              <div className="card-icon sparkle">
                <Sparkles size={48} />
              </div>
              {ingredients.length > 0 && (
                <div className="card-badge success">
                  <span className="badge-ready">추천 가능</span>
                </div>
              )}
            </div>
            <h2 className="card-title">레시피 추천</h2>
            <p className="card-description">
              {ingredients.length === 0 
                ? '재료를 먼저 등록하세요' 
                : `${ingredients.length}개 재료로 추천받기`}
            </p>
            <div className="card-status">
              {ingredients.length === 0 ? (
                <span className="status-empty">👈 먼저 냉장고에 재료를 추가해주세요</span>
              ) : (
                <span className="status-ready">✨ 지금 바로 추천받을 수 있어요</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 우리집 냉장고 페이지 (재료 입력 및 사진 인식)
  const FridgePage = () => {
    const addButtonClickRef = useRef(null);
    
    return (
      <div className="fridge-page">
        <h2 className="page-title">우리집 냉장고</h2>
        <p className="page-subtitle">냉장고 사진을 찍어서 재료를 자동으로 인식하거나 직접 입력하세요</p>
        
        {/* 사진 촬영 버튼 */}
        <div className="camera-section">
          <button onClick={() => setShowImageUpload(true)} className="btn-camera-large">
            <Camera size={32} />
            <span>냉장고 사진 찍기</span>
            <p className="camera-hint">AI가 자동으로 재료를 인식해요</p>
          </button>
        </div>

        {/* 이미지 업로드 모달 */}
        {showImageUpload && (
          <div className="modal-overlay" onClick={() => !isRecognizingImage && setShowImageUpload(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>냉장고 촬영하기</h3>
                {!isRecognizingImage && (
                  <button onClick={() => setShowImageUpload(false)} className="modal-close">
                    <X size={24} />
                  </button>
                )}
              </div>
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isRecognizingImage ? (
                  <>
                    <Loader2 size={64} className="spinning" style={{ color: '#6c5ce7' }} />
                    <p style={{ marginTop: '16px', fontWeight: '600' }}>AI가 재료를 인식하는 중...</p>
                    <p style={{ fontSize: '14px', color: '#636e72' }}>잠시만 기다려주세요</p>
                  </>
                ) : (
                  <>
                    <Camera size={64} />
                    <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                      {isDragging ? '여기에 이미지를 놓으세요' : '냉장고 사진을 업로드하세요'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '24px' }}>
                      이미지를 드래그하거나 클릭해서 선택하세요
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="camera-input"
                    />
                    <label htmlFor="camera-input" className="btn-upload">
                      사진 선택
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 인식된 재료 */}
        {recognizedIngredients.length > 0 && (
          <div className="recognized-section">
            <h3>🎯 인식된 재료</h3>
            <p className="section-hint">추가하려는 재료를 선택하세요</p>
            <div className="recognized-list">
              {recognizedIngredients.map((ing, idx) => (
                <div key={idx} className="recognized-item">
                  <span>{ing}</span>
                  <button onClick={() => {
                    addIngredient(ing);
                    setRecognizedIngredients(prev => prev.filter((_, i) => i !== idx));
                  }} className="btn-add-recognized">
                    <Plus size={16} />
                    추가
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                recognizedIngredients.forEach(ing => addIngredient(ing));
                setRecognizedIngredients([]);
              }}
              className="btn-add-all"
            >
              모두 추가하기
            </button>
          </div>
        )}

        {/* 직접 입력 */}
        <div className="manual-input-section">
          <h3>✏️ 직접 입력하기</h3>
          <div className="input-group">
            <IngredientInput onAdd={addIngredient} onButtonClick={addButtonClickRef} />
            <button onClick={() => addButtonClickRef.current?.()} className="btn-add">
              추가
            </button>
          </div>
        </div>

        {/* 내 재료 목록 */}
        {ingredients.length > 0 && (
          <div className="my-ingredients-section">
            <div className="section-header">
              <h3>📦 내 재료 ({ingredients.length}개)</h3>
              <button onClick={() => setIngredients([])} className="btn-clear">
                전체 삭제
              </button>
            </div>
            <div className="ingredient-tags">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="ingredient-tag">
                  {ing}
                  <button onClick={() => removeIngredient(ing)} className="remove-btn">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage('recommend')} 
              className="btn-primary btn-large"
            >
              <Sparkles size={20} />
              이 재료로 레시피 추천받기
            </button>
          </div>
        )}

        {ingredients.length === 0 && recognizedIngredients.length === 0 && (
          <div className="empty-state">
            <Refrigerator size={80} style={{ color: '#dfe6e9', marginBottom: '16px' }} />
            <h3>냉장고가 비어있어요</h3>
            <p>사진을 찍거나 직접 입력해서 재료를 추가해보세요</p>
          </div>
        )}
      </div>
    );
  };

  // 재료 추천 페이지
  const RecommendPage = () => {
    const recommendedRecipes = useMemo(() => getRecommendedRecipes(), [ingredients, aiRecipes, filterMode]);
    const addButtonClickRef = useRef(null);
    
    return (
      <div className="recommend-page">
        <h2 className="page-title">냉장고 재료 입력</h2>
        
        <div className="ingredient-input-section">
          <div className="input-group">
            <IngredientInput onAdd={addIngredient} onButtonClick={addButtonClickRef} />
            <button onClick={() => addButtonClickRef.current?.()} className="btn-add">추가</button>
            <button onClick={() => setShowImageUpload(true)} className="btn-camera">
              <Camera size={20} />
              촬영
            </button>
          </div>

          {/* 이미지 업로드 모달 */}
          {showImageUpload && (
            <div className="modal-overlay" onClick={() => !isRecognizingImage && setShowImageUpload(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>냉장고 촬영하기</h3>
                  {!isRecognizingImage && (
                    <button onClick={() => setShowImageUpload(false)} className="modal-close">
                      <X size={24} />
                    </button>
                  )}
                </div>
                <div 
                  className={`upload-area ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {isRecognizingImage ? (
                    <>
                      <Loader2 size={64} className="spinning" style={{ color: '#6c5ce7' }} />
                      <p style={{ marginTop: '16px', fontWeight: '600' }}>AI가 재료를 인식하는 중...</p>
                      <p style={{ fontSize: '14px', color: '#636e72' }}>잠시만 기다려주세요</p>
                    </>
                  ) : (
                    <>
                      <Camera size={64} />
                      <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        {isDragging ? '여기에 이미지를 놓으세요' : '냉장고 사진을 업로드하세요'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '16px' }}>
                        드래그 앤 드롭 또는 클릭하여 업로드
                      </p>
                      <label className="btn-primary" style={{marginTop: '16px', cursor: 'pointer'}}>
                        사진 선택
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          style={{display: 'none'}}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 인식된 재료 확인 */}
          {recognizedIngredients.length > 0 && (
            <div className="recognized-section">
              <h4>인식된 재료를 확인해주세요</h4>
              <div className="recognized-tags">
                {recognizedIngredients.map((ing, idx) => (
                  <div key={idx} className="recognized-tag">
                    <span>{ing}</span>
                    <div className="tag-actions">
                      <button onClick={() => confirmRecognizedIngredient(ing)} className="tag-confirm">
                        ✓
                      </button>
                      <button onClick={() => rejectRecognizedIngredient(ing)} className="tag-reject">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="ingredient-tags">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="ingredient-tag">
                  {ing}
                  <button onClick={() => removeIngredient(ing)} className="tag-remove">×</button>
                </div>
              ))}
            </div>
          )}

          {/* 필터 옵션 및 AI 레시피 생성 버튼 */}
          {ingredients.length > 0 && (
            <>
              <div className="filter-section">
                <button 
                  className={`filter-btn ${filterMode === 'exact' ? 'active' : ''}`}
                  onClick={() => setFilterMode('exact')}
                >
                  보유 재료만
                </button>
                <button 
                  className={`filter-btn ${filterMode === 'partial' ? 'active' : ''}`}
                  onClick={() => setFilterMode('partial')}
                >
                  일부 재료 추가 허용
                </button>
              </div>
              
              {/* AI 레시피 생성 버튼 */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button 
                  onClick={generateAIRecipes}
                  disabled={isLoadingRecipes}
                  className="btn-ai-generate"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoadingRecipes ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isLoadingRecipes ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isLoadingRecipes ? (
                    <>
                      <Loader2 size={20} className="spinning" />
                      AI 레시피 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      AI 레시피 생성
                    </>
                  )}
                </button>
                {aiRecipes.length > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#00b894' }}>
                    ✓ AI가 {aiRecipes.length}개의 맞춤 레시피를 생성했습니다
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="recipe-section">
          <h3 className="section-title">
            <Sparkles size={20} />
            추천 레시피 ({recommendedRecipes.length})
          </h3>
          
          {recommendedRecipes.length === 0 ? (
            <div className="empty-state">
              <p>조건에 맞는 레시피가 없습니다.</p>
              <p>필터를 변경하거나 재료를 추가해보세요.</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {recommendedRecipes.map(recipe => (
                <div key={recipe.id} className="recipe-card">
                  {recipe.canMakeWithOwned && (
                    <div className="perfect-match-badge">
                      ✨ 바로 조리 가능
                    </div>
                  )}
                  <div className="recipe-emoji">{recipe.image}</div>
                  <h4>{recipe.name}</h4>
                  <div className="recipe-meta">
                    <span><Clock size={16} /> {recipe.cookingTime}분</span>
                    <span><Flame size={16} /> {recipe.calories}kcal</span>
                  </div>
                  
                  {/* 매칭된 재료 */}
                  <div className="matched-ingredients">
                    <div className="ingredient-status">
                      <span className="status-label">보유 재료:</span>
                      {recipe.matchedIngredients && recipe.matchedIngredients.slice(0, 3).map((ing, idx) => (
                        <span key={idx} className="mini-tag matched">{ing}</span>
                      ))}
                      {recipe.matchedIngredients && recipe.matchedIngredients.length > 3 && (
                        <span className="mini-tag">+{recipe.matchedIngredients.length - 3}</span>
                      )}
                    </div>
                    
                    {/* 부족한 재료 */}
                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                      <div className="ingredient-status missing-section">
                        <span className="status-label missing">필요 재료:</span>
                        {recipe.missingIngredients.map((ing, idx) => (
                          <span key={idx} className="mini-tag missing-tag">
                            {ing}
                            {recipe.purchaseLinks && recipe.purchaseLinks[ing] && (
                              <a href={recipe.purchaseLinks[ing]} target="_blank" rel="noopener noreferrer" className="purchase-link">
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={() => startCooking(recipe)}
                  >
                    요리 시작하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 요리 코칭 페이지
  const CoachingPage = () => {
    if (!selectedRecipe) return null;

    const progress = ((currentStep + 1) / selectedRecipe.steps.length) * 100;
    const isLastStep = currentStep === selectedRecipe.steps.length - 1;

    return (
      <div className="coaching-page">
        <div className="coaching-header">
          <button onClick={() => setCurrentPage('recommend')} className="btn-back">← 뒤로</button>
          <h2>{selectedRecipe.name}</h2>
          <div className="step-indicator">
            {currentStep + 1} / {selectedRecipe.steps.length}
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="step-content">
          <div className="step-number">STEP {currentStep + 1}</div>
          <p className="step-instruction">{selectedRecipe.steps[currentStep]}</p>
          
          <div className="step-emoji">{selectedRecipe.image}</div>
        </div>

        <div className="step-navigation">
          {currentStep > 0 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn-secondary"
            >
              이전 단계
            </button>
          )}
          
          {!isLastStep ? (
            <button 
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn-primary"
            >
              다음 단계
            </button>
          ) : (
            <div className="finish-section">
              <p className="finish-label">요리가 완성되었습니다! 어떠셨나요?</p>
              <div className="rating-buttons">
                <button 
                  onClick={() => finishCooking('like')}
                  className="btn-rating like"
                >
                  <ThumbsUp size={20} />
                  맛있어요
                </button>
                <button 
                  onClick={() => finishCooking('neutral')}
                  className="btn-rating neutral"
                >
                  보통이에요
                </button>
                <button 
                  onClick={() => finishCooking('dislike')}
                  className="btn-rating dislike"
                >
                  <ThumbsDown size={20} />
                  별로에요
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 건강정보 초기 설정 페이지 (로그인 직후)
  const HealthSetupPage = () => {
    const handleSaveHealthProfile = () => {
      // 건강정보 저장 (나중에 백엔드 연동)
      setHealthProfileCompleted(true);
      setCurrentPage('recommend');
    };

    const handleSkip = () => {
      // 건강정보 입력 건너뛰기
      setCurrentPage('recommend');
    };

    return (
      <div className="health-setup-page">
        <div className="setup-container">
          <h2 className="page-title">건강 정보 입력</h2>
          <p className="setup-description">
            더 정확한 맞춤 레시피 추천을 위해 건강 정보를 입력해주세요.
            <br />
            나중에 언제든지 수정할 수 있습니다.
          </p>
          
          <div className="health-form">
            <div className="form-row">
              <div className="form-group">
                <label>나이</label>
                <NumberInput
                  name="age"
                  placeholder="30"
                  value={healthProfile.age}
                  onChange={(value) => setHealthProfile(prev => ({...prev, age: value}))}
                />
              </div>

              <div className="form-group">
                <label>성별</label>
                <select 
                  className="input-field"
                  value={healthProfile.gender}
                  onChange={(e) => setHealthProfile(prev => ({...prev, gender: e.target.value}))}
                  tabIndex={0}
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>키 (cm)</label>
                <NumberInput
                  name="height"
                  placeholder="170"
                  value={healthProfile.height}
                  onChange={(value) => setHealthProfile(prev => ({...prev, height: value}))}
                />
              </div>

              <div className="form-group">
                <label>몸무게 (kg)</label>
                <NumberInput
                  name="weight"
                  placeholder="65"
                  value={healthProfile.weight}
                  onChange={(value) => setHealthProfile(prev => ({...prev, weight: value}))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>목표</label>
              <select 
                className="input-field"
                value={healthProfile.goal}
                onChange={(e) => setHealthProfile({...healthProfile, goal: e.target.value})}
              >
                <option value="">선택하세요</option>
                <option value="lose">체중 감량</option>
                <option value="maintain">체중 유지</option>
                <option value="gain">체중 증가</option>
                <option value="muscle">근육 증가</option>
              </select>
            </div>

            <div className="form-group">
              <label>알레르기 (선택사항)</label>
              <div className="allergy-options">
                {['우유', '계란', '땅콩', '갑각류', '밀', '대두'].map(item => (
                  <label key={item} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={healthProfile.allergies.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHealthProfile({
                            ...healthProfile,
                            allergies: [...healthProfile.allergies, item]
                          });
                        } else {
                          setHealthProfile({
                            ...healthProfile,
                            allergies: healthProfile.allergies.filter(a => a !== item)
                          });
                        }
                      }}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="setup-buttons">
              <button onClick={handleSkip} className="btn-skip-subtle">
                Skip
              </button>
              <button onClick={handleSaveHealthProfile} className="btn-confirm">
                확인
              </button>
            </div>

            <p className="profile-notice">
              💡 언제든 프로필에서 수정 가능해요
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 건강 식단 페이지
  const HealthPage = () => {
    const bmr = calculateBMR();
    const targetCalories = calculateTargetCalories();

    return (
      <div className="health-page">
        <h2 className="page-title">건강 프로필 설정</h2>
        
        <div className="health-form">
          <div className="form-row">
            <div className="form-group">
              <label>나이</label>
              <input
                type="number"
                value={healthProfile.age}
                onChange={(e) => setHealthProfile({...healthProfile, age: e.target.value})}
                className="input-field"
                placeholder="30"
              />
            </div>

            <div className="form-group">
              <label>성별</label>
              <select 
                className="input-field"
                value={healthProfile.gender}
                onChange={(e) => setHealthProfile({...healthProfile, gender: e.target.value})}
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>키 (cm)</label>
              <input
                type="number"
                value={healthProfile.height}
                onChange={(e) => setHealthProfile({...healthProfile, height: e.target.value})}
                className="input-field"
                placeholder="170"
              />
            </div>

            <div className="form-group">
              <label>몸무게 (kg)</label>
              <input
                type="number"
                value={healthProfile.weight}
                onChange={(e) => setHealthProfile({...healthProfile, weight: e.target.value})}
                className="input-field"
                placeholder="65"
              />
            </div>
          </div>

          <div className="form-group">
            <label>목표</label>
            <select 
              className="input-field"
              value={healthProfile.goal}
              onChange={(e) => setHealthProfile({...healthProfile, goal: e.target.value})}
            >
              <option value="">선택하세요</option>
              <option value="lose">체중 감량</option>
              <option value="maintain">체중 유지</option>
              <option value="gain">체중 증가</option>
              <option value="muscle">근육 증가</option>
            </select>
          </div>

          <div className="form-group">
            <label>질환 (선택사항)</label>
            <select 
              className="input-field"
              value={healthProfile.disease}
              onChange={(e) => setHealthProfile({...healthProfile, disease: e.target.value})}
            >
              <option value="">없음</option>
              <option value="diabetes">당뇨</option>
              <option value="hypertension">고혈압</option>
              <option value="heart">심장질환</option>
              <option value="kidney">신장질환</option>
            </select>
          </div>

          <div className="form-group">
            <label>알레르기</label>
            <div className="allergy-options">
              {['우유', '계란', '땅콩', '갑각류', '밀', '대두'].map(item => (
                <label key={item} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={healthProfile.allergies.includes(item)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setHealthProfile({
                          ...healthProfile,
                          allergies: [...healthProfile.allergies, item]
                        });
                      } else {
                        setHealthProfile({
                          ...healthProfile,
                          allergies: healthProfile.allergies.filter(a => a !== item)
                        });
                      }
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {bmr && targetCalories && (
            <div className="nutrition-summary">
              <div className="summary-card">
                <h4>기초대사량 (BMR)</h4>
                <p className="summary-value">{bmr} <span>kcal</span></p>
              </div>
              <div className="summary-card">
                <h4>목표 칼로리</h4>
                <p className="summary-value">{targetCalories} <span>kcal</span></p>
              </div>
            </div>
          )}

          <button className="btn-primary">맞춤 식단 받기</button>
        </div>

        <div className="health-tips">
          <div className="tip-card">
            <Leaf size={24} />
            <h4>균형잡힌 영양</h4>
            <p>탄수화물, 단백질, 지방의 균형을 맞춰 드려요</p>
          </div>
          <div className="tip-card">
            <AlertCircle size={24} />
            <h4>알레르기 관리</h4>
            <p>설정한 알레르기 재료는 자동으로 제외됩니다</p>
          </div>
        </div>
      </div>
    );
  };

  // 식사 기록 페이지
  const HistoryPage = () => {
    const totalCalories = mealHistory.reduce((sum, meal) => sum + meal.calories, 0);
    const likedMeals = mealHistory.filter(m => m.rating === 'like').length;
    const personalizedRecipes = getPersonalizedRecommendations();

    return (
      <div className="history-page">
        <h2 className="page-title">식사 기록</h2>

        {/* 통계 카드 */}
        <div className="stats-grid">
          <div className="stat-card">
            <Calendar size={24} />
            <div>
              <p className="stat-label">총 기록</p>
              <p className="stat-value">{mealHistory.length}끼</p>
            </div>
          </div>
          <div className="stat-card">
            <Flame size={24} />
            <div>
              <p className="stat-label">총 섭취</p>
              <p className="stat-value">{totalCalories}kcal</p>
            </div>
          </div>
          <div className="stat-card">
            <Heart size={24} />
            <div>
              <p className="stat-label">좋아요</p>
              <p className="stat-value">{likedMeals}끼</p>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp size={24} />
            <div>
              <p className="stat-label">평균</p>
              <p className="stat-value">
                {mealHistory.length > 0 ? Math.round(totalCalories / mealHistory.length) : 0}kcal
              </p>
            </div>
          </div>
        </div>

        {/* 개인화 추천 */}
        {likedMeals > 0 && (
          <div className="personalized-section">
            <h3 className="section-title">
              <Sparkles size={20} />
              당신을 위한 추천
            </h3>
            <p className="section-description">
              좋아하신 요리를 분석해 비슷한 레시피를 추천드려요
            </p>
            <div className="recipe-grid-small">
              {personalizedRecipes.map(recipe => (
                <div key={recipe.id} className="recipe-card-small" onClick={() => startCooking(recipe)}>
                  <div className="recipe-emoji-small">{recipe.image}</div>
                  <div>
                    <h4>{recipe.name}</h4>
                    <p>{recipe.calories}kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 식사 기록 목록 */}
        <div className="meal-list">
          <h3 className="section-title">기록 내역</h3>
          {mealHistory.length === 0 ? (
            <div className="empty-state">
              <p>아직 식사 기록이 없습니다.</p>
              <p>요리를 완성하고 평가해보세요!</p>
            </div>
          ) : (
            <div className="meal-items">
              {mealHistory.map(meal => (
                <div key={meal.id} className="meal-item">
                  <div className="meal-info">
                    <div className="meal-date">{meal.date}</div>
                    <div className="meal-name">{meal.meal}</div>
                    <div className="meal-calories">{meal.calories}kcal</div>
                  </div>
                  <div className="meal-actions">
                    <button 
                      className={`rating-icon ${meal.rating === 'like' ? 'active' : ''}`}
                      onClick={() => updateMealRating(meal.id, meal.rating === 'like' ? 'neutral' : 'like')}
                    >
                      <ThumbsUp size={18} />
                    </button>
                    <button 
                      className={`rating-icon ${meal.rating === 'dislike' ? 'active' : ''}`}
                      onClick={() => updateMealRating(meal.id, meal.rating === 'dislike' ? 'neutral' : 'dislike')}
                    >
                      <ThumbsDown size={18} />
                    </button>
                    <button 
                      className="delete-icon"
                      onClick={() => {
                        if (confirm('이 기록을 삭제하시겠습니까?')) {
                          deleteMeal(meal.id);
                        }
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 네비게이션 바
  const Navigation = () => (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setCurrentPage('home')}>
        <ChefHat size={28} />
        <span>애드쿠킹클래스</span>
      </div>
      
      <div className="nav-menu">
        <button onClick={() => setCurrentPage('home')} className={currentPage === 'home' ? 'active' : ''}>
          홈
        </button>
        <button onClick={() => setCurrentPage('recommend')} className={currentPage === 'recommend' ? 'active' : ''}>
          레시피 추천
        </button>
        <button onClick={() => setCurrentPage('health')} className={currentPage === 'health' ? 'active' : ''}>
          건강 식단
        </button>
        <button onClick={() => setCurrentPage('history')} className={currentPage === 'history' ? 'active' : ''}>
          식사 기록
        </button>
        <button className="nav-user" onClick={handleLogout} title="로그아웃">
          <User size={20} />
          {user && <span style={{marginLeft: '8px', fontSize: '14px'}}>{user.name}</span>}
        </button>
      </div>
    </nav>
  );

  // 로그인 페이지
  const LoginPage = () => {
    return (
      <>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            min-height: 100vh;
          }

          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .login-card {
            background: white;
            border-radius: 24px;
            padding: 48px;
            box-shadow: 0 20px 60px rgba(252, 182, 159, 0.3);
            max-width: 420px;
            width: 100%;
            animation: slideUp 0.6s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .login-header {
            text-align: center;
            margin-bottom: 40px;
          }

          .login-header svg {
            color: #ff6b6b;
            margin-bottom: 16px;
          }

          .login-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #2d3436;
            margin-bottom: 8px;
          }

          .login-header p {
            color: #636e72;
            font-size: 15px;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .input-field {
            padding: 16px 20px;
            border: 2px solid #f1f3f4;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s ease;
            font-family: inherit;
          }

          .input-field:focus {
            outline: none;
            border-color: #ff6b6b;
            box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
          }

          .btn-primary {
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
          }

          .auth-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            background: #f7fafc;
            padding: 4px;
            border-radius: 12px;
          }

          .auth-tab {
            flex: 1;
            padding: 12px;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            color: #718096;
            cursor: pointer;
            transition: all 0.2s;
          }

          .auth-tab.active {
            background: white;
            color: #ff6b6b;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }

          .auth-error {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            color: #c53030;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }

          .btn-text {
            background: none;
            border: none;
            color: #718096;
            font-size: 14px;
            cursor: pointer;
            padding: 8px;
            text-decoration: underline;
          }

          .btn-text:hover {
            color: #ff6b6b;
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .test-account-info {
            background: #e3f2fd;
            border: 1px solid #90caf9;
            color: #1565c0;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
            line-height: 1.5;
          }

          .test-account-info strong {
            display: block;
            margin-bottom: 4px;
          }
        `}</style>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <ChefHat size={48} />
              <h1>애드쿠킹클래스</h1>
              <p>AI가 당신의 요리를 돕습니다</p>
            </div>

            {authMode === 'login' && (
              <div className="test-account-info">
                <strong>🔑 테스트 계정</strong>
                이메일: test@example.com<br />
                비밀번호: test1234
              </div>
            )}
            
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                로그인
              </button>
              <button 
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                회원가입
              </button>
            </div>

            {authError && (
              <div className="auth-error">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}
            
            <form className="login-form" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' && (
                <TextInput
                  type="text" 
                  name="name"
                  placeholder="이름"
                  initialValue=""
                  required
                />
              )}
              
              <TextInput
                type="email"
                name="email"
                placeholder="이메일"
                initialValue=""
                required
                autoComplete="email"
              />
              
              <TextInput
                type="password"
                name="password"
                placeholder="비밀번호"
                initialValue=""
                required
                autoComplete="current-password"
              />
              
              {authMode === 'register' && (
                <TextInput
                  type="password"
                  name="confirmPassword"
                  placeholder="비밀번호 확인"
                  initialValue=""
                  required
                  autoComplete="new-password"
                />
              )}
              
              <button 
                type="submit"
                className="btn-primary"
                disabled={authLoading}
              >
                {authLoading ? '처리 중...' : (authMode === 'login' ? '로그인' : '회원가입')}
              </button>
              
              {authMode === 'login' && (
                <button 
                  type="button"
                  className="btn-text"
                  onClick={handleForgotPassword}
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
            </form>
          </div>
        </div>
      </>
    );
  };

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          background: #fafafa;
        }

        /* Navigation */
        .navbar {
          background: white;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          cursor: pointer;
        }

        .nav-brand svg {
          color: #ff6b6b;
        }

        .nav-menu {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-menu button {
          background: none;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          color: #636e72;
          transition: all 0.2s;
          font-family: inherit;
        }

        .nav-menu button:hover {
          background: #f8f9fa;
          color: #2d3436;
        }

        .nav-menu button.active {
          background: #fff5f5;
          color: #ff6b6b;
        }

        .nav-user {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ff6b6b !important;
          color: white !important;
          margin-left: 8px;
        }

        /* Home Page */
        .home-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .hero-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 80px;
          gap: 60px;
        }

        .hero-text {
          flex: 1;
        }

        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.2;
          color: #2d3436;
          margin-bottom: 24px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #636e72;
          line-height: 1.6;
        }

        .hero-emoji {
          font-size: 200px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        /* Main Cards Grid - 두 개의 큰 카드 */
        .main-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .main-card {
          background: white;
          padding: 40px;
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid #f1f3f4;
          position: relative;
          overflow: hidden;
        }

        .main-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.12);
          border-color: #ff6b6b;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .card-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .card-icon.sparkle {
          background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
        }

        .card-badge {
          background: #fff5f5;
          color: #ff6b6b;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .card-badge.success {
          background: #e8f5e9;
          color: #4caf50;
        }

        .badge-count {
          display: block;
        }

        .badge-ready {
          display: block;
        }

        .card-title {
          font-size: 28px;
          font-weight: 800;
          color: #2d3436;
          margin-bottom: 12px;
        }

        .card-description {
          font-size: 16px;
          color: #636e72;
          line-height: 1.6;
          margin-bottom: 24px;
          min-height: 48px;
        }

        .card-status {
          padding-top: 20px;
          border-top: 2px solid #f1f3f4;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-label {
          color: #95a5a6;
          font-weight: 500;
        }

        .status-value {
          color: #2d3436;
          font-weight: 600;
        }

        .status-empty {
          color: #95a5a6;
          font-weight: 500;
        }

        .status-ready {
          color: #4caf50;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .main-cards-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .main-card {
            padding: 32px;
          }

          .card-title {
            font-size: 24px;
          }
        }

        .feature-card {
          background: white;
          padding: 32px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border-color: #ff6b6b;
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: white;
        }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 12px;
        }

        .feature-card p {
          font-size: 15px;
          color: #636e72;
          line-height: 1.6;
        }

        /* Recommend Page */
        .recommend-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* Fridge Page */
        .fridge-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .page-subtitle {
          font-size: 16px;
          color: #636e72;
          margin-bottom: 40px;
          text-align: center;
        }

        .camera-section {
          margin-bottom: 40px;
        }

        .btn-camera-large {
          width: 100%;
          background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
          color: white;
          border: none;
          padding: 48px 32px;
          border-radius: 24px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 24px rgba(108, 92, 231, 0.3);
        }

        .btn-camera-large:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(108, 92, 231, 0.4);
        }

        .camera-hint {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.9;
          margin: 0;
        }

        .recognized-section {
          background: #f0f3ff;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 32px;
          border: 2px solid #6c5ce7;
        }

        .recognized-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 8px;
        }

        .section-hint {
          font-size: 14px;
          color: #636e72;
          margin-bottom: 20px;
        }

        .recognized-list {
          display: grid;
          gap: 12px;
          margin-bottom: 20px;
        }

        .recognized-item {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
          color: #2d3436;
        }

        .btn-add-recognized {
          background: #6c5ce7;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-add-recognized:hover {
          background: #5f4dd1;
        }

        .btn-add-all {
          width: 100%;
          background: #6c5ce7;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-all:hover {
          background: #5f4dd1;
        }

        .manual-input-section {
          background: white;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .manual-input-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 20px;
        }

        .my-ingredients-section {
          background: white;
          padding: 32px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .my-ingredients-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .btn-clear {
          background: transparent;
          color: #ff6b6b;
          border: 1px solid #ff6b6b;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear:hover {
          background: #fff5f5;
        }

        .btn-large {
          width: 100%;
          margin-top: 24px;
          padding: 18px;
          font-size: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #95a5a6;
        }

        .empty-state h3 {
          font-size: 24px;
          font-weight: 700;
          color: #636e72;
          margin-bottom: 12px;
        }

        .empty-state p {
          font-size: 16px;
          color: #95a5a6;
        }

        .page-title {
          font-size: 36px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 32px;
        }

        .ingredient-input-section {
          background: white;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .input-group .input-field {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #f1f3f4;
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
        }

        .input-group .input-field:focus {
          outline: none;
          border-color: #ff6b6b;
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
        }

        .btn-add {
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .btn-add:hover {
          background: #ff5252;
        }

        .ingredient-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ingredient-tag {
          background: #fff5f5;
          color: #ff6b6b;
          padding: 10px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .tag-remove {
          background: none;
          border: none;
          color: #ff6b6b;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .tag-remove:hover {
          background: #ffebee;
        }

        .recipe-section {
          margin-top: 40px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title svg {
          color: #ffd93d;
        }

        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .recipe-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .recipe-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .recipe-emoji {
          font-size: 64px;
          text-align: center;
          margin-bottom: 16px;
        }

        .recipe-card h4 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 12px;
          text-align: center;
        }

        .recipe-meta {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
          color: #636e72;
          font-size: 14px;
        }

        .recipe-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .recipe-ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .mini-tag {
          background: #f8f9fa;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          color: #636e72;
        }

        .recipe-card .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .recipe-card .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(255, 107, 107, 0.3);
        }

        /* Coaching Page */
        .coaching-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .coaching-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .btn-back {
          background: white;
          border: 2px solid #e9ecef;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          color: #636e72;
          transition: all 0.2s;
          font-family: inherit;
        }

        .btn-back:hover {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }

        .step-indicator {
          background: #fff5f5;
          color: #ff6b6b;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: 600;
        }

        .progress-bar {
          height: 8px;
          background: #f1f3f4;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 40px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b6b 0%, #ff8787 100%);
          transition: width 0.5s ease;
        }

        .step-content {
          background: white;
          padding: 48px;
          border-radius: 24px;
          text-align: center;
          margin-bottom: 32px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          animation: scaleIn 0.4s ease-out;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .step-number {
          color: #ff6b6b;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }

        .step-instruction {
          font-size: 24px;
          font-weight: 600;
          color: #2d3436;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .step-emoji {
          font-size: 120px;
        }

        .step-navigation {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .step-navigation .btn-secondary {
          padding: 16px 32px;
        }

        .step-navigation .btn-primary {
          padding: 16px 48px;
        }

        .btn-success {
          background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
          color: white;
          border: none;
          padding: 16px 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 184, 148, 0.3);
        }

        /* Health Page */
        .health-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* Health Setup Page */
        .health-setup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }

        .setup-container {
          background: white;
          border-radius: 24px;
          padding: 48px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(252, 182, 159, 0.3);
        }

        .setup-description {
          text-align: center;
          color: #636e72;
          font-size: 15px;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .setup-buttons {
          display: flex;
          gap: 16px;
          margin-top: 32px;
          align-items: center;
        }

        .btn-skip-subtle {
          flex: 0.6;
          background: transparent;
          color: #95a5a6;
          border: 2px solid #e1e8ed;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn-skip-subtle:hover {
          color: #636e72;
          border-color: #bdc3c7;
          background: #f8f9fa;
        }

        .btn-confirm {
          flex: 1;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          color: white;
          border: none;
          padding: 18px 32px;
          border-radius: 12px;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }

        .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .profile-notice {
          text-align: center;
          color: #95a5a6;
          font-size: 13px;
          margin-top: 16px;
          font-weight: 500;
        }

        .health-form {
          background: white;
          padding: 40px;
          border-radius: 24px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 8px;
        }

        .form-group .input-field,
        .form-group select {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #f1f3f4;
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-group .input-field:focus,
        .form-group select:focus {
          outline: none;
          border-color: #ff6b6b;
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
        }

        .allergy-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 12px;
          border: 2px solid #f1f3f4;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          border-color: #ff6b6b;
          background: #fff5f5;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .health-tips {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .tip-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .tip-card svg {
          color: #00b894;
          margin-bottom: 12px;
        }

        .tip-card h4 {
          font-size: 18px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 8px;
        }

        .tip-card p {
          font-size: 14px;
          color: #636e72;
          line-height: 1.6;
        }

        /* 카메라 버튼 */
        .btn-camera {
          background: #6c5ce7;
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-camera:hover {
          background: #5f3dc4;
        }

        /* 모달 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #636e72;
          padding: 4px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f1f3f4;
          color: #2d3436;
        }

        .upload-area {
          border: 2px dashed #dfe6e9;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          color: #636e72;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-area:hover {
          border-color: #6c5ce7;
          background: #f8f7ff;
        }

        .upload-area.dragging {
          border-color: #6c5ce7;
          background: #f0edff;
          transform: scale(1.02);
        }

        .upload-area svg {
          color: #b2bec3;
          margin-bottom: 16px;
          transition: color 0.3s ease;
        }

        .upload-area.dragging svg {
          color: #6c5ce7;
        }

        .upload-area p {
          margin-bottom: 8px;
        }

        /* 인식된 재료 */
        .recognized-section {
          margin-top: 20px;
          padding: 20px;
          background: #fff9e6;
          border-radius: 12px;
          border: 2px solid #ffd93d;
        }

        .recognized-section h4 {
          font-size: 15px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 12px;
        }

        .recognized-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .recognized-tag {
          background: white;
          border: 2px solid #ffd93d;
          padding: 10px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: bounceIn 0.4s ease-out;
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .tag-actions {
          display: flex;
          gap: 4px;
        }

        .tag-confirm, .tag-reject {
          background: none;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tag-confirm {
          color: #00b894;
        }

        .tag-confirm:hover {
          background: #00b89420;
        }

        .tag-reject {
          color: #d63031;
        }

        .tag-reject:hover {
          background: #d6303120;
        }

        /* 필터 섹션 */
        .filter-section {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .filter-btn {
          flex: 1;
          padding: 12px 20px;
          border: 2px solid #e9ecef;
          background: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .filter-btn:hover {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }

        .filter-btn.active {
          background: #ff6b6b;
          border-color: #ff6b6b;
          color: white;
        }

        /* 완벽 매칭 배지 */
        .perfect-match-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #ffd93d 0%, #ffbe0b 100%);
          color: #2d3436;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 217, 61, 0.4);
        }

        /* 재료 상태 표시 */
        .matched-ingredients {
          margin-bottom: 16px;
        }

        .ingredient-status {
          margin-bottom: 8px;
        }

        .status-label {
          font-size: 12px;
          font-weight: 600;
          color: #636e72;
          display: block;
          margin-bottom: 6px;
        }

        .status-label.missing {
          color: #ff6b6b;
        }

        .mini-tag.matched {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .missing-section {
          padding-top: 8px;
          border-top: 1px solid #f1f3f4;
        }

        .mini-tag.missing-tag {
          background: #ffebee;
          color: #c62828;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .purchase-link {
          color: #1e88e5;
          display: inline-flex;
          margin-left: 4px;
        }

        .purchase-link:hover {
          color: #1565c0;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #636e72;
        }

        .empty-state p {
          margin: 8px 0;
        }

        /* 완료 섹션 */
        .finish-section {
          width: 100%;
          text-align: center;
        }

        .finish-label {
          font-size: 18px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 20px;
        }

        .rating-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-rating {
          padding: 14px 24px;
          border: 2px solid #e9ecef;
          background: white;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-rating.like {
          color: #00b894;
          border-color: #00b894;
        }

        .btn-rating.like:hover {
          background: #00b894;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 184, 148, 0.3);
        }

        .btn-rating.neutral {
          color: #636e72;
        }

        .btn-rating.neutral:hover {
          background: #636e72;
          color: white;
          transform: translateY(-2px);
        }

        .btn-rating.dislike {
          color: #d63031;
          border-color: #d63031;
        }

        .btn-rating.dislike:hover {
          background: #d63031;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(214, 48, 49, 0.3);
        }

        /* 건강 페이지 추가 스타일 */
        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .nutrition-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 24px 0;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 20px;
          border-radius: 12px;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .summary-card h4 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .summary-value {
          font-size: 32px;
          font-weight: 700;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .summary-value span {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.8;
        }

        /* 식사 기록 페이지 */
        .history-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card svg {
          color: #ff6b6b;
        }

        .stat-label {
          font-size: 13px;
          color: #636e72;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #2d3436;
        }

        .personalized-section {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 40px;
        }

        .section-description {
          color: #636e72;
          margin-bottom: 20px;
        }

        .recipe-grid-small {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .recipe-card-small {
          background: white;
          padding: 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .recipe-card-small:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .recipe-emoji-small {
          font-size: 48px;
        }

        .recipe-card-small h4 {
          font-size: 16px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 4px;
        }

        .recipe-card-small p {
          font-size: 13px;
          color: #636e72;
        }

        .meal-list {
          background: white;
          padding: 32px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .meal-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meal-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 2px solid #f1f3f4;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .meal-item:hover {
          border-color: #ff6b6b;
          background: #fff5f5;
        }

        .meal-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .meal-date {
          font-size: 13px;
          color: #636e72;
          min-width: 100px;
        }

        .meal-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          min-width: 120px;
        }

        .meal-calories {
          font-size: 14px;
          color: #636e72;
        }

        .meal-actions {
          display: flex;
          gap: 8px;
        }

        .rating-icon, .delete-icon {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          color: #b2bec3;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rating-icon:hover {
          background: #f1f3f4;
          color: #636e72;
        }

        .rating-icon.active {
          color: #ff6b6b;
          background: #fff5f5;
        }

        .delete-icon:hover {
          background: #ffebee;
          color: #d63031;
        }

        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            text-align: center;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-emoji {
            font-size: 120px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .health-tips {
            grid-template-columns: 1fr;
          }

          .allergy-options {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .meal-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .meal-date {
            min-width: auto;
          }

          .meal-name {
            min-width: auto;
          }

          .rating-buttons {
            flex-direction: column;
          }

          .btn-rating {
            width: 100%;
            justify-content: center;
          }

          .input-group {
            flex-direction: column;
          }

          .filter-section {
            flex-direction: column;
          }
        }
      `}</style>

      {!isLoggedIn ? (
        <LoginPage />
      ) : (
        <>
          <Navigation />
          
          <div style={{ display: currentPage === 'healthSetup' ? 'block' : 'none' }}>
            <HealthSetupPage />
          </div>
          <div style={{ display: currentPage === 'home' ? 'block' : 'none' }}>
            <HomePage />
          </div>
          <div style={{ display: currentPage === 'fridge' ? 'block' : 'none' }}>
            <FridgePage />
          </div>
          <div style={{ display: currentPage === 'recommend' ? 'block' : 'none' }}>
            <RecommendPage />
          </div>
          <div style={{ display: currentPage === 'coaching' ? 'block' : 'none' }}>
            <CoachingPage />
          </div>
          <div style={{ display: currentPage === 'health' ? 'block' : 'none' }}>
            <HealthPage />
          </div>
          <div style={{ display: currentPage === 'history' ? 'block' : 'none' }}>
            <HistoryPage />
          </div>
        </>
      )}
    </>
  );
}
