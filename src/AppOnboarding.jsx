import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import QuickHealthInfo from './components/QuickHealthInfo';
import HomeHub from './components/HomeHub';
import RecipeRecommendationPage from './components/RecipeRecommendationPage';
import HealthProfilePage from './components/HealthProfilePage';
import FridgePage from './components/FridgePage';
import MealHistoryPage from './components/MealHistoryPage';

export default function AppOnboarding() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'healthInfo', 'home', 'recommend', 'health-profile'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // 앱 시작 시 저장된 토큰 확인
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      restoreSession(savedToken);
    }
  }, []);

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

  const handleLoginSuccess = (authData) => {
    setUser(authData.user);
    setToken(authData.token);
    
    // 온보딩 완료 여부에 따라 다음 화면 결정
    if (authData.onboardingComplete) {
      setCurrentScreen('home');
    } else {
      setCurrentScreen('healthInfo');
    }
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
    setUser(null);
    setToken(null);
    setCurrentScreen('login');
  };

  // 화면 렌더링
  if (currentScreen === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
      />
    );
  }

  if (currentScreen === 'recommend') {
    return (
      <RecipeRecommendationPage
        user={user}
        onBack={() => setCurrentScreen('home')}
      />
    );
  }

  if (currentScreen === 'health-profile' || currentScreen === 'profile') {
    return (
      <HealthProfilePage
        user={user}
        onBack={() => setCurrentScreen('home')}
      />
    );
  }

  if (currentScreen === 'fridge') {
    return (
      <FridgePage
        user={user}
        onBack={() => setCurrentScreen('home')}
        onNavigateToRecommend={() => setCurrentScreen('recommend')}
      />
    );
  }

  if (currentScreen === 'meals') {
    return (
      <MealHistoryPage
        user={user}
        onBack={() => setCurrentScreen('home')}
      />
    );
  }

  return null;
}
