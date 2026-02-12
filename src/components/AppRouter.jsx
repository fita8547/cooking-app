import React, { useState, useEffect } from 'react';
import HomeHub from './HomeHub';
import RecipeRecommendationPage from './RecipeRecommendationPage';
import HealthProfilePage from './HealthProfilePage';
import FridgePage from './FridgePage';
import MealHistoryPage from './MealHistoryPage';
import Login from './Login';

export default function AppRouter() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [ingredientsToRecommend, setIngredientsToRecommend] = useState([]);

  useEffect(() => {
    // 저장된 토큰 확인
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      // 실제로는 토큰으로 사용자 정보를 가져와야 함
      setCurrentPage('home');
    }
  }, []);

  const handleLogin = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('authToken', token);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    setCurrentPage('login');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleNavigateToRecommendWithIngredients = (ingredients) => {
    setIngredientsToRecommend(ingredients);
    setCurrentPage('recommend');
  };

  // 로그인 페이지
  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
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
