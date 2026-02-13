import React, { useState, useEffect } from 'react';
import WelcomePage from './components/WelcomePage';
import QuickHealthInfo from './components/QuickHealthInfo';
import HomeHub from './components/HomeHub';
import RecipeRecommendationPage from './components/RecipeRecommendationPage';
import HealthProfilePage from './components/HealthProfilePage';
import FridgePage from './components/FridgePage';
import MealHistoryPage from './components/MealHistoryPage';

export default function AppOnboarding() {
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome', 'healthInfo', 'home', 'recommend', 'health-profile'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ingredientsToRecommend, setIngredientsToRecommend] = useState([]);
  const [isPremium, setIsPremium] = useState(false); // 전역 프리미엄 상태

  useEffect(() => {
    // 앱 시작 시 저장된 토큰 확인
    const savedToken = localStorage.getItem('authToken');
    const savedIsGuest = localStorage.getItem('isGuest') === 'true';
    
    if (savedToken) {
      if (savedIsGuest) {
        // 게스트 세션 복구
        setUser({ name: '게스트', isGuest: true });
        setToken(savedToken);
        setCurrentScreen('home');
      } else {
        // 실제 로그인 세션 복구
        restoreSession(savedToken);
      }
    }

    // 개발 모드에서 전역 프리미엄 토글 함수 노출
    if (import.meta.env.DEV) {
      window.togglePremium = () => {
        setIsPremium(prev => {
          const newValue = !prev;
          console.log(`🔄 전역 프리미엄 상태 변경: ${newValue ? '유료 ✅' : '무료 ❌'}`);
          return newValue;
        });
      };
      
      window.setPremium = (value) => {
        setIsPremium(value);
        console.log(`🔄 전역 프리미엄 상태 설정: ${value ? '유료 ✅' : '무료 ❌'}`);
      };
      
      window.resetApp = () => {
        localStorage.clear();
        location.reload();
      };
      
      console.log('💡 전역 개발자 도구:');
      console.log('  - togglePremium() : 무료/유료 전환');
      console.log('  - setPremium(true) : 유료로 설정');
      console.log('  - setPremium(false) : 무료로 설정');
      console.log('  - resetApp() : 앱 초기화');
      console.log(`  - 현재 상태: ${isPremium ? '유료 ✅' : '무료 ❌'}`);
    }
  }, [isPremium]);

  const restoreSession = async (savedToken) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(savedToken);
        
        // 온보딩 완료 여부에 따라 화면 결정
        if (data.user.onboardingComplete) {
          setCurrentScreen('home');
        } else {
          setCurrentScreen('healthInfo');
        }
      } else {
        // 토큰이 유효하지 않으면 제거
        localStorage.removeItem('authToken');
      }
    } catch (err) {
      console.error('Session restore failed:', err);
      localStorage.removeItem('authToken');
    }
  };

  const handleGuestStart = () => {
    // 게스트 세션 생성
    const guestToken = `guest-${Date.now()}`;
    setToken(guestToken);
    setUser({ name: '게스트', isGuest: true });
    
    localStorage.setItem('authToken', guestToken);
    localStorage.setItem('isGuest', 'true');
    
    setCurrentScreen('home');
  };

  const handleLogin = (authData) => {
    setUser(authData.user);
    setToken(authData.token);
    
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('isGuest', 'false');
    
    // 온보딩 완료 여부에 따라 화면 결정
    if (authData.onboardingComplete) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('healthInfo');
    }
  };

  const handleLoginSuccess = (authData) => {
    handleLogin(authData);
  };

  const handleHealthInfoComplete = (data) => {
    // 건강 정보 입력 완료 후 홈으로
    setCurrentScreen('home');
  };

  const handleHealthInfoSkip = () => {
    // 건강 정보 스킵 후 홈으로
    setCurrentScreen('home');
  };

  const handleNavigate = (destination) => {
    setCurrentScreen(destination);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isGuest');
    setUser(null);
    setToken(null);
    setCurrentScreen('welcome');
  };

  const handleNavigateToRecommendWithIngredients = (ingredients) => {
    setIngredientsToRecommend(ingredients);
    setCurrentScreen('recommend');
  };

  // 화면 렌더링
  if (currentScreen === 'welcome') {
    return (
      <WelcomePage 
        onGuestStart={handleGuestStart}
        onLogin={handleLogin}
      />
    );
  }

  if (currentScreen === 'healthInfo') {
    return (
      <QuickHealthInfo
        user={user}
        onComplete={handleHealthInfoComplete}
        onSkip={handleHealthInfoSkip}
      />
    );
  }

  if (currentScreen === 'home') {
    return (
      <HomeHub
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isPremium={isPremium}
      />
    );
  }

  if (currentScreen === 'fridge') {
    return (
      <FridgePage
        user={user}
        onBack={() => setCurrentScreen('home')}
        onNavigateToRecommend={handleNavigateToRecommendWithIngredients}
        isPremium={isPremium}
      />
    );
  }

  if (currentScreen === 'recommend') {
    return (
      <RecipeRecommendationPage
        user={user}
        onBack={() => setCurrentScreen('home')}
        initialIngredients={ingredientsToRecommend}
        onNavigateToFridge={() => setCurrentScreen('fridge')}
        onNavigateToHealth={() => setCurrentScreen('health-profile')}
        isPremium={isPremium}
      />
    );
  }

  if (currentScreen === 'health-profile' || currentScreen === 'profile') {
    return (
      <HealthProfilePage
        user={user}
        onBack={() => setCurrentScreen('home')}
        isPremium={isPremium}
      />
    );
  }

  if (currentScreen === 'meals') {
    return (
      <MealHistoryPage
        user={user}
        onBack={() => setCurrentScreen('home')}
        isPremium={isPremium}
      />
    );
  }

  return null;
}
