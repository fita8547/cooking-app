import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MealHistoryPage({ user, onBack }) {
  const [mealHistory, setMealHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    loadMealHistory();
    loadWeeklyAnalysis();
  }, []);

  const loadMealHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/meals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMealHistory(data.meals || []);
      }
    } catch (err) {
      console.error('Failed to load meal history:', err);
      // 목업 데이터 사용
      setMealHistory([
        { id: 1, date: '2026-02-10', name: '김치찌개', rating: 'like', calories: 450, protein: 25, carbs: 35, fat: 18 },
        { id: 2, date: '2026-02-09', name: '샐러드 볼', rating: 'like', calories: 320, protein: 30, carbs: 15, fat: 12 },
        { id: 3, date: '2026-02-08', name: '된장찌개', rating: 'neutral', calories: 280, protein: 15, carbs: 30, fat: 8 },
        { id: 4, date: '2026-02-07', name: '불고기', rating: 'like', calories: 520, protein: 35, carbs: 28, fat: 22 },
        { id: 5, date: '2026-02-06', name: '계란말이', rating: 'like', calories: 180, protein: 12, carbs: 3, fat: 14 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // 식사 기록 가져오기
      const mealsRes = await fetch(`${API_BASE_URL}/meals?limit=21`, {
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

      // AI 주간 분석 요청
      const analysisRes = await fetch(`${API_BASE_URL}/ai/weekly-analysis`, {
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

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setWeeklyAnalysis(analysisData.analysis);
      }
    } catch (err) {
      console.error('Failed to load weekly analysis:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // 캘린더 관련 함수
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getMealsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return mealHistory.filter(meal => meal.date === dateStr);
  };

  const hasMealsOnDate = (date) => {
    if (!date) return false;
    return getMealsForDate(date).length > 0;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 영양소 트렌드 계산 (최근 7일)
  const getLast7DaysData = () => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const meals = mealHistory.filter(m => m.date === dateStr);
      
      last7Days.push({
        date: dateStr,
        dayLabel: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
        protein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
        carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
        fat: meals.reduce((sum, m) => sum + (m.fat || 0), 0),
      });
    }
    
    return last7Days;
  };

  const trendData = getLast7DaysData();
  const maxCalories = Math.max(...trendData.map(d => d.calories), 1);

  // 개인화 추천 (좋아요 기반)
  const likedMeals = mealHistory.filter(m => m.rating === 'like');
  const favoriteIngredients = likedMeals.length > 0 
    ? ['김치', '닭가슴살', '계란', '두부'] // 실제로는 AI 분석 필요
    : [];

  if (loading) {
    return (
      <div className="meal-history-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  const monthName = currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const selectedMeals = selectedDate ? getMealsForDate(selectedDate) : [];

  return (
    <div className="meal-history-page">
      <header className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          뒤로
        </button>
        <h1 className="page-title">식사 기록</h1>
      </header>

      <div className="page-content">
        {/* AI 주간 분석 */}
        {weeklyAnalysis && (
          <section className="ai-analysis-section">
            <div className="section-header">
              <span className="ai-icon">🤖</span>
              <h2>AI 주간 분석</h2>
            </div>
            
            {analysisLoading ? (
              <div className="analysis-loading">분석 중...</div>
            ) : (
              <div className="analysis-content">
                <div className="analysis-summary">
                  <p>{weeklyAnalysis.summary}</p>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-card strengths">
                    <h4>👍 잘하고 있어요</h4>
                    <ul>
                      {weeklyAnalysis.strengths?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="analysis-card improvements">
                    <h4>💡 개선하면 좋아요</h4>
                    <ul>
                      {weeklyAnalysis.improvements?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="recommendations">
                  <h4>📋 이번 주 추천</h4>
                  <div className="recommendation-list">
                    {weeklyAnalysis.recommendations?.map((item, idx) => (
                      <div key={idx} className="recommendation-item">
                        <span className="rec-number">{idx + 1}</span>
                        <span className="rec-text">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 1. 캘린더 뷰 */}
        <section className="calendar-section">
          <div className="section-header">
            <Calendar size={24} />
            <h2>식사 캘린더</h2>
          </div>
          
          <div className="calendar-controls">
            <button onClick={goToPreviousMonth} className="month-nav">
              <ChevronLeft size={20} />
            </button>
            <h3 className="month-title">{monthName}</h3>
            <button onClick={goToNextMonth} className="month-nav">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-header">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="day-label">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const hasMeals = date && hasMealsOnDate(date);
                const isSelected = selectedDate && date && 
                  selectedDate.toDateString() === date.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!date ? 'empty' : ''} ${hasMeals ? 'has-meals' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <span className="day-number">{date.getDate()}</span>
                        {hasMeals && <span className="meal-dot">•</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDate && selectedMeals.length > 0 && (
            <div className="selected-date-meals">
              <h4>{selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 식사</h4>
              <div className="meal-cards">
                {selectedMeals.map(meal => (
                  <div key={meal.id} className="meal-card">
                    <div className="meal-info">
                      <span className="meal-name">{meal.name}</span>
                      <span className="meal-calories">{meal.calories}kcal</span>
                    </div>
                    {meal.rating === 'like' && <span className="meal-rating">❤️</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. 영양소 트렌드 */}
        <section className="trend-section">
          <div className="section-header">
            <TrendingUp size={24} />
            <h2>최근 7일 칼로리 트렌드</h2>
          </div>
          
          <div className="trend-chart">
            {trendData.map((day, index) => (
              <div key={index} className="trend-bar-container">
                <div className="trend-bar-wrapper">
                  <div
                    className="trend-bar"
                    style={{ height: `${(day.calories / maxCalories) * 100}%` }}
                  >
                    {day.calories > 0 && (
                      <span className="trend-value">{day.calories}</span>
                    )}
                  </div>
                </div>
                <span className="trend-label">{day.dayLabel}</span>
              </div>
            ))}
          </div>

          <div className="nutrition-summary">
            <div className="summary-item">
              <span className="summary-label">평균 칼로리</span>
              <span className="summary-value">
                {Math.round(trendData.reduce((sum, d) => sum + d.calories, 0) / 7)}kcal
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">평균 단백질</span>
              <span className="summary-value">
                {Math.round(trendData.reduce((sum, d) => sum + d.protein, 0) / 7)}g
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">평균 탄수화물</span>
              <span className="summary-value">
                {Math.round(trendData.reduce((sum, d) => sum + d.carbs, 0) / 7)}g
              </span>
            </div>
          </div>
        </section>

        {/* 3. 개인화 추천 */}
        {likedMeals.length > 0 && (
          <section className="recommendation-section">
            <div className="section-header">
              <Heart size={24} />
              <h2>좋아하는 요리 기반 추천</h2>
            </div>
            
            <div className="favorite-stats">
              <p className="stats-text">
                <strong>{likedMeals.length}개</strong>의 요리를 좋아하셨네요!
              </p>
              {favoriteIngredients.length > 0 && (
                <div className="favorite-ingredients">
                  <span className="ingredients-label">자주 드시는 재료:</span>
                  <div className="ingredient-tags">
                    {favoriteIngredients.map((ing, idx) => (
                      <span key={idx} className="ingredient-tag">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="recommendation-cards">
              {likedMeals.slice(0, 3).map(meal => (
                <div key={meal.id} className="recommendation-card">
                  <div className="card-emoji">🍽️</div>
                  <h4>{meal.name}</h4>
                  <p className="card-reason">이전에 좋아하셨던 메뉴예요</p>
                  <div className="card-nutrition">
                    <span>{meal.calories}kcal</span>
                    <span>•</span>
                    <span>단백질 {meal.protein}g</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {mealHistory.length === 0 && (
          <div className="empty-state">
            <Calendar size={64} style={{ color: '#dfe6e9' }} />
            <h3>아직 식사 기록이 없어요</h3>
            <p>레시피를 만들고 기록을 남겨보세요</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .meal-history-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-header {
          background: white;
          border-bottom: 1px solid #e9ecef;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-back:hover {
          background: #f1f3f5;
          border-color: #667eea;
          color: #667eea;
        }

        .page-title {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0;
        }

        .page-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #636e72;
        }

        section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .ai-analysis-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid #667eea;
        }

        .ai-icon {
          font-size: 28px;
        }

        .analysis-loading {
          text-align: center;
          padding: 40px;
          color: #636e72;
        }

        .analysis-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .analysis-summary {
          padding: 20px;
          background: white;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .analysis-summary p {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          color: #2d3436;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .analysis-card {
          padding: 20px;
          background: white;
          border-radius: 12px;
        }

        .analysis-card.strengths {
          border-left: 4px solid #00b894;
        }

        .analysis-card.improvements {
          border-left: 4px solid #fdcb6e;
        }

        .analysis-card h4 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin: 0 0 12px 0;
        }

        .analysis-card ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .analysis-card li {
          position: relative;
          padding-left: 12px;
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.5;
          color: #636e72;
        }

        .analysis-card li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
        }

        .recommendations {
          padding: 20px;
          background: white;
          border-radius: 12px;
        }

        .recommendations h4 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin: 0 0 16px 0;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .rec-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #667eea;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .rec-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
          color: #2d3436;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          color: #667eea;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0;
        }

        /* 캘린더 스타일 */
        .calendar-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .month-nav {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s;
        }

        .month-nav:hover {
          background: #f1f3f5;
          border-color: #667eea;
          color: #667eea;
        }

        .month-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3436;
          margin: 0;
        }

        .calendar-grid {
          border: 1px solid #e9ecef;
          border-radius: 12px;
          overflow: hidden;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .day-label {
          padding: 12px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: #636e72;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #f1f3f5;
          border-bottom: 1px solid #f1f3f5;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .calendar-day:nth-child(7n) {
          border-right: none;
        }

        .calendar-day.empty {
          background: #fafafa;
          cursor: default;
        }

        .calendar-day:not(.empty):hover {
          background: #f8f9fa;
        }

        .calendar-day.has-meals {
          background: #e8f5e9;
        }

        .calendar-day.selected {
          background: #667eea;
          color: white;
        }

        .day-number {
          font-size: 14px;
          font-weight: 500;
        }

        .meal-dot {
          position: absolute;
          bottom: 4px;
          font-size: 20px;
          color: #00b894;
        }

        .calendar-day.selected .meal-dot {
          color: white;
        }

        .selected-date-meals {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .selected-date-meals h4 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin: 0 0 16px 0;
        }

        .meal-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meal-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .meal-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meal-name {
          font-size: 15px;
          font-weight: 600;
          color: #2d3436;
        }

        .meal-calories {
          font-size: 13px;
          color: #636e72;
        }

        .meal-rating {
          font-size: 20px;
        }

        /* 트렌드 차트 */
        .trend-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 200px;
          padding: 20px 0;
          gap: 8px;
        }

        .trend-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .trend-bar-wrapper {
          width: 100%;
          height: 160px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .trend-bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 8px;
          min-height: 20px;
          transition: all 0.3s;
        }

        .trend-bar:hover {
          opacity: 0.8;
        }

        .trend-value {
          font-size: 11px;
          font-weight: 600;
          color: white;
        }

        .trend-label {
          font-size: 12px;
          font-weight: 500;
          color: #636e72;
        }

        .nutrition-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: center;
        }

        .summary-label {
          font-size: 13px;
          color: #636e72;
        }

        .summary-value {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
        }

        /* 개인화 추천 */
        .favorite-stats {
          margin-bottom: 24px;
        }

        .stats-text {
          font-size: 16px;
          color: #2d3436;
          margin: 0 0 16px 0;
        }

        .favorite-ingredients {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ingredients-label {
          font-size: 14px;
          color: #636e72;
        }

        .ingredient-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ingredient-tag {
          padding: 6px 12px;
          background: #ffe5e5;
          color: #d63031;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .recommendation-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .recommendation-card {
          padding: 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          text-align: center;
        }

        .card-emoji {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .recommendation-card h4 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin: 0 0 8px 0;
        }

        .card-reason {
          font-size: 13px;
          color: #636e72;
          margin: 0 0 12px 0;
        }

        .card-nutrition {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: #636e72;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          color: #2d3436;
        }

        .empty-state p {
          color: #636e72;
          margin: 0;
        }

        @media (max-width: 768px) {
          .nutrition-summary {
            grid-template-columns: 1fr;
          }

          .recommendation-cards {
            grid-template-columns: 1fr;
          }

          .trend-chart {
            height: 150px;
          }

          .trend-bar-wrapper {
            height: 120px;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
