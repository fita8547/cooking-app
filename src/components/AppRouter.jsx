import React, { useState, useEffect } from 'react';
import WelcomePage from './WelcomePage';
import HomeHub from './HomeHub';
import RecipeRecommendationPage from './RecipeRecommendationPage';
import HealthProfilePage from './HealthProfilePage';
import FridgePage from './FridgePage';
import MealHistoryPage from './MealHistoryPage';

export default function AppRouter() {
  const [currentPage, setCurrentPage] = useState('welcome'); // Welcome 페이지로 시작
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [ingredientsToRecommend, setIngredientsToRecommend] = useState([]);

  useEffect(() => {
    // 저장된 세션 확인
    const savedToken = localStorage.getItem('authToken');
    const savedIsGuest = localStorage.getItem('isGuest') === 'true';
    
    if (savedToken) {
      setAuthToken(savedToken);
      setIsGuest(savedIsGuest);
      
      if (savedIsGuest) {
        setUser({ name: '게스트', isGuest: true });
      }
      
      setCurrentPage('home');
    }

    // 개발 모드에서 전역 함수 등록 (모든 페이지에서 사용 가능)
    if (import.meta.env.DEV) {
      window.resetApp = () => {
        localStorage.clear();
        console.log('🔄 앱이 초기화되었습니다. Welcome 페이지로 이동합니다.');
        location.reload();
      };
      
      console.log('💡 개발자 도구 명령어:');
      console.log('  - resetApp() : 앱 초기화 (Welcome 페이지로)');
    }
  }, []);

  const handleGuestStart = () => {
    // 게스트 세션 생성
    const guestToken = `guest-${Date.now()}`;
    setAuthToken(guestToken);
    setUser({ name: '게스트', isGuest: true });
    setIsGuest(true);
    
    localStorage.setItem('authToken', guestToken);
    localStorage.setItem('isGuest', 'true');
    
    setCurrentPage('home');
  };

  const handleLogin = (token, userData) => {
    // 실제 로그인
    setAuthToken(token);
    setUser(userData);
    setIsGuest(false);
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('isGuest', 'false');
    
    setCurrentPage('home');
  };

  const handleShowLogin = () => {
    // WelcomePage 내부에서 로그인 폼 처리
    setCurrentPage('welcome');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsGuest(false);
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('isGuest');
    
    setCurrentPage('welcome');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleNavigateToRecommendWithIngredients = (ingredients) => {
    setIngredientsToRecommend(ingredients);
    setCurrentPage('recommend');
  };

  // Welcome 페이지
  if (currentPage === 'welcome') {
    return (
      <WelcomePage 
        onGuestStart={handleGuestStart}
        onLogin={handleLogin}
      />
    );
  }

  // 홈 페이지
  if (currentPage === 'home') {
    return (
      <HomeHub
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  }

  // 냉장고 페이지
  if (currentPage === 'fridge') {
    return (
      <FridgePage
        user={user}
        onBack={() => handleNavigate('home')}
        onNavigateToRecommend={handleNavigateToRecommendWithIngredients}
      />
    );
  }

  // 레시피 추천 페이지
  if (currentPage === 'recommend') {
    return (
      <RecipeRecommendationPage
        user={user}
        onBack={() => handleNavigate('home')}
        initialIngredients={ingredientsToRecommend}
        onNavigateToFridge={() => handleNavigate('fridge')}
        onNavigateToHealth={() => handleNavigate('health-profile')}
      />
    );
  }

  // 건강 프로필 페이지
  if (currentPage === 'health-profile' || currentPage === 'profile') {
    return (
      <HealthProfilePage
        user={user}
        onBack={() => handleNavigate('home')}
      />
    );
  }

  // 식사 기록 페이지
  if (currentPage === 'meals') {
    return (
      <MealHistoryPage
        user={user}
        onBack={() => handleNavigate('home')}
      />
    );
  }

  // 기본값: 홈으로
  return (
    <HomeHub
      user={user}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  );
}
