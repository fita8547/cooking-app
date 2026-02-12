import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import IngredientInputForm from './IngredientInputForm';
import RecipeDisplay from './RecipeDisplay';
import { fetchRecipeRecommendations, getHealthProfile } from '../services/api';
import { recognizeIngredients } from '../services/openai';

export default function RecipeRecommendationPage({ user, onBack, initialIngredients = [] }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [recipes, setRecipes] = useState([]);
  const [healthProfile, setHealthProfile] = useState(null);
  const [nutritionTargets, setNutritionTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 건강 프로필 로드
  useEffect(() => {
    loadHealthProfile();
  }, []);

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
      const result = await fetchRecipeRecommendations(
        submittedIngredients,
        healthProfile,
        user?.id
      );

      // 레시피에 matchType 추가
      const processedRecipes = [
        ...result.exactMatches.map(r => ({ ...r, matchType: 'exact' })),
        ...result.extendedMatches.map(r => ({ ...r, matchType: 'extended' }))
      ];

      setRecipes(processedRecipes);
      setNutritionTargets(result.nutritionTargets);
    } catch (err) {
      console.error('레시피 추천 실패:', err);
      setError(err.message || '레시피 추천 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecipes([]);
    setError(null);
    setHasSearched(false);
  };

  return (
    <div className="recipe-recommendation-page">
      <header className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          뒤로
        </button>
        <h1 className="page-title">레시피 추천</h1>
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
          />

          {healthProfile && (
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
            <Loader2 size={48} className="spinning" />
            <h3>레시피를 찾고 있습니다...</h3>
            <p>잠시만 기다려주세요</p>
          </div>
        )}

        {!loading && hasSearched && recipes.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <div>
                <h2>추천 레시피</h2>
                <p>{recipes.length}개의 레시피를 찾았습니다</p>
              </div>
              <button onClick={handleReset} className="btn-new-search">
                새로 검색
              </button>
            </div>

            <RecipeDisplay recipes={recipes} userTargets={nutritionTargets} />
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

        .loading-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 24px 0 8px;
        }

        .loading-section p {
          font-size: 16px;
          color: #636e72;
          margin: 0;
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
        }
      `}</style>
    </div>
  );
}
