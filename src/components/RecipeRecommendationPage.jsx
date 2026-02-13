import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import IngredientInputForm from './IngredientInputForm';
import RecipeDisplay from './RecipeDisplay';
import RecipeCookingGuide from './RecipeCookingGuide';
import { fetchRecipeRecommendations, getHealthProfile } from '../services/api';
import { recognizeIngredients } from '../services/openai';

export default function RecipeRecommendationPage({ user, onBack, initialIngredients = [], onNavigateToFridge, onNavigateToHealth, isPremium = false }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [fridgeIngredients, setFridgeIngredients] = useState([]); // 냉장고 재료
  const [showFridgeDropdown, setShowFridgeDropdown] = useState(false); // 드롭다운 표시 여부
  const [recipes, setRecipes] = useState([]);
  const [healthProfile, setHealthProfile] = useState(null);
  const [nutritionTargets, setNutritionTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [matchType, setMatchType] = useState('all'); // 'exact' or 'all'
  const [selectedRecipe, setSelectedRecipe] = useState(null); // 요리 가이드용

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // 건강 프로필 로드
  useEffect(() => {
    loadHealthProfile();
    loadFridgeIngredients();
  }, []);

  // 냉장고 재료 로드
  const loadFridgeIngredients = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/ingredients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ingredientNames = (data.ingredients || []).map(ing => ing.name);
        setFridgeIngredients(ingredientNames);
      }
    } catch (err) {
      console.log('냉장고 재료 로드 실패:', err.message);
    }
  };

  // initialIngredients가 있으면 자동으로 추천 시작
  useEffect(() => {
    if (initialIngredients.length > 0) {
      setIngredients(initialIngredients);
      // 약간의 딜레이 후 자동으로 추천 시작
      setTimeout(() => {
        handleSubmit(initialIngredients);
      }, 500);
    }
  }, [initialIngredients]);

  const loadHealthProfile = async () => {
    try {
      const result = await getHealthProfile();
      if (result.profile) {
        setHealthProfile(result.profile);
      }
    } catch (err) {
      console.log('건강 프로필 없음:', err.message);
    }
  };

  // 건강 프로필이 완전한지 확인
  const isHealthProfileComplete = () => {
    if (!healthProfile) return false;
    return !!(
      healthProfile.age &&
      healthProfile.gender &&
      healthProfile.height &&
      healthProfile.weight
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setRecognizing(true);
    setError(null);

    try {
      const detected = await recognizeIngredients(file);
      const ingredientNames = detected
        .filter(item => item.confidence > 0.5)
        .map(item => item.name);
      
      if (ingredientNames.length === 0) {
        alert('재료를 인식하지 못했습니다. 다른 이미지를 시도해보세요.');
        setRecognizing(false);
        return;
      }

      // 기존 재료와 중복 제거하여 추가
      const newIngredients = [...new Set([...ingredients, ...ingredientNames])];
      setIngredients(newIngredients);
      setShowImageUpload(false);
    } catch (err) {
      console.error('재료 인식 실패:', err);
      setError(err.message);
      alert(err.message || '재료 인식에 실패했습니다');
    } finally {
      setRecognizing(false);
    }
  };

  const handleSubmit = async (submittedIngredients) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // 입력한 재료를 냉장고에 자동 저장
      await saveIngredientsToFridge(submittedIngredients);

      const result = await fetchRecipeRecommendations(
        submittedIngredients,
        healthProfile,
        user?.id
      );

      // 레시피에 matchType 추가
      let processedRecipes = [
        ...result.exactMatches.map(r => ({ ...r, matchType: 'exact' })),
        ...result.extendedMatches.map(r => ({ ...r, matchType: 'extended' }))
      ];

      // matchType 필터 적용
      if (matchType === 'exact') {
        processedRecipes = processedRecipes.filter(r => r.matchType === 'exact');
      }

      setRecipes(processedRecipes);
      setNutritionTargets(result.nutritionTargets);
    } catch (err) {
      console.error('레시피 추천 실패:', err);
      setError(err.message || '레시피 추천 중 오류가 발생했습니다');
    } finally {

  // 재료를 냉장고에 저장하는 함수
  const saveIngredientsToFridge = async (ingredientNames) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // 각 재료를 냉장고에 추가
      for (const name of ingredientNames) {
        // 이미 냉장고에 있는 재료는 스킵
        if (fridgeIngredients.includes(name)) {
          continue;
        }

        await fetch(`${API_BASE_URL}/ingredients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            quantity: 1,
            unit: '개',
            category: 'fridge' // 기본값으로 냉장 설정
          })
        });
      }

      // 냉장고 재료 목록 다시 로드
      await loadFridgeIngredients();
      
      console.log('✅ 재료가 냉장고에 저장되었습니다');
    } catch (err) {
      console.error('냉장고 저장 실패:', err);
      // 에러가 나도 레시피 추천은 계속 진행
    }
  };
      setLoading(false);
    }
  };

  // 재료를 냉장고에 저장
  const saveIngredientsToFridge = async (ingredientNames) => {
    try {
      const token = localStorage.getItem('authToken');
      
      for (const name of ingredientNames) {
        // 이미 냉장고에 있는 재료는 건너뛰기
        if (fridgeIngredients.includes(name)) {
          continue;
        }
        
        await fetch(`${API_BASE_URL}/ingredients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name
            // category는 백엔드에서 자동 분류
          })
        });
      }
      
      // 냉장고 재료 목록 새로고침
      await loadFridgeIngredients();
    } catch (err) {
      console.error('냉장고 저장 실패:', err);
      // 저장 실패해도 추천은 계속 진행
    }
  };

  const handleReset = () => {
    setRecipes([]);
    setError(null);
    setHasSearched(false);
  };

  const handleStartCooking = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseCookingGuide = () => {
    setSelectedRecipe(null);
  };

  const handleCookingComplete = async (recipe, feedback) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // 식단 기록에 저장
      await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipeId: recipe._id || recipe.id,
          recipeName: recipe.name,
          mealType: 'dinner', // 기본값, 나중에 선택 가능하게
          feedback: feedback, // 'like' or 'dislike'
          nutrition: recipe.nutrition,
          ingredients: recipe.ingredients
        })
      });
      
      console.log('식단 기록 저장 완료');
    } catch (err) {
      console.error('식단 기록 저장 실패:', err);
    }
  };

  return (
    <div className="recipe-recommendation-page">
      <header className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          뒤로
        </button>
        <h1 className="page-title">레시피 추천</h1>
        <div className="premium-status-badge">
          {isPremium ? (
            <>
              <span className="status-icon">👑</span>
              <span className="status-text">프리미엄</span>
            </>
          ) : (
            <>
              <span className="status-icon">🆓</span>
              <span className="status-text">무료</span>
            </>
          )}
        </div>
      </header>

      <div className="page-content">
        <div className="input-section">
          <div className="step-intro">
            <h2>어떤 재료가 있나요?</h2>
            <p>냉장고에 있는 재료를 입력하거나 사진을 찍어주세요</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <IngredientInputForm
            initialIngredients={ingredients}
            onSubmit={handleSubmit}
            onImageUpload={() => setShowImageUpload(true)}
            onIngredientsChange={setIngredients}
            fridgeIngredients={fridgeIngredients}
          />

          {/* 재료 매칭 옵션 */}
          <div className="match-type-selector">
            <div className="selector-label">추천 방식</div>
            <div className="selector-buttons">
              <button
                className={`selector-btn ${matchType === 'exact' ? 'active' : ''}`}
                onClick={() => setMatchType('exact')}
              >
                <span className="btn-icon">✓</span>
                <div className="btn-content">
                  <div className="btn-title">보유한 재료로만</div>
                  <div className="btn-desc">추가 구매 없이 바로 요리</div>
                </div>
              </button>
              <button
                className={`selector-btn ${matchType === 'all' ? 'active' : ''}`}
                onClick={() => setMatchType('all')}
              >
                <span className="btn-icon">+</span>
                <div className="btn-content">
                  <div className="btn-title">추가 재료 포함</div>
                  <div className="btn-desc">더 다양한 레시피 추천</div>
                </div>
              </button>
            </div>
          </div>

          {/* 상태 정보 카드 */}
          <div className="status-cards">
            {/* 냉장고 재료 카드 */}
            <div className="status-card-wrapper">
              <button 
                className="status-card fridge-card"
                onClick={() => setShowFridgeDropdown(!showFridgeDropdown)}
              >
                <div className="card-icon">🚪</div>
                <div className="card-content">
                  <div className="card-title">냉장고 재료 {fridgeIngredients.length}개</div>
                  <div className="card-desc">{showFridgeDropdown ? '목록 닫기 ▲' : '목록 보기 ▼'}</div>
                </div>
              </button>
              
              {showFridgeDropdown && fridgeIngredients.length > 0 && (
                <div className="fridge-dropdown">
                  <div className="dropdown-header">
                    <span>보유 재료 목록</span>
                    <button 
                      className="btn-manage-fridge"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToFridge();
                      }}
                    >
                      관리하기 →
                    </button>
                  </div>
                  <div className="dropdown-list">
                    {fridgeIngredients.map((ingredient, idx) => (
                      <div key={idx} className="dropdown-item">
                        <span className="item-bullet">•</span>
                        <span className="item-name">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 건강 프로필 카드 */}
            <button 
              className={`status-card health-card ${isHealthProfileComplete() ? 'complete' : 'incomplete'}`}
              onClick={onNavigateToHealth}
            >
              <div className="card-icon">{isHealthProfileComplete() ? '✓' : '!'}</div>
              <div className="card-content">
                <div className="card-title">
                  {isHealthProfileComplete() ? '맞춤 영양 목표 설정 완료' : '건강기록 필요'}
                </div>
                <div className="card-desc">
                  {isHealthProfileComplete() ? '클릭하여 수정하기' : '클릭하여 작성하기'}
                </div>
              </div>
            </button>
          </div>

          {healthProfile && isHealthProfileComplete() && (
            <div className="health-info-notice">
              <div className="notice-icon">✓</div>
              <div>
                <div className="notice-title">건강 프로필이 등록되어 있습니다</div>
                <div className="notice-text">
                  맞춤형 영양 정보를 기반으로 추천해드립니다
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-section">
            <div className="ai-badge">
              <span className="ai-icon">🤖</span>
              <span className="ai-text">AI 추천</span>
            </div>
            <Loader2 size={48} className="spinning" />
            <h3>AI가 {user?.name || '회원'}님의 재료와 건강기록을 바탕으로 추천 중입니다</h3>
            <p>맞춤형 레시피를 생성하고 있어요</p>
            <div className="loading-steps">
              <div className="loading-step">
                <span className="step-dot"></span>
                <span>재료 분석 중...</span>
              </div>
              <div className="loading-step">
                <span className="step-dot"></span>
                <span>건강 정보 확인 중...</span>
              </div>
              <div className="loading-step">
                <span className="step-dot"></span>
                <span>최적의 레시피 생성 중...</span>
              </div>
            </div>
          </div>
        )}

        {!loading && hasSearched && recipes.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <div>
                <div className="ai-result-badge">
                  <span className="badge-icon">🤖</span>
                  <span>AI 맞춤 추천</span>
                </div>
                <h2>추천 레시피</h2>
                <p>{recipes.length}개의 레시피를 찾았습니다</p>
              </div>
              <button onClick={handleReset} className="btn-new-search">
                새로 검색
              </button>
            </div>

            <RecipeDisplay 
              recipes={recipes} 
              userTargets={nutritionTargets}
              onStartCooking={handleStartCooking}
            />
          </div>
        )}

        {!loading && hasSearched && recipes.length === 0 && (
          <div className="no-results">
            <AlertCircle size={48} />
            <h3>추천할 레시피가 없습니다</h3>
            <p>다른 재료를 추가해보세요</p>
          </div>
        )}
      </div>

      {/* 이미지 업로드 모달 */}
      {showImageUpload && (
        <div className="modal-overlay" onClick={() => !recognizing && setShowImageUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>냉장고 촬영하기</h3>
              {!recognizing && (
                <button onClick={() => setShowImageUpload(false)} className="modal-close">
                  ×
                </button>
              )}
            </div>
            <div className="upload-area">
              {recognizing ? (
                <>
                  <Loader2 size={64} className="spinning" />
                  <p style={{ marginTop: '16px', fontWeight: '600' }}>
                    AI가 재료를 인식하는 중...
                  </p>
                </>
              ) : (
                <>
                  <div className="upload-icon">📷</div>
                  <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    냉장고 사진을 업로드하세요
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

      {/* 요리 가이드 모달 */}
      {selectedRecipe && (
        <RecipeCookingGuide 
          recipe={selectedRecipe}
          onClose={handleCloseCookingGuide}
          onComplete={handleCookingComplete}
        />
      )}

      <style jsx>{`
        .recipe-recommendation-page {
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

        .premium-status-badge {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .premium-status-badge .status-icon {
          font-size: 16px;
        }

        .premium-status-badge:has(.status-text:contains("프리미엄")) {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #2d3436;
        }

        .premium-status-badge:has(.status-text:contains("무료")) {
          background: #f1f3f5;
          color: #636e72;
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .input-section {
          max-width: 600px;
          margin: 0 auto 60px;
        }

        .step-intro {
          text-align: center;
          margin-bottom: 40px;
        }

        .step-intro h2 {
          font-size: 28px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 12px 0;
        }

        .step-intro p {
          font-size: 16px;
          color: #636e72;
          margin: 0;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #fff5f5;
          border: 1px solid #ff6b6b;
          border-radius: 8px;
          color: #d63031;
          margin-bottom: 24px;
        }

        .health-info-notice {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-radius: 12px;
          margin-top: 24px;
        }

        .match-type-selector {
          margin-top: 24px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .selector-label {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 12px;
        }

        .selector-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .selector-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .selector-btn:hover {
          background: #f1f3f5;
          border-color: var(--primary, #667eea);
        }

        .selector-btn.active {
          background: linear-gradient(135deg, var(--primary, #667eea) 0%, var(--primary-dark, #764ba2) 100%);
          border-color: var(--primary, #667eea);
          color: white;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-size: 18px;
          flex-shrink: 0;
        }

        .selector-btn.active .btn-icon {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-content {
          flex: 1;
        }

        .btn-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .btn-desc {
          font-size: 12px;
          opacity: 0.8;
        }

        .selector-btn:not(.active) .btn-content {
          color: #2d3436;
        }

        .selector-btn:not(.active) .btn-desc {
          color: #636e72;
        }

        .status-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .status-card-wrapper {
          position: relative;
        }

        .status-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .status-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .status-card.fridge-card {
          border-color: #00b894;
        }

        .status-card.fridge-card:hover {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-color: #00b894;
        }

        .fridge-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #00b894;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 10;
          max-height: 300px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-bottom: 1px solid #00b894;
          font-weight: 600;
          color: #2d3436;
        }

        .btn-manage-fridge {
          padding: 6px 12px;
          background: #00b894;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-manage-fridge:hover {
          background: #00a383;
          transform: translateX(2px);
        }

        .dropdown-list {
          padding: 12px;
          overflow-y: auto;
          max-height: 240px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: #f8f9fa;
        }

        .item-bullet {
          color: #00b894;
          font-weight: 700;
        }

        .item-name {
          color: #2d3436;
          font-size: 14px;
        }

        .status-card.health-card.complete {
          border-color: var(--primary, #667eea);
        }

        .status-card.health-card.complete:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: var(--primary, #667eea);
        }

        .status-card.health-card.incomplete {
          border-color: #fdcb6e;
        }

        .status-card.health-card.incomplete:hover {
          background: linear-gradient(135deg, #fff5e6 0%, #ffe0b2 100%);
          border-color: #fdcb6e;
        }

        .card-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 10px;
          font-size: 20px;
          flex-shrink: 0;
        }

        .status-card.fridge-card .card-icon {
          background: #d5f4e6;
        }

        .status-card.health-card.complete .card-icon {
          background: #e3f2fd;
          color: var(--primary, #667eea);
          font-weight: 700;
        }

        .status-card.health-card.incomplete .card-icon {
          background: #fff5e6;
          color: #fdcb6e;
          font-weight: 700;
        }

        .card-content {
          flex: 1;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 12px;
          color: #636e72;
        }

        .notice-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          font-size: 20px;
          flex-shrink: 0;
        }

        .notice-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 4px;
        }

        .notice-text {
          font-size: 14px;
          color: #636e72;
        }

        .loading-section {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          margin-bottom: 40px;
        }

        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--primary, #667eea) 0%, var(--primary-dark, #764ba2) 100%);
          color: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .ai-icon {
          font-size: 18px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .loading-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 24px 0 8px;
          line-height: 1.4;
        }

        .loading-section p {
          font-size: 16px;
          color: #636e72;
          margin: 0 0 32px 0;
        }

        .loading-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 300px;
          margin: 0 auto;
        }

        .loading-step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 14px;
          color: #636e72;
          text-align: left;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          background: var(--primary, #667eea);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .loading-step:nth-child(2) .step-dot {
          animation-delay: 0.3s;
        }

        .loading-step:nth-child(3) .step-dot {
          animation-delay: 0.6s;
        }

        .spinning {
          animation: spin 1s linear infinite;
          color: #667eea;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .results-section {
          width: 100%;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding: 24px;
          background: white;
          border-radius: 16px;
        }

        .ai-result-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, var(--primary, #667eea) 0%, var(--primary-dark, #764ba2) 100%);
          color: white;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .badge-icon {
          font-size: 14px;
        }

        .results-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 8px 0;
        }

        .results-header p {
          font-size: 16px;
          color: #636e72;
          margin: 0;
        }

        .btn-new-search {
          padding: 12px 24px;
          background: white;
          border: 2px solid #667eea;
          border-radius: 8px;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-new-search:hover {
          background: #667eea;
          color: white;
        }

        .no-results {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          color: #636e72;
        }

        .no-results h3 {
          font-size: 20px;
          font-weight: 600;
          color: #2d3436;
          margin: 16px 0 8px;
        }

        .no-results p {
          font-size: 16px;
          margin: 0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
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
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 50%;
          color: #636e72;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f1f3f5;
          color: #2d3436;
        }

        .upload-area {
          text-align: center;
          padding: 60px 20px;
          border: 2px dashed #e9ecef;
          border-radius: 12px;
          background: #f8f9fa;
        }

        .upload-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .btn-upload {
          display: inline-block;
          padding: 12px 32px;
          background: #667eea;
          color: white;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-upload:hover {
          background: #5568d3;
        }

        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            gap: 16px;
          }

          .btn-new-search {
            width: 100%;
          }

          .selector-buttons {
            grid-template-columns: 1fr;
          }

          .status-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
