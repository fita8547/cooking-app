import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChefHat, Refrigerator, Heart, Clock, User, Sparkles, Flame, Leaf, AlertCircle, Camera, Plus, Minus, ThumbsUp, ThumbsDown, Calendar, TrendingUp, X, Loader2 } from 'lucide-react';
import { generateRecipes, recognizeIngredients, isApiKeyConfigured } from './services/openai';

// 재료 입력 컴포넌트 (완전히 독립적인 uncontrolled input)
const IngredientInput = React.memo(React.forwardRef(({ onAdd }, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = ref.current?.value.trim();
      if (value) {
        onAdd(value);
        ref.current.value = '';
      }
    }
  };

  return (
    <input
      ref={ref}
      type="text"
      onKeyDown={handleKeyDown}
      placeholder="재료를 입력하세요 (예: 김치, 돼지고기)"
      className="input-field"
      autoComplete="off"
      defaultValue=""
      style={{
        flex: 1,
        padding: '12px 16px',
        fontSize: '16px',
        border: '2px solid #FFB8B8',
        borderRadius: '12px',
        outline: 'none'
      }}
    />
  );
}));

export default function AdCookingClass() {
  const [currentPage, setCurrentPage] = useState('main'); // 'login' → 'main'으로 변경
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 공통 사용자는 로그인 없이 사용
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authMode, setAuthMode] = useState('guest');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    confirmPassword: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isPremiumUser, setIsPremiumUser] = useState(false); // 유료 사용자 여부
  
  // 결제 관련 상태
  const [paymentForm, setPaymentForm] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    country: 'KR'
  });
  const [ingredients, setIngredients] = useState([]);
  const [inputIngredient, setInputIngredient] = useState('');
  const isComposingRef = useRef(false); // 한글 입력 조합 중 여부 (ref로 변경)
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
    diseases: []
  });
  const [mealHistory, setMealHistory] = useState([
    { id: 1, date: '2026-02-10', meal: '김치찌개', rating: 'like', calories: 450 },
    { id: 2, date: '2026-02-09', meal: '샐러드 볼', rating: 'like', calories: 320 },
    { id: 3, date: '2026-02-08', meal: '된장찌개', rating: 'neutral', calories: 280 },
  ]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState([]);
  const [isFetchingMeals, setIsFetchingMeals] = useState(false);
  const [mealActionLoading, setMealActionLoading] = useState(null); // 특정 식사 기록의 로딩 상태
  
  // AI 관련 상태
  const [aiRecipes, setAiRecipes] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isRecognizingImage, setIsRecognizingImage] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const API_BASE_URL = '/api';

  // 사용자 정보 가져오기
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsLoggedIn(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('프로필 가져오기 실패:', error);
      return false;
    }
  };

  // 로그인 후 식사 기록 불러오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchMealHistory();
    }
  }, [isLoggedIn]);

  // URL 파라미터로 결제 성공 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setCurrentPage('payment-success');
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 로그인
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    setAuthMode('login');

    try {
      // 관리자 계정 확인
      if (authForm.username === 'admin' && authForm.password === 'admin1234') {
        const adminUser = {
          name: '관리자',
          username: 'admin',
          email: 'admin@adcookingclass.com',
          isPremium: true,
          isAdmin: true
        };
        setUser(adminUser);
        setIsLoggedIn(true);
        setIsPremiumUser(true);
        setCurrentPage('home');
        setAuthLoading(false);
        return;
      }

      // 게스트 계정 확인
      const guestUser = localStorage.getItem('guestUser');
      const guestPassword = localStorage.getItem('guestPassword');
      
      if (guestUser && guestPassword) {
        const guest = JSON.parse(guestUser);
        // 아이디와 비밀번호가 모두 일치하는지 확인
        if (guest.username === authForm.username && guestPassword === authForm.password) {
          // 게스트 계정으로 로그인 (저장된 프로필 정보 포함)
          setUser(guest);
          setIsLoggedIn(true);
          setIsPremiumUser(false); // 게스트는 무료 사용자
          setCurrentPage('home');
          setAuthLoading(false);
          return;
        }
      }

      // 서버 로그인 시도
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        localStorage.setItem('authToken', data.token);
        
        // 전체 프로필 정보 가져오기
        await fetchUserProfile(data.token);
        
        // 서버 사용자는 유료 사용자로 간주
        setIsPremiumUser(true);
        setCurrentPage('home');
      } else {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setPendingEmail(data.email);
          setShowVerificationCode(true);
          setAuthError('');
        } else {
          setAuthError(data.error || '아이디 또는 비밀번호가 올바르지 않습니다');
        }
      }
    } catch (error) {
      setAuthError('아이디 또는 비밀번호가 올바르지 않습니다');
    } finally {
      setAuthLoading(false);
    }
  };

  // 회원가입
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (authForm.password.length < 6) {
      setAuthError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
          name: authForm.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPendingEmail(authForm.email);
        setShowVerificationCode(true);
        setAuthError('');
      } else {
        console.error('회원가입 에러:', data);
        setAuthError(data.error || '회원가입에 실패했습니다');
      }
    } catch (error) {
      console.error('회원가입 예외:', error);
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
    setIsPremiumUser(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('guestUser');
    localStorage.removeItem('guestPassword');
    setCurrentPage('login');
    setAuthMode('login');
    setAuthForm({
      email: '',
      password: '',
      name: '',
      username: '',
      confirmPassword: ''
    });
  };

  // 게스트로 시작
  const handleGuestStart = (e) => {
    if (e) e.preventDefault();
    setAuthMode('guest');
    
    if (!authForm.username || !authForm.password) {
      setAuthError('아이디와 비밀번호를 입력해주세요');
      return;
    }

    // 관리자 아이디 사용 불가
    if (authForm.username === 'admin') {
      setAuthError('이 아이디는 사용할 수 없습니다');
      return;
    }

    // 기존 게스트 계정 중복 체크
    const existingGuestUser = localStorage.getItem('guestUser');
    if (existingGuestUser) {
      const existingGuest = JSON.parse(existingGuestUser);
      if (existingGuest.username === authForm.username) {
        setAuthError('이미 사용 중인 아이디입니다. 로그인하기를 눌러주세요.');
        return;
      }
    }

    setAuthLoading(true);

    // 게스트 모드로 시작 (로컬에만 저장)
    const guestUser = {
      name: authForm.username,
      username: authForm.username,
      email: `${authForm.username}@guest.local`,
      isGuest: true,
      isPremium: false
    };
    
    setUser(guestUser);
    setIsLoggedIn(true);
    setIsPremiumUser(false); // 게스트는 무료 사용자
    setCurrentPage('home');
    
    // 현재 게스트 정보와 비밀번호 저장
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    localStorage.setItem('guestPassword', authForm.password);
    setAuthLoading(false);
  };

  // 비밀번호 찾기
  const handleForgotPassword = () => {
    alert('비밀번호 찾기 기능은 추후 제공될 예정입니다');
  };

  // 인증 코드 확인
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAuthToken(data.token);
        localStorage.setItem('authToken', data.token);
        
        // 전체 프로필 정보 가져오기
        await fetchUserProfile(data.token);
        
        setShowVerificationCode(false);
        setVerificationCode('');
        setCurrentPage('home');
      } else {
        setAuthError(data.error || '인증에 실패했습니다');
      }
    } catch (error) {
      setAuthError('서버 연결에 실패했습니다');
    } finally {
      setAuthLoading(false);
    }
  };

  // 인증 코드 재발송
  const handleResendCode = async () => {
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('인증 코드가 재발송되었습니다');
      } else {
        setAuthError(data.error || '재발송에 실패했습니다');
      }
    } catch (error) {
      setAuthError('서버 연결에 실패했습니다');
    } finally {
      setAuthLoading(false);
    }
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
      steps: [
        '계란을 풀어주세요',
        '파를 잘게 썰어 계란에 넣어주세요',
        '소금으로 간을 해주세요',
        '팬에 기름을 두르고 계란을 부어주세요',
        '돌돌 말아가며 익혀주세요'
      ]
    }
  ];

  const addIngredient = useCallback((value) => {
    const ingredient = value || inputIngredient;
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()]);
      setInputIngredient('');
    }
  }, [inputIngredient, ingredients]);

  const removeIngredient = (ing) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  // 이미지 업로드 후 재료 인식 (OpenAI Vision API 사용)
  // 이미지 압축 함수
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // API 키 확인
    if (!isApiKeyConfigured()) {
      alert('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
      return;
    }

    setIsRecognizingImage(true);
    setError(null);

    try {
      // 이미지 압축
      const compressedFile = await compressImage(file);
      console.log('원본 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('압축 후 크기:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

      const detected = await recognizeIngredients(compressedFile);
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
          // nutrition 객체에서 칼로리 추출
          calories: recipe.nutrition?.calories || recipe.calories || 0,
          protein: recipe.nutrition?.protein || recipe.protein || 0,
          carbs: recipe.nutrition?.carbs || recipe.carbs || 0,
          fat: recipe.nutrition?.fat || recipe.fat || 0,
          matchedIngredients: recipeIngredients
            .filter(ing => ing.isAvailable)
            .map(ing => ing.name),
          missingIngredients: recipeIngredients
            .filter(ing => !ing.isAvailable)
            .map(ing => ing.name),
          canMakeWithOwned: recipeIngredients.length > 0 && recipeIngredients.every(ing => ing.isAvailable)
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

  const addMealToHistory = async (recipe, rating) => {
    // 유료 사용자만 식사 기록 저장 가능
    if (!isPremiumUser) {
      alert('식사 기록 저장은 유료 기능입니다. 관리자 계정으로 로그인하거나 유료 플랜을 구매해주세요.');
      return;
    }

    const newMeal = {
      recipeName: recipe.name,
      date: new Date(),
      mealType: '저녁', // 기본값, 나중에 선택 가능하도록 수정 가능
      rating: rating === 'like' ? 5 : rating === 'dislike' ? 1 : 3,
      nutrition: {
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat
      }
    };

    // 로그인한 사용자는 서버에 저장
    if (authToken) {
      // 낙관적 업데이트: 먼저 UI에 추가
      const optimisticMeal = {
        id: 'temp-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        meal: recipe.name,
        rating: rating,
        calories: recipe.calories,
        isOptimistic: true
      };
      setMealHistory([optimisticMeal, ...mealHistory]);

      try {
        const response = await fetch(`${API_BASE_URL}/meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(newMeal)
        });

        if (response.ok) {
          // 서버에서 받은 실제 데이터로 교체
          await fetchMealHistory();
        } else {
          // 실패 시 낙관적 업데이트 롤백
          setMealHistory(mealHistory.filter(m => m.id !== optimisticMeal.id));
          console.error('식사 기록 저장 실패');
          alert('식사 기록 저장에 실패했습니다.');
        }
      } catch (error) {
        // 에러 시 낙관적 업데이트 롤백
        setMealHistory(mealHistory.filter(m => m.id !== optimisticMeal.id));
        console.error('식사 기록 저장 오류:', error);
        alert('서버 연결에 실패했습니다.');
      }
    } else {
      // 게스트 사용자는 로컬에만 저장 (하지만 유료 기능이므로 여기 도달하지 않음)
      const localMeal = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        meal: recipe.name,
        rating: rating,
        calories: recipe.calories
      };
      setMealHistory([localMeal, ...mealHistory]);
      
      // 게스트 사용자의 식사 기록도 localStorage에 저장
      const guestMeals = JSON.parse(localStorage.getItem('guestMeals') || '[]');
      localStorage.setItem('guestMeals', JSON.stringify([localMeal, ...guestMeals]));
    }
  };

  // 식사 기록 조회
  const fetchMealHistory = async () => {
    if (!authToken) {
      // 게스트 사용자는 localStorage에서 불러오기
      const guestMeals = JSON.parse(localStorage.getItem('guestMeals') || '[]');
      setMealHistory(guestMeals);
      return;
    }

    setIsFetchingMeals(true);
    try {
      const response = await fetch(`${API_BASE_URL}/meals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 서버 데이터를 로컬 형식으로 변환
        const formattedMeals = data.meals.map(meal => ({
          id: meal._id,
          date: new Date(meal.date).toISOString().split('T')[0],
          meal: meal.recipeName,
          rating: meal.rating >= 4 ? 'like' : meal.rating <= 2 ? 'dislike' : 'neutral',
          calories: meal.nutrition?.calories || 0
        }));
        setMealHistory(formattedMeals);
      }
    } catch (error) {
      console.error('식사 기록 조회 오류:', error);
    } finally {
      setIsFetchingMeals(false);
    }
  };

  const updateMealRating = async (mealId, newRating) => {
    if (authToken) {
      // 낙관적 업데이트: 먼저 UI 업데이트
      const previousMeals = [...mealHistory];
      setMealHistory(mealHistory.map(meal => 
        meal.id === mealId ? { ...meal, rating: newRating } : meal
      ));
      setMealActionLoading(mealId);

      try {
        const ratingValue = newRating === 'like' ? 5 : newRating === 'dislike' ? 1 : 3;
        const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ rating: ratingValue })
        });

        if (!response.ok) {
          // 실패 시 롤백
          setMealHistory(previousMeals);
          alert('평가 업데이트에 실패했습니다.');
        }
      } catch (error) {
        // 에러 시 롤백
        setMealHistory(previousMeals);
        console.error('평가 업데이트 오류:', error);
        alert('서버 연결에 실패했습니다.');
      } finally {
        setMealActionLoading(null);
      }
    } else {
      // 게스트 사용자는 로컬만 업데이트
      const updatedMeals = mealHistory.map(meal => 
        meal.id === mealId ? { ...meal, rating: newRating } : meal
      );
      setMealHistory(updatedMeals);
      localStorage.setItem('guestMeals', JSON.stringify(updatedMeals));
    }
  };

  const deleteMeal = async (mealId) => {
    if (authToken) {
      // 낙관적 업데이트: 먼저 UI에서 제거
      const previousMeals = [...mealHistory];
      setMealHistory(mealHistory.filter(meal => meal.id !== mealId));
      setMealActionLoading(mealId);

      try {
        const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response.ok) {
          // 실패 시 롤백
          setMealHistory(previousMeals);
          alert('식사 기록 삭제에 실패했습니다.');
        }
      } catch (error) {
        // 에러 시 롤백
        setMealHistory(previousMeals);
        console.error('식사 기록 삭제 오류:', error);
        alert('서버 연결에 실패했습니다.');
      } finally {
        setMealActionLoading(null);
      }
    } else {
      // 게스트 사용자는 로컬만 삭제
      const updatedMeals = mealHistory.filter(meal => meal.id !== mealId);
      setMealHistory(updatedMeals);
      localStorage.setItem('guestMeals', JSON.stringify(updatedMeals));
    }
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
      if (isPremiumUser) {
        addMealToHistory(selectedRecipe, rating);
        alert(`요리 완성! ${rating === 'like' ? '맛있게 드세요 😊' : rating === 'dislike' ? '다음엔 더 좋은 레시피를 추천해드릴게요!' : '기록되었습니다!'}`);
      } else {
        alert(`요리 완성! ${rating === 'like' ? '맛있게 드세요 😊' : rating === 'dislike' ? '다음엔 더 좋은 레시피를 추천해드릴게요!' : ''}\n\n※ 식사 기록 저장은 유료 기능입니다.`);
      }
      setCurrentPage('home');
    }
  };

  // 메인 페이지 (비로그인 사용자용)
  const MainPage = () => (
    <div className="main-landing-page">
      <div className="landing-hero">
        <div className="landing-content">
          <h1 className="landing-title">
            <span className="title-desktop">냉장고 재료로<br /><span className="gradient-text">맛있는 요리</span>를<br />만들어보세요</span>
            <span className="title-mobile">냉장고 재료로<br /><span className="gradient-text">맛있는 요리</span></span>
          </h1>
          <p className="landing-subtitle">
            <span className="subtitle-desktop">AI가 당신의 재료를 분석하고 최적의 레시피를 추천합니다</span>
            <span className="subtitle-mobile">AI 레시피 추천</span>
          </p>
          
          <div className="landing-buttons">
            <button 
              className="btn-primary btn-large"
              onClick={() => setCurrentPage('health')}
            >
              <span className="btn-text-desktop">건강식단 입력하기</span>
              <span className="btn-text-mobile">시작하기</span>
            </button>
            
            <button 
              className="btn-pro-subscribe"
              onClick={() => setCurrentPage('checkout')}
            >
              <span className="pro-badge-icon">⭐</span>
              <span className="btn-text-desktop">Pro 구독하기 - $3/월</span>
              <span className="btn-text-mobile">Pro 구독</span>
            </button>
          </div>

          <div className="landing-features-preview">
            <div className="feature-preview-item">
              <span>AI 레시피 추천</span>
            </div>
            <div className="feature-preview-item">
              <span>재료 자동 인식</span>
            </div>
            <div className="feature-preview-item">
              <span>맞춤 건강 식단</span>
            </div>
          </div>
        </div>
        
        <div className="landing-image">
          <div className="hero-emoji-large">🍳</div>
        </div>
      </div>

      <div className="landing-pro-features">
        <h2>Pro 구독 혜택</h2>
        <div className="pro-features-grid">
          <div className="pro-feature-card">
            <h3>식사 기록 저장</h3>
            <p>모든 식사 기록을 안전하게 저장하고 분석하세요</p>
          </div>
          <div className="pro-feature-card">
            <h3>AI 맞춤 레시피</h3>
            <p>건강 프로필 기반 개인화된 레시피 추천</p>
          </div>
          <div className="pro-feature-card">
            <h3>영양 분석</h3>
            <p>상세한 영양소 분석과 목표 달성 추적</p>
          </div>
          <div className="pro-feature-card">
            <h3>클라우드 동기화</h3>
            <p>모든 기기에서 데이터 동기화</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 로그인/회원가입 페이지
  const LoginPage = () => {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <ChefHat size={48} />
            <h1>애드쿠킹클래스</h1>
            <p>AI가 당신의 요리를 돕습니다</p>
          </div>

          {authError && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {authError}
            </div>
          )}
          
          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text"
              placeholder="아이디"
              className="input-field"
              value={authForm.username}
              onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              required
            />
            
            <input 
              type="password" 
              placeholder="비밀번호" 
              className="input-field"
              value={authForm.password}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              required
            />

            <button 
              type="button"
              className="btn-primary"
              disabled={authLoading}
              onClick={handleLogin}
            >
              {authLoading && authMode === 'login' ? '처리 중...' : '로그인하기'}
            </button>
          </form>
        </div>

        {/* 이메일 인증 모달 */}
        {showVerificationCode && (
          <div className="modal-overlay" onClick={() => setShowVerificationCode(false)}>
            <div className="modal-content verification-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>이메일 인증</h3>
                <button onClick={() => setShowVerificationCode(false)} className="modal-close">
                  <X size={24} />
                </button>
              </div>
              
              <p className="verification-description">
                {pendingEmail}로 발송된 6자리 인증 코드를 입력해주세요.
              </p>

              {authError && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  {authError}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="verification-form">
                <input
                  type="text"
                  placeholder="인증 코드 (6자리)"
                  className="input-field verification-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus
                />

                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={authLoading || verificationCode.length !== 6}
                >
                  {authLoading ? '확인 중...' : '인증하기'}
                </button>

                <button 
                  type="button"
                  className="btn-text"
                  onClick={handleResendCode}
                  disabled={authLoading}
                >
                  인증 코드 재전송
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 결제 페이지
  const CheckoutPage = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubscribe = async () => {
      if (!email || !email.includes('@')) {
        alert('올바른 이메일 주소를 입력해주세요.');
        return;
      }

      setIsProcessing(true);

      try {
        console.log('🔄 Stripe Checkout 생성 요청...');
        const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email
          })
        });

        console.log('📡 응답 상태:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ 서버 오류:', errorData);
          throw new Error(errorData.error || '결제 세션 생성에 실패했습니다');
        }

        const data = await response.json();
        console.log('✅ Checkout 데이터:', data);
        
        if (data.url) {
          console.log('🔗 리다이렉트 URL:', data.url);
          // Stripe 결제 페이지로 리다이렉트
          window.location.href = data.url;
        } else if (data.demo) {
          // 데모 모드
          console.log('⚠️  데모 모드');
          window.location.href = data.url;
        } else {
          throw new Error('결제 URL을 받지 못했습니다');
        }
      } catch (error) {
        console.error('💥 결제 오류:', error);
        alert(`결제 페이지로 이동하는 중 오류가 발생했습니다.\n\n오류: ${error.message}\n\n다시 시도해주세요.`);
        setIsProcessing(false);
      }
    };

    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-left">
            <button 
              onClick={() => setCurrentPage('main')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                marginBottom: '20px',
                color: '#fff'
              }}
            >
              ←
            </button>
            <h1>애드쿠킹클래스 Premium</h1>
            <p style={{color: '#888', marginTop: '8px'}}>스마트 요리 보조 서비스입니다.</p>
            
            <div style={{marginTop: '40px', padding: '20px', background: '#1a1a1a', borderRadius: '12px'}}>
              <div style={{fontSize: '32px', fontWeight: 'bold'}}>
                $3<span style={{fontSize: '16px', fontWeight: 'normal'}}>/mo</span>
              </div>
              <p style={{color: '#aaa', marginTop: '12px', fontSize: '14px'}}>
                매월 자동 결제 • 언제든지 취소 가능
              </p>
            </div>

            <div style={{marginTop: '32px'}}>
              <h3 style={{marginBottom: '16px'}}>Pro 혜택</h3>
              <ul style={{color: '#aaa', lineHeight: '2'}}>
                <li>✅ AI 맞춤 레시피 무제한</li>
                <li>✅ 식단 기록 및 분석</li>
                <li>✅ 냉장고 재료 AI 인식</li>
                <li>✅ 건강 프로필 기반 추천</li>
              </ul>
            </div>
          </div>

          <div className="checkout-right">
            <div style={{padding: '20px 0'}}>
              <h2 style={{marginBottom: '24px', fontSize: '24px'}}>Pro 구독 시작하기</h2>
              
              <div className="form-group" style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: '#aaa'}}>
                  이메일 주소
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1a1a1a',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
                <p style={{color: '#666', fontSize: '12px', marginTop: '8px'}}>
                  결제 확인 및 영수증을 받을 이메일 주소입니다.
                </p>
              </div>

              <p style={{color: '#aaa', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px'}}>
                안전한 결제를 위해 Stripe 결제 페이지로 이동합니다.<br/>
                카드 정보는 안전하게 암호화되어 처리됩니다.
              </p>

              <button
                onClick={handleSubscribe}
                disabled={isProcessing || !email}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isProcessing || !email ? '#666' : '#0066FF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isProcessing || !email ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="spinning" />
                    처리 중...
                  </>
                ) : (
                  '구독하기 ($3/월)'
                )}
              </button>

              <p style={{color: '#666', fontSize: '12px', marginTop: '16px', textAlign: 'center'}}>
                언제든지 구독을 취소할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 결제 성공 페이지
  const PaymentSuccessPage = () => {
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>결제가 완료되었습니다!</h1>
          <p>애드쿠킹클래스 Pro 구독을 시작합니다.</p>
          
          <div className="success-details">
            <div className="detail-row">
              <span>구독 플랜</span>
              <strong>Pro - $3/월</strong>
            </div>
            <div className="detail-row">
              <span>다음 결제일</span>
              <strong>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}</strong>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPremiumUser(true);
              setCurrentPage('home');
            }}
            style={{
              marginTop: '32px',
              padding: '16px 48px',
              background: '#FFB8B8',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            시작하기
          </button>
        </div>
      </div>
    );
  };

  // 홈 페이지 (식단관리)
  const HomePage = () => {
    const ingredientInputRef = useRef(null);
    const recommendedRecipes = useMemo(() => getRecommendedRecipes(), [ingredients, healthProfile]);
    const targetCalories = useMemo(() => calculateTargetCalories(), [healthProfile]);
    const hasHealthProfile = healthProfile.age && healthProfile.gender && healthProfile.height && healthProfile.weight;
    
    const handleAddClick = () => {
      const value = ingredientInputRef.current?.value.trim();
      if (value) {
        addIngredient(value);
        ingredientInputRef.current.value = '';
      }
    };
    
    return (
      <div className="home-page">
        <div className="hero-section">
          <div className="hero-text">
            <h1 className="hero-title">
              냉장고 재료로<br />
              <span className="gradient-text">맛있는 요리</span>를<br />
              만들어보세요
            </h1>
            <p className="hero-subtitle">
              {hasHealthProfile 
                ? `목표 칼로리: ${targetCalories}kcal | ${healthProfile.allergies.length > 0 ? `알레르기: ${healthProfile.allergies.join(', ')}` : '알레르기 없음'}`
                : 'AI가 당신의 재료를 분석하고 최적의 레시피를 추천합니다'
              }
            </p>
            {!hasHealthProfile && (
              <button 
                className="btn-secondary"
                onClick={() => setCurrentPage('health')}
                style={{
                  marginTop: '16px',
                  background: '#FFE5E5',
                  border: '2px solid #FFB8B8',
                  color: '#333',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                건강 프로필 입력하기
              </button>
            )}
          </div>
          <div className="hero-emoji">🍳</div>
        </div>

        {/* 재료 입력 섹션 */}
        <div className="ingredient-input-section">
          <h2 className="section-title">냉장고 재료 입력</h2>
          <div className="input-group">
            <IngredientInput ref={ingredientInputRef} onAdd={addIngredient} />
            <button onClick={handleAddClick} className="btn-add">추가</button>
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
                <div className="upload-area">
                  {isRecognizingImage ? (
                    <>
                      <Loader2 size={64} className="spinning" style={{ color: '#6c5ce7' }} />
                      <p style={{ marginTop: '16px', fontWeight: '600' }}>AI가 재료를 인식하는 중...</p>
                      <p style={{ fontSize: '14px', color: '#636e72' }}>잠시만 기다려주세요</p>
                    </>
                  ) : (
                    <>
                      <Camera size={64} />
                      <p>냉장고 사진을 업로드하세요</p>
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

              <button 
                className="btn-generate-ai"
                onClick={generateAIRecipes}
                disabled={isLoadingRecipes}
                style={{
                  marginTop: '24px',
                  background: '#FFE5E5',
                  border: '2px solid #FFB8B8',
                  color: '#333',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  transition: 'all 0.2s'
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
            </>
          )}
        </div>

        {/* AI 생성 레시피 */}
        {aiRecipes.length > 0 && (
          <div className="recipes-section">
            <h2 className="section-title">AI 추천 레시피</h2>
            <div className="recipe-grid">
              {aiRecipes.map((recipe, idx) => (
                <div key={idx} className="recipe-card" onClick={() => startCooking(recipe)}>
                  <div className="recipe-header">
                    <h3>{recipe.name}</h3>
                    <div className="recipe-badges">
                      <span className="badge badge-time">
                        <Clock size={14} />
                        {recipe.time}
                      </span>
                      <span className="badge badge-difficulty">{recipe.difficulty}</span>
                    </div>
                  </div>
                  <p className="recipe-description">{recipe.description}</p>
                  <div className="recipe-footer">
                    <span className="recipe-calories">
                      <Flame size={16} />
                      {recipe.calories}kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기존 추천 레시피 */}
        {aiRecipes.length === 0 && recommendedRecipes.length > 0 && (
          <div className="recipes-section">
            <h2 className="section-title">추천 레시피</h2>
            <div className="recipe-grid">
              {recommendedRecipes.map((recipe, idx) => (
                <div key={idx} className="recipe-card" onClick={() => startCooking(recipe)}>
                  <div className="recipe-header">
                    <h3>{recipe.name}</h3>
                    <div className="recipe-badges">
                      <span className="badge badge-time">
                        <Clock size={14} />
                        {recipe.time}
                      </span>
                      <span className="badge badge-difficulty">{recipe.difficulty}</span>
                    </div>
                  </div>
                  <p className="recipe-description">{recipe.description}</p>
                  <div className="recipe-footer">
                    <span className="recipe-calories">
                      <Flame size={16} />
                      {recipe.calories}kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 재료 추천 페이지
  const RecommendPage = () => {
    const recommendedRecipes = getRecommendedRecipes();
    
    return (
      <div className="recommend-page">
        <h2 className="page-title">냉장고 재료 입력</h2>
        
        <div className="ingredient-input-section">
          <div className="input-group">
            <input
              type="text"
              value={inputIngredient}
              onChange={(e) => setInputIngredient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  addIngredient();
                }
              }}
              placeholder="재료를 입력하세요 (예: 김치, 돼지고기)"
              className="input-field"
            />
            <button onClick={addIngredient} className="btn-add">추가</button>
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
                <div className="upload-area">
                  {isRecognizingImage ? (
                    <>
                      <Loader2 size={64} className="spinning" style={{ color: '#6c5ce7' }} />
                      <p style={{ marginTop: '16px', fontWeight: '600' }}>AI가 재료를 인식하는 중...</p>
                      <p style={{ fontSize: '14px', color: '#636e72' }}>잠시만 기다려주세요</p>
                    </>
                  ) : (
                    <>
                      <Camera size={64} />
                      <p>냉장고 사진을 업로드하세요</p>
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

  // 건강 식단 페이지
  const HealthPage = () => {
    const bmr = calculateBMR();
    const targetCalories = calculateTargetCalories();
    const [newAllergy, setNewAllergy] = useState('');
    const [newDisease, setNewDisease] = useState('');

    const addAllergy = () => {
      if (newAllergy.trim() && !healthProfile.allergies.includes(newAllergy.trim())) {
        setHealthProfile({
          ...healthProfile,
          allergies: [...healthProfile.allergies, newAllergy.trim()]
        });
        setNewAllergy('');
      }
    };

    const removeAllergy = (allergy) => {
      setHealthProfile({
        ...healthProfile,
        allergies: healthProfile.allergies.filter(a => a !== allergy)
      });
    };

    const addDisease = () => {
      if (newDisease.trim() && !healthProfile.diseases.includes(newDisease.trim())) {
        setHealthProfile({
          ...healthProfile,
          diseases: [...healthProfile.diseases, newDisease.trim()]
        });
        setNewDisease('');
      }
    };

    const removeDisease = (disease) => {
      setHealthProfile({
        ...healthProfile,
        diseases: healthProfile.diseases.filter(d => d !== disease)
      });
    };

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
            <div className="tag-input-group">
              <input
                type="text"
                value={newDisease}
                onChange={(e) => setNewDisease(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addDisease();
                  }
                }}
                placeholder="질환 입력 (예: 당뇨, 고혈압)"
                className="input-field"
              />
              <button onClick={addDisease} className="btn-add" type="button">
                <Plus size={18} />
              </button>
            </div>
            {healthProfile.diseases.length > 0 && (
              <div className="tag-list">
                {healthProfile.diseases.map((disease, index) => (
                  <div key={index} className="tag">
                    {disease}
                    <button onClick={() => removeDisease(disease)} type="button">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>알레르기</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
                placeholder="알레르기 항목 입력 (예: 땅콩, 우유)"
                className="input-field"
              />
              <button onClick={addAllergy} className="btn-add" type="button">
                <Plus size={18} />
              </button>
            </div>
            {healthProfile.allergies.length > 0 && (
              <div className="tag-list">
                {healthProfile.allergies.map((allergy, index) => (
                  <div key={index} className="tag">
                    {allergy}
                    <button onClick={() => removeAllergy(allergy)} type="button">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

          <button 
            className="btn-primary"
            onClick={() => {
              // 건강 프로필 저장 (localStorage 또는 서버)
              if (user) {
                localStorage.setItem('healthProfile', JSON.stringify(healthProfile));
              }
              // 식단관리 페이지로 이동
              setCurrentPage('home');
            }}
          >
            맞춤 식단 받기
          </button>
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
    // 유료 사용자만 접근 가능
    if (!isPremiumUser) {
      return (
        <div className="history-page">
          <h2 className="page-title">식사 기록</h2>
          <div className="premium-required">
            <div className="premium-icon">🔒</div>
            <h3>유료 기능입니다</h3>
            <p>식사 기록 저장 및 조회는 유료 기능입니다.</p>
            <p>유료 플랜을 구매해주세요.</p>
          </div>
        </div>
      );
    }

    const totalCalories = mealHistory.reduce((sum, meal) => sum + meal.calories, 0);
    const likedMeals = mealHistory.filter(m => m.rating === 'like').length;
    const personalizedRecipes = getPersonalizedRecommendations();

    // 스켈레톤 UI
    if (isFetchingMeals) {
      return (
        <div className="history-page">
          <h2 className="page-title">식사 기록</h2>
          
          {/* 통계 카드 스켈레톤 */}
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card skeleton">
                <div className="skeleton-icon"></div>
                <div style={{flex: 1}}>
                  <div className="skeleton-text" style={{width: '60%', height: '14px', marginBottom: '8px'}}></div>
                  <div className="skeleton-text" style={{width: '80%', height: '24px'}}></div>
                </div>
              </div>
            ))}
          </div>

          {/* 식사 기록 목록 스켈레톤 */}
          <div className="meal-list">
            <h3 className="section-title">기록 내역</h3>
            <div className="meal-items">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="meal-item skeleton">
                  <div className="meal-info" style={{flex: 1}}>
                    <div className="skeleton-text" style={{width: '100px', height: '14px', marginBottom: '8px'}}></div>
                    <div className="skeleton-text" style={{width: '150px', height: '18px', marginBottom: '4px'}}></div>
                    <div className="skeleton-text" style={{width: '80px', height: '14px'}}></div>
                  </div>
                  <div className="meal-actions">
                    <div className="skeleton-icon"></div>
                    <div className="skeleton-icon"></div>
                    <div className="skeleton-icon"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

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
                <div 
                  key={meal.id} 
                  className={`meal-item ${meal.isOptimistic ? 'optimistic' : ''} ${mealActionLoading === meal.id ? 'loading' : ''}`}
                >
                  <div className="meal-info">
                    <div className="meal-date">{meal.date}</div>
                    <div className="meal-name">{meal.meal}</div>
                    <div className="meal-calories">{meal.calories}kcal</div>
                  </div>
                  <div className="meal-actions">
                    <button 
                      className={`rating-icon rating-like ${meal.rating === 'like' ? 'active' : ''}`}
                      onClick={() => updateMealRating(meal.id, meal.rating === 'like' ? 'neutral' : 'like')}
                      disabled={mealActionLoading === meal.id}
                    >
                      {mealActionLoading === meal.id ? (
                        <Loader2 size={18} className="spinning" />
                      ) : (
                        <ThumbsUp size={18} />
                      )}
                    </button>
                    <button 
                      className={`rating-icon rating-dislike ${meal.rating === 'dislike' ? 'active' : ''}`}
                      onClick={() => updateMealRating(meal.id, meal.rating === 'dislike' ? 'neutral' : 'dislike')}
                      disabled={mealActionLoading === meal.id}
                    >
                      {mealActionLoading === meal.id ? (
                        <Loader2 size={18} className="spinning" />
                      ) : (
                        <ThumbsDown size={18} />
                      )}
                    </button>
                    <button 
                      className="delete-icon"
                      onClick={() => {
                        if (confirm('이 기록을 삭제하시겠습니까?')) {
                          deleteMeal(meal.id);
                        }
                      }}
                      disabled={mealActionLoading === meal.id}
                    >
                      {mealActionLoading === meal.id ? (
                        <Loader2 size={18} className="spinning" />
                      ) : (
                        <X size={18} />
                      )}
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

  // 프로필 페이지
  const ProfilePage = () => {
    const [profileForm, setProfileForm] = useState({
      name: user?.name || '',
      age: user?.healthProfile?.age || '',
      gender: user?.healthProfile?.gender || '',
      height: user?.healthProfile?.height || '',
      weight: user?.healthProfile?.weight || '',
      allergies: user?.healthProfile?.allergies || [],
      diseases: user?.healthProfile?.diseases || [],
      goal: user?.healthProfile?.goal || ''
    });
    const [newAllergy, setNewAllergy] = useState('');
    const [newDisease, setNewDisease] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSaveProfile = async () => {
      setIsSaving(true);
      setSaveMessage('');

      try {
        // 게스트 사용자는 로컬에만 저장
        if (user?.isGuest || !authToken) {
          const updatedUser = {
            ...user,
            name: profileForm.name,
            healthProfile: {
              age: profileForm.age ? parseInt(profileForm.age) : undefined,
              gender: profileForm.gender || undefined,
              height: profileForm.height ? parseFloat(profileForm.height) : undefined,
              weight: profileForm.weight ? parseFloat(profileForm.weight) : undefined,
              allergies: profileForm.allergies,
              diseases: profileForm.diseases,
              goal: profileForm.goal || undefined
            }
          };
          
          setUser(updatedUser);
          localStorage.setItem('guestUser', JSON.stringify(updatedUser));
          setSaveMessage('프로필이 저장되었습니다!');
          setTimeout(() => setSaveMessage(''), 3000);
          setIsSaving(false);
          return;
        }

        // 로그인 사용자는 서버에 저장
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: profileForm.name,
            healthProfile: {
              age: profileForm.age ? parseInt(profileForm.age) : undefined,
              gender: profileForm.gender || undefined,
              height: profileForm.height ? parseFloat(profileForm.height) : undefined,
              weight: profileForm.weight ? parseFloat(profileForm.weight) : undefined,
              allergies: profileForm.allergies,
              diseases: profileForm.diseases,
              goal: profileForm.goal || undefined
            }
          })
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          setSaveMessage('프로필이 저장되었습니다!');
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          setSaveMessage(data.error || '저장에 실패했습니다');
        }
      } catch (error) {
        setSaveMessage('서버 연결에 실패했습니다');
      } finally {
        setIsSaving(false);
      }
    };

    const addAllergy = () => {
      if (newAllergy.trim() && !profileForm.allergies.includes(newAllergy.trim())) {
        setProfileForm({
          ...profileForm,
          allergies: [...profileForm.allergies, newAllergy.trim()]
        });
        setNewAllergy('');
      }
    };

    const removeAllergy = (allergy) => {
      setProfileForm({
        ...profileForm,
        allergies: profileForm.allergies.filter(a => a !== allergy)
      });
    };

    const addDisease = () => {
      if (newDisease.trim() && !profileForm.diseases.includes(newDisease.trim())) {
        setProfileForm({
          ...profileForm,
          diseases: [...profileForm.diseases, newDisease.trim()]
        });
        setNewDisease('');
      }
    };

    const removeDisease = (disease) => {
      setProfileForm({
        ...profileForm,
        diseases: profileForm.diseases.filter(d => d !== disease)
      });
    };

    return (
      <div className="profile-page">
        <h2 className="page-title">프로필 설정</h2>

        <div className="profile-container">
          {/* 기본 정보 */}
          <div className="profile-section">
            <h3 className="section-title">
              <User size={20} />
              기본 정보
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{background: '#f0f0f0', cursor: 'not-allowed'}}
                />
              </div>
            </div>
          </div>

          {/* 건강 프로필 */}
          <div className="profile-section">
            <h3 className="section-title">
              <Heart size={20} />
              건강 프로필
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>나이</label>
                <input
                  type="number"
                  defaultValue={profileForm.age}
                  onBlur={(e) => setProfileForm({...profileForm, age: e.target.value})}
                  placeholder="나이"
                />
              </div>
              <div className="form-group">
                <label>성별</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label>키 (cm)</label>
                <input
                  type="number"
                  defaultValue={profileForm.height}
                  onBlur={(e) => setProfileForm({...profileForm, height: e.target.value})}
                  placeholder="키"
                />
              </div>
              <div className="form-group">
                <label>몸무게 (kg)</label>
                <input
                  type="number"
                  defaultValue={profileForm.weight}
                  onBlur={(e) => setProfileForm({...profileForm, weight: e.target.value})}
                  placeholder="몸무게"
                />
              </div>
            </div>
          </div>

          {/* 목표 */}
          <div className="profile-section">
            <h3 className="section-title">
              <TrendingUp size={20} />
              건강 목표
            </h3>
            <div className="form-group">
              <label>목표</label>
              <select
                value={profileForm.goal}
                onChange={(e) => setProfileForm({...profileForm, goal: e.target.value})}
              >
                <option value="">선택하세요</option>
                <option value="다이어트">다이어트</option>
                <option value="건강유지">건강유지</option>
                <option value="체중증가">체중증가</option>
                <option value="근육증가">근육증가</option>
              </select>
            </div>
          </div>

          {/* 알레르기 */}
          <div className="profile-section">
            <h3 className="section-title">
              <AlertCircle size={20} />
              알레르기 정보
            </h3>
            <div className="tag-input-group">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                placeholder="알레르기 항목 입력 (예: 땅콩, 우유)"
              />
              <button onClick={addAllergy} className="btn-add">
                <Plus size={18} />
              </button>
            </div>
            <div className="tag-list">
              {profileForm.allergies.map((allergy, index) => (
                <div key={index} className="tag">
                  {allergy}
                  <button onClick={() => removeAllergy(allergy)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 질병 정보 */}
          <div className="profile-section">
            <h3 className="section-title">
              <AlertCircle size={20} />
              질병 정보
            </h3>
            <div className="tag-input-group">
              <input
                type="text"
                value={newDisease}
                onChange={(e) => setNewDisease(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDisease()}
                placeholder="질병 정보 입력 (예: 당뇨, 고혈압)"
              />
              <button onClick={addDisease} className="btn-add">
                <Plus size={18} />
              </button>
            </div>
            <div className="tag-list">
              {profileForm.diseases.map((disease, index) => (
                <div key={index} className="tag">
                  {disease}
                  <button onClick={() => removeDisease(disease)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="profile-actions">
            <button 
              onClick={handleSaveProfile} 
              className="btn-save"
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '프로필 저장'}
            </button>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('성공') || saveMessage.includes('저장') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 네비게이션 바
  const Navigation = () => (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setCurrentPage('main')}>
        <ChefHat size={28} />
        <span className="brand-text">애드쿠킹클래스</span>
        <span className="brand-text-mobile">쿠킹</span>
        {isPremiumUser && <span className="premium-badge">PRO</span>}
      </div>
      
      {/* 햄버거 메뉴 버튼 (모바일) */}
      <button 
        className="hamburger-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="메뉴"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <div className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          onClick={() => {
            setCurrentPage('home');
            setIsMobileMenuOpen(false);
          }} 
          className={currentPage === 'home' ? 'active' : ''}
        >
          <span className="nav-text-full">식단관리</span>
          <span className="nav-text-mobile">식단</span>
        </button>
        <button 
          onClick={() => {
            setCurrentPage('history');
            setIsMobileMenuOpen(false);
          }} 
          className={currentPage === 'history' ? 'active' : ''}
        >
          <span className="nav-text-full">식사기록</span>
          <span className="nav-text-mobile">기록</span>
          {!isPremiumUser && <span className="premium-icon">🔒</span>}
        </button>
        <button 
          onClick={() => {
            setCurrentPage('profile');
            setIsMobileMenuOpen(false);
          }} 
          className={currentPage === 'profile' ? 'active' : ''}
        >
          <span className="nav-text-full">프로필</span>
          <span className="nav-text-mobile">내정보</span>
        </button>
        <button 
          onClick={() => {
            setIsLoggedIn(false);
            setUser(null);
            setAuthToken(null);
            setIsPremiumUser(false);
            localStorage.removeItem('authToken');
            setCurrentPage('main');
            setIsMobileMenuOpen(false);
          }}
          className="btn-logout"
        >
          <span className="nav-text-full">Pro계정으로 로그인</span>
          <span className="nav-text-mobile">로그인</span>
        </button>
      </div>
      
      {/* 모바일 메뉴 오버레이 */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );

  if (!isLoggedIn) {
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
            position: relative;
          }

          .btn-back-to-main {
            position: absolute;
            top: 20px;
            left: 20px;
            background: #f8f9fa;
            border: 1px solid #e1e8ed;
            color: #636e72;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            padding: 10px 16px;
            border-radius: 8px;
            transition: all 0.2s;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 4px;
            pointer-events: auto;
          }

          .btn-back-to-main:hover {
            background: #e9ecef;
            color: #2d3436;
            border-color: #ced4da;
          }

          .btn-back-to-main:active {
            transform: scale(0.95);
            background: #dee2e6;
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
            background: #FFE5E5;
            color: #2d3436;
            border: 2px solid #FFB8B8;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
          }

          .btn-primary:hover {
            background: #FFD0D0;
            border-color: #FFA0A0;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255, 184, 184, 0.3);
          }

          .btn-secondary {
            background: white;
            color: #2d3436;
            border: 2px solid #FFB8B8;
            padding: 14px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
          }

          .btn-secondary:hover {
            background: #FFE5E5;
            border-color: #FFA0A0;
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

          /* 모달 스타일 */
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

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            background: white;
            border-radius: 20px;
            padding: 32px;
            max-width: 450px;
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

          .verification-modal {
            max-width: 450px;
          }

          .verification-description {
            color: #636e72;
            font-size: 14px;
            margin-bottom: 24px;
            text-align: center;
            line-height: 1.6;
          }

          .verification-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .verification-input {
            text-align: center;
            font-size: 24px;
            letter-spacing: 8px;
            font-weight: 600;
          }
        `}</style>
        <div className="login-container">
          <div className="login-card">
            
            <div className="login-header">
              <ChefHat size={48} />
              <h1>애드쿠킹클래스</h1>
              <p>AI가 당신의 요리를 돕습니다</p>
            </div>

            {authError && (
              <div className="auth-error">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}
            
            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text"
                placeholder="아이디"
                className="input-field"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                required
              />
              
              <input 
                type="password" 
                placeholder="비밀번호" 
                className="input-field"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                required
              />


              <button 
                type="button"
                className="btn-secondary"
                disabled={authLoading}
                onClick={handleLogin}
              >
                {authLoading && authMode === 'login' ? '처리 중...' : '로그인하기'}
              </button>
            </form>
          </div>

          {/* 이메일 인증 모달 */}
          {showVerificationCode && (
            <div className="modal-overlay" onClick={() => setShowVerificationCode(false)}>
              <div className="modal-content verification-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>이메일 인증</h3>
                  <button onClick={() => setShowVerificationCode(false)} className="modal-close">
                    <X size={24} />
                  </button>
                </div>
                
                <p className="verification-description">
                  {pendingEmail}로 발송된 6자리 인증 코드를 입력해주세요.
                </p>

                {authError && (
                  <div className="auth-error">
                    <AlertCircle size={16} />
                    {authError}
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="verification-form">
                  <input
                    type="text"
                    placeholder="인증 코드 (6자리)"
                    className="input-field verification-input"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                  />

                  <button 
                    type="submit"
                    className="btn-primary"
                    disabled={authLoading || verificationCode.length !== 6}
                  >
                    {authLoading ? '확인 중...' : '인증하기'}
                  </button>

                  <button 
                    type="button"
                    className="btn-text"
                    onClick={handleResendCode}
                    disabled={authLoading}
                  >
                    인증 코드 재발송
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </>
    );
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

        .brand-text-mobile {
          display: none;
        }

        .hamburger-btn {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          z-index: 101;
        }

        .hamburger-btn span {
          width: 25px;
          height: 3px;
          background: #2d3436;
          border-radius: 3px;
          transition: all 0.3s;
        }

        .mobile-overlay {
          display: none;
        }

        .nav-text-mobile {
          display: none;
        }

        .premium-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }

        .premium-icon {
          font-size: 14px;
          margin-left: 4px;
        }

        .premium-required {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          max-width: 600px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .premium-required .premium-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .premium-required h3 {
          font-size: 28px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 16px;
        }

        .premium-required p {
          font-size: 16px;
          color: #636e72;
          margin: 8px 0;
          line-height: 1.6;
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
          background: #FFE5E5;
          color: #2d3436;
        }

        .nav-user {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFE5E5 !important;
          color: #2d3436 !important;
          border: 2px solid #FFB8B8 !important;
          margin-left: 8px;
        }

        /* 모바일 반응형 (768px 이하) */
        @media (max-width: 768px) {
          .navbar {
            padding: 12px 16px;
          }

          .nav-brand {
            font-size: 18px;
            gap: 8px;
          }

          .brand-text {
            display: none;
          }

          .brand-text-mobile {
            display: inline;
          }

          .hamburger-btn {
            display: flex;
          }

          .nav-menu {
            position: fixed;
            top: 0;
            right: -100%;
            width: 70%;
            max-width: 300px;
            height: 100vh;
            background: white;
            flex-direction: column;
            gap: 0;
            padding: 80px 20px 20px;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            transition: right 0.3s ease;
            z-index: 100;
          }

          .nav-menu.mobile-open {
            right: 0;
          }

          .nav-menu button {
            width: 100%;
            text-align: left;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 16px;
          }

          .nav-text-full {
            display: none;
          }

          .nav-text-mobile {
            display: inline;
          }

          .mobile-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 99;
          }

          .container {
            padding: 16px;
          }

          .page-header h2 {
            font-size: 24px;
          }

          .page-header p {
            font-size: 14px;
          }

          /* 랜딩 페이지 모바일 */
          .landing-hero {
            flex-direction: column;
            justify-content: space-between;
            padding: 20px 16px 16px;
            gap: 16px;
            min-height: 100vh;
            max-height: 100vh;
            overflow: hidden;
            text-align: center;
          }

          .landing-content {
            max-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex: 1;
            justify-content: center;
          }

          .title-desktop,
          .subtitle-desktop,
          .btn-text-desktop {
            display: none;
          }

          .title-mobile,
          .subtitle-mobile,
          .btn-text-mobile {
            display: inline;
          }

          .landing-title {
            font-size: 28px;
            margin-bottom: 8px;
            line-height: 1.2;
          }

          .landing-subtitle {
            font-size: 14px;
            margin-bottom: 12px;
          }

          .landing-buttons {
            flex-direction: row;
            gap: 8px;
            margin-bottom: 12px;
          }

          .btn-large,
          .btn-pro-login,
          .btn-pro-subscribe {
            flex: 1;
            padding: 12px 12px;
            font-size: 13px;
            white-space: nowrap;
          }

          .pro-badge-icon {
            font-size: 14px;
          }

          .landing-features-preview {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
          }

          .feature-preview-item {
            padding: 6px 10px;
            font-size: 11px;
          }

          .landing-image {
            max-width: 100%;
            flex-shrink: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 0;
          }

          .landing-image img,
          .hero-emoji-large {
            max-width: 180px;
            width: 180px;
            height: 180px;
            font-size: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 40px 20px;
          }

          .feature-card {
            padding: 24px;
          }

          .feature-card h3 {
            font-size: 20px;
          }

          .feature-card p {
            font-size: 14px;
          }

          .landing-pro-features {
            padding: 40px 20px;
          }

          .landing-pro-features h2 {
            font-size: 24px;
            margin-bottom: 24px;
          }
        }
        }

        /* Main Landing Page */
        .main-landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }

        .landing-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 60px;
          min-height: 90vh;
        }

        .landing-content {
          flex: 1;
          max-width: 600px;
        }

        .landing-title {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.2;
          color: #2d3436;
          margin-bottom: 24px;
        }

        .title-mobile,
        .subtitle-mobile,
        .btn-text-mobile {
          display: none;
        }

        .landing-subtitle {
          font-size: 24px;
          color: #636e72;
          margin-bottom: 48px;
          line-height: 1.6;
        }

        .landing-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 48px;
        }

        .btn-large {
          padding: 20px 48px;
          font-size: 20px;
          font-weight: 700;
        }

        .btn-pro-login {
          background: #FFB8B8;
          color: white;
          border: none;
          padding: 20px 48px;
          border-radius: 16px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(255, 184, 184, 0.3);
        }

        .btn-pro-login:hover {
          background: #FFA0A0;
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(255, 184, 184, 0.4);
        }

        .btn-pro-subscribe {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 20px 48px;
          border-radius: 16px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .btn-pro-subscribe:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
        }

        .pro-badge-icon {
          font-size: 24px;
        }

        .landing-features-preview {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .feature-preview-item {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 24px;
          background: white;
          border-radius: 16px;
          font-weight: 600;
          color: #2d3436;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .feature-icon {
          font-size: 24px;
        }

        .landing-image {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-emoji-large {
          font-size: 300px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .landing-pro-features {
          background: white;
          padding: 100px 40px;
        }

        .landing-pro-features h2 {
          text-align: center;
          font-size: 48px;
          font-weight: 800;
          color: #2d3436;
          margin-bottom: 60px;
        }

        .pro-features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
        }

        .pro-feature-card {
          background: white;
          padding: 40px;
          border-radius: 24px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid #f1f3f4;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .pro-feature-card:hover {
          transform: translateY(-8px);
          border-color: #667eea;
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.2);
        }

        .pro-feature-card h3 {
          font-size: 24px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 12px;
        }

        .pro-feature-card p {
          font-size: 16px;
          color: #636e72;
          line-height: 1.6;
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
          background: #FFE5E5;
          color: #2d3436;
          border: 2px solid #FFB8B8;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .btn-add:hover {
          background: #FFD0D0;
          border-color: #FFA0A0;
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

        .health-form {
          background: white;
          padding: 40px;
          border-radius: 24px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .health-form .btn-primary {
          width: 100%;
          margin-top: 24px;
          background: #FFE5E5;
          color: #2d3436;
          border: 2px solid #FFB8B8;
          padding: 18px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .health-form .btn-primary:hover {
          background: #FFD0D0;
          border-color: #FFA0A0;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(255, 184, 184, 0.3);
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
          border-color: #FFB8B8;
          box-shadow: 0 0 0 4px rgba(255, 184, 184, 0.1);
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
          background: #FFE5E5;
          color: #2d3436;
          border: 2px solid #FFB8B8;
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
          background: #FFD0D0;
          border-color: #FFA0A0;
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
        }

        .upload-area svg {
          color: #b2bec3;
          margin-bottom: 16px;
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
          border: 2px solid #FFB8B8;
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
          border-color: #FFA0A0;
          color: #2d3436;
          background: #FFF5F5;
        }

        .filter-btn.active {
          background: #FFE5E5;
          border-color: #FFB8B8;
          color: #2d3436;
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

        .meal-item.optimistic {
          opacity: 0.6;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .meal-item.loading {
          pointer-events: none;
          opacity: 0.7;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }

        /* 스켈레톤 UI */
        .skeleton {
          pointer-events: none;
          user-select: none;
        }

        .skeleton-text {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .stat-card.skeleton {
          background: white;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          border: 2px solid transparent;
        }

        .rating-like.active {
          color: #00b894;
          background: #d5f4e6;
          border-color: #00b894;
        }

        .rating-like:hover {
          border-color: #00b894;
          color: #00b894;
        }

        .rating-dislike.active {
          color: #d63031;
          background: #ffebee;
          border-color: #d63031;
        }

        .rating-dislike:hover {
          border-color: #d63031;
          color: #d63031;
        }

        .delete-icon:hover {
          background: #ffebee;
          color: #d63031;
          border-color: #d63031;
        }

        /* 프로필 페이지 */
        .profile-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .profile-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-section {
          background: white;
          padding: 32px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
        }

        .form-group input,
        .form-group select {
          padding: 12px 16px;
          border: 2px solid #e1e8ed;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #ff6b6b;
        }

        .tag-input-group {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .tag-input-group input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e1e8ed;
          border-radius: 12px;
          font-size: 15px;
        }

        .tag-input-group input:focus {
          outline: none;
          border-color: #ff6b6b;
        }

        .btn-add {
          padding: 12px 16px;
          background: #FFE5E5;
          color: #2d3436;
          border: 2px solid #FFB8B8;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-add:hover {
          background: #FFD0D0;
          border-color: #FFA0A0;
          transform: translateY(-2px);
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          color: #2d3436;
        }

        .tag button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #636e72;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .tag button:hover {
          background: rgba(0,0,0,0.1);
          color: #2d3436;
        }

        .profile-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
        }

        .btn-save {
          padding: 16px 48px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .save-message {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .save-message.success {
          background: #d4edda;
          color: #155724;
        }

        .save-message.error {
          background: #f8d7da;
          color: #721c24;
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

        /* 결제 페이지 스타일 */
        .checkout-page {
          min-height: 100vh;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .checkout-container {
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
        }

        .checkout-left h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .checkout-right {
          background: #0a0a0a;
          padding: 40px;
          border-radius: 16px;
          border: 1px solid #222;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #aaa;
          font-size: 14px;
        }

        .payment-methods {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* 결제 성공 페이지 스타일 */
        .payment-success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .success-container {
          background: white;
          padding: 60px 40px;
          border-radius: 24px;
          text-align: center;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #4CAF50;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          margin: 0 auto 24px;
        }

        .success-container h1 {
          font-size: 32px;
          margin-bottom: 12px;
          color: #333;
        }

        .success-container p {
          color: #666;
          font-size: 18px;
          margin-bottom: 32px;
        }

        .success-details {
          background: #f8f8f8;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row span {
          color: #666;
        }

        .detail-row strong {
          color: #333;
        }

        @media (max-width: 768px) {
          .checkout-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .success-container {
            padding: 40px 24px;
          }
        }
      `}</style>

      {currentPage === 'main' && <MainPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'checkout' && <CheckoutPage />}
      {currentPage === 'payment-success' && <PaymentSuccessPage />}
      
      {currentPage !== 'main' && currentPage !== 'login' && currentPage !== 'checkout' && currentPage !== 'payment-success' && (
        <>
          <Navigation />
          
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'health' && <HealthPage />}
          {currentPage === 'coaching' && <CoachingPage />}
          {currentPage === 'history' && <HistoryPage />}
          {currentPage === 'profile' && <ProfilePage />}
        </>
      )}
    </>
  );
}
