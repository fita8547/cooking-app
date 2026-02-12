import React, { useState, useEffect } from 'react';
import { Refrigerator, Sparkles, Calendar, User, LogOut, Heart } from 'lucide-react';

export default function HomeHub({ user, onNavigate, onLogout }) {
  const [ingredientCount, setIngredientCount] = useState(0);
  const [hasHealthProfile, setHasHealthProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyInsight, setDailyInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchHomeData();
    fetchDailyInsight();
  }, []);

  const fetchHomeData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // 재료 개수 가져오기
      const ingredientsRes = await fetch(`${API_BASE_URL}/ingredients/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ingredientsData = await ingredientsRes.json();
      setIngredientCount(ingredientsData.count || 0);

      // 건강 정보 여부 확인
      const healthRes = await fetch(`${API_BASE_URL}/health-info/exists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const healthData = await healthRes.json();
      setHasHealthProfile(healthData.exists || false);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyInsight = async () => {
    setInsightLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // 최근 식사 기록 가져오기
      const mealsRes = await fetch(`${API_BASE_URL}/meals?limit=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mealsData = await mealsRes.json();
      
      // 건강 프로필 가져오기
      let healthProfile = null;
      let nutritionTargets = null;
      try {
        const profileRes = await fetch(`${API_BASE_URL}/health-info/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          healthProfile = profileData.profile;
          nutritionTargets = profileData.profile?.calculatedMetrics?.macronutrientTargets;
        }
      } catch (err) {
        console.log('No health profile');
      }

      // AI 인사이트 요청
      const insightRes = await fetch(`${API_BASE_URL}/ai/daily-insight`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mealHistory: mealsData.meals || [],
          healthProfile,
          nutritionTargets
        })
      });

      if (insightRes.ok) {
        const insightData = await insightRes.json();
        setDailyInsight(insightData.insight);
      }
    } catch (err) {
      console.error('Failed to fetch daily insight:', err);
      setDailyInsight('오늘도 건강한 하루 보내세요! 💪');
    } finally {
      setInsightLoading(false);
    }
  };

  const greeting = user?.name ? `${user.name}님, 내 몸에 맞는 한 끼를 찾아볼까요?` : '내 몸에 맞는 한 끼를 찾아볼까요?';
  const ingredientText = ingredientCount > 0 ? `냉장고 재료 ${ingredientCount}개로` : '냉장고 재료로';
  const healthGoalText = hasHealthProfile ? '건강 목표에 맞춰 추천해드릴게요.' : '맞춤 추천해드릴게요.';

  return (
    <div className="home-hub-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">냉장고 요리 도우미</h1>
          <div className="header-actions">
            <button className="btn-icon" onClick={() => onNavigate('profile')} title="프로필">
              <User size={20} />
            </button>
            <button className="btn-icon" onClick={onLogout} title="로그아웃">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-greeting">{greeting}</h2>
          <div className="hero-main-message">
            <p className="hero-question">재료는 있는데, 내 몸에 맞는 한 끼는 모르겠다면?</p>
            <p className="hero-answer">냉장고 재료와 건강 정보를 분석해 지금 먹어야 할 레시피를 추천해드립니다.</p>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-icon">🥬</span>
              <span className="stat-text">{ingredientText}</span>
            </div>
            {hasHealthProfile && (
              <div className="stat-item">
                <span className="stat-icon">💪</span>
                <span className="stat-text">맞춤 영양 목표 설정됨</span>
              </div>
            )}
          </div>
          <button 
            className="btn-cta"
            onClick={() => onNavigate('recommend')}
          >
            🍳 지금 추천받기
          </button>
        </div>
      </section>

      {/* AI 코칭 카드 */}
      {dailyInsight && (
        <section className="ai-coaching-section">
          <div className="coaching-card">
            <div className="coaching-header">
              <span className="coaching-icon">💬</span>
              <h3>오늘의 AI 코칭</h3>
            </div>
            <p className="coaching-message">
              {insightLoading ? '분석 중...' : dailyInsight}
            </p>
            <button onClick={() => onNavigate('meals')} className="btn-coaching-detail">
              상세 분석 보기 →
            </button>
          </div>
        </section>
      )}

      {/* Feature Cards */}
      <section className="feature-cards">
        <div 
          className="feature-card"
          onClick={() => onNavigate('fridge')}
        >
          <div className="card-icon">
            <Refrigerator size={32} />
          </div>
          <h3 className="card-title">우리집 냉장고 관리</h3>
          <p className="card-description">
            {ingredientCount > 0 
              ? `${ingredientCount}개의 재료가 있어요`
              : '재료를 추가해보세요'}
          </p>
        </div>

        <div 
          className="feature-card"
          onClick={() => onNavigate('health-profile')}
        >
          <div className="card-icon">
            <Heart size={32} />
          </div>
          <h3 className="card-title">건강 프로필</h3>
          <p className="card-description">
            {hasHealthProfile 
              ? '맞춤 영양 목표 확인하기'
              : '건강 정보를 입력하세요'}
          </p>
        </div>

        <div 
          className="feature-card"
          onClick={() => onNavigate('meals')}
        >
          <div className="card-icon">
            <Calendar size={32} />
          </div>
          <h3 className="card-title">식사 기록</h3>
          <p className="card-description">식사 기록을 관리하세요</p>
        </div>
      </section>

      <style jsx>{`
        .home-hub-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
        }

        .home-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 16px 20px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .app-title {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f1f3f5;
          color: #2d3436;
        }

        .hero-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .hero-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .hero-greeting {
          font-size: 32px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 24px 0;
          line-height: 1.3;
        }

        .hero-main-message {
          margin-bottom: 32px;
        }

        .hero-question {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .hero-answer {
          font-size: 16px;
          color: #636e72;
          margin: 0;
          line-height: 1.6;
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          font-size: 20px;
        }

        .stat-text {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
        }

        .btn-cta {
          padding: 20px 48px;
          background: var(--gradient-primary);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(255, 140, 66, 0.25);
        }

        .btn-cta:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(255, 140, 66, 0.35);
        }

        .btn-cta:active {
          transform: translateY(-2px);
        }

        .ai-coaching-section {
          max-width: 1200px;
          margin: -20px auto 0;
          padding: 0 20px 40px;
        }

        .coaching-card {
          background: var(--gradient-primary);
          border-radius: 20px;
          padding: 32px;
          color: white;
          box-shadow: 0 8px 24px rgba(255, 140, 66, 0.2);
        }

        .coaching-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .coaching-icon {
          font-size: 28px;
        }

        .coaching-header h3 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .coaching-message {
          font-size: 18px;
          line-height: 1.6;
          margin: 0 0 20px 0;
          opacity: 0.95;
        }

        .btn-coaching-detail {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-coaching-detail:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .feature-cards {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px 60px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid #e9ecef;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border-color: var(--primary);
        }

        .card-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-primary);
          border-radius: 16px;
          color: white;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 8px 0;
        }

        .card-description {
          font-size: 14px;
          color: #636e72;
          margin: 0;
        }

        @media (max-width: 768px) {
          .hero-greeting {
            font-size: 24px;
          }

          .hero-question {
            font-size: 20px;
          }

          .hero-answer {
            font-size: 14px;
          }

          .hero-stats {
            flex-direction: column;
            gap: 12px;
          }

          .stat-item {
            justify-content: center;
          }

          .btn-cta {
            font-size: 18px;
            padding: 16px 36px;
          }

          .feature-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
