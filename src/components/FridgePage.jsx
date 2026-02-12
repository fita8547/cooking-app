import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Plus, Trash2, Loader2, X } from 'lucide-react';
import { recognizeIngredients } from '../services/openai';

// 재료 카테고리별 이모지 매핑
const INGREDIENT_EMOJIS = {
  // 채소
  '양파': '🧅', '당근': '🥕', '감자': '🥔', '고구마': '🍠', '브로콜리': '🥦',
  '양배추': '🥬', '상추': '🥬', '배추': '🥬', '시금치': '🥬', '깻잎': '🌿',
  '토마토': '🍅', '오이': '🥒', '가지': '🍆', '호박': '🎃', '파': '🌱',
  '대파': '🌱', '마늘': '🧄', '생강': '🫚', '고추': '🌶️', '피망': '🫑',
  
  // 육류
  '소고기': '🥩', '돼지고기': '🥩', '닭고기': '🍗', '닭가슴살': '🍗',
  '삼겹살': '🥓', '베이컨': '🥓', '소시지': '🌭', '햄': '🍖',
  
  // 해산물
  '생선': '🐟', '연어': '🐟', '고등어': '🐟', '참치': '🐟',
  '새우': '🦐', '오징어': '🦑', '조개': '🦪', '게': '🦀',
  
  // 유제품
  '우유': '🥛', '치즈': '🧀', '버터': '🧈', '요거트': '🥛', '계란': '🥚',
  
  // 과일
  '사과': '🍎', '바나나': '🍌', '딸기': '🍓', '포도': '🍇', '수박': '🍉',
  '오렌지': '🍊', '레몬': '🍋', '복숭아': '🍑', '배': '🍐', '키위': '🥝',
  
  // 곡물/면
  '쌀': '🌾', '밥': '🍚', '빵': '🍞', '면': '🍜', '라면': '🍜',
  '파스타': '🍝', '국수': '🍜',
  
  // 기타
  '두부': '🧊', '김치': '🥬', '된장': '🥫', '고추장': '🥫', '간장': '🥫',
  '참기름': '🫗', '식용유': '🫗', '설탕': '🧂', '소금': '🧂',
};

const getIngredientEmoji = (name) => {
  // 정확한 매칭
  if (INGREDIENT_EMOJIS[name]) return INGREDIENT_EMOJIS[name];
  
  // 부분 매칭
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (name.includes(key) || key.includes(name)) {
      return emoji;
    }
  }
  
  return '🥘'; // 기본 이모지
};

export default function FridgePage({ user, onBack, onNavigateToRecommend }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('fridge'); // 'fridge' or 'freezer'
  const [isDragging, setIsDragging] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/ingredients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.ingredients || []);
      }
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/ingredients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newIngredient.trim(),
          category: selectedCategory
        })
      });

      if (response.ok) {
        await loadIngredients();
        setNewIngredient('');
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Failed to add ingredient:', err);
      alert('재료 추가에 실패했습니다');
    }
  };

  const handleDeleteIngredient = async (ingredientId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/ingredients/${ingredientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await loadIngredients();
      }
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
      alert('재료 삭제에 실패했습니다');
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setRecognizing(true);

    try {
      const detected = await recognizeIngredients(file);
      
      if (!detected || detected.length === 0) {
        alert('재료를 인식하지 못했습니다. 다른 이미지를 시도해보세요.');
        setRecognizing(false);
        return;
      }

      const ingredientNames = detected
        .filter(item => item.confidence > 0.5)
        .map(item => item.name);
      
      if (ingredientNames.length === 0) {
        alert('신뢰도가 높은 재료를 찾지 못했습니다. 다른 이미지를 시도해보세요.');
        setRecognizing(false);
        return;
      }

      console.log('인식된 재료:', ingredientNames);
      
      // 인식된 재료들을 한번에 추가
      const token = localStorage.getItem('authToken');
      for (const name of ingredientNames) {
        await fetch(`${API_BASE_URL}/ingredients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            category: 'fridge' // 기본적으로 냉장실에 추가
          })
        });
      }
      
      await loadIngredients();
      setShowImageUpload(false);
    } catch (err) {
      console.error('재료 인식 실패:', err);
      alert(err.message || '재료 인식에 실패했습니다');
    } finally {
      setRecognizing(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setShowImageUpload(true);
      handleImageUpload(file);
    }
  };

  const fridgeIngredients = ingredients.filter(ing => ing.category === 'fridge' || !ing.category);
  const freezerIngredients = ingredients.filter(ing => ing.category === 'freezer');

  const handleCookWithIngredients = () => {
    if (ingredients.length === 0) {
      alert('재료를 먼저 추가해주세요');
      return;
    }
    // 재료 목록을 전달하면서 추천 페이지로 이동
    onNavigateToRecommend(ingredients.map(ing => ing.name));
  };

  if (loading) {
    return (
      <div className="fridge-page">
        <div className="loading-container">
          <Loader2 size={48} className="spinning" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fridge-page">
      <header className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          뒤로
        </button>
        <h1 className="page-title">우리집 냉장고</h1>
      </header>

      <div className="page-content">
        <div className="fridge-container">
          {/* 냉장실 */}
          <div className="fridge-section">
            <div className="section-header">
              <span className="section-icon">🚪</span>
              <h2>냉장실</h2>
              <span className="count-badge">{fridgeIngredients.length}개</span>
            </div>
            <div className="ingredients-grid">
              {fridgeIngredients.length === 0 ? (
                <div className="empty-message">
                  <p>냉장실이 비어있어요</p>
                  <p className="hint">재료를 추가해보세요</p>
                </div>
              ) : (
                fridgeIngredients.map((ing) => (
                  <div key={ing._id} className="ingredient-item">
                    <div className="ingredient-emoji">{getIngredientEmoji(ing.name)}</div>
                    <div className="ingredient-name">{ing.name}</div>
                    <button
                      onClick={() => handleDeleteIngredient(ing._id)}
                      className="delete-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 냉동실 */}
          <div className="fridge-section freezer">
            <div className="section-header">
              <span className="section-icon">❄️</span>
              <h2>냉동실</h2>
              <span className="count-badge">{freezerIngredients.length}개</span>
            </div>
            <div className="ingredients-grid">
              {freezerIngredients.length === 0 ? (
                <div className="empty-message">
                  <p>냉동실이 비어있어요</p>
                  <p className="hint">냉동 재료를 추가해보세요</p>
                </div>
              ) : (
                freezerIngredients.map((ing) => (
                  <div key={ing._id} className="ingredient-item">
                    <div className="ingredient-emoji">{getIngredientEmoji(ing.name)}</div>
                    <div className="ingredient-name">{ing.name}</div>
                    <button
                      onClick={() => handleDeleteIngredient(ing._id)}
                      className="delete-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="action-buttons">
          <button onClick={() => setShowImageUpload(true)} className="btn-action">
            <Camera size={20} />
            사진으로 추가
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-action">
            <Plus size={20} />
            직접 입력
          </button>
        </div>

        {ingredients.length > 0 && (
          <button onClick={handleCookWithIngredients} className="btn-cook">
            ✨ 이 재료로 요리하기
          </button>
        )}
      </div>

      {/* 직접 입력 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>재료 추가</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="category-selector">
                <button
                  className={`category-btn ${selectedCategory === 'fridge' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('fridge')}
                >
                  🚪 냉장실
                </button>
                <button
                  className={`category-btn ${selectedCategory === 'freezer' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('freezer')}
                >
                  ❄️ 냉동실
                </button>
              </div>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                placeholder="재료 이름을 입력하세요"
                className="ingredient-input"
                autoFocus
              />
              <button onClick={handleAddIngredient} className="btn-submit">
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 업로드 모달 */}
      {showImageUpload && (
        <div className="modal-overlay" onClick={() => !recognizing && setShowImageUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>냉장고 촬영하기</h3>
              {!recognizing && (
                <button onClick={() => setShowImageUpload(false)} className="modal-close">
                  <X size={24} />
                </button>
              )}
            </div>
            <div 
              className={`upload-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
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
                    {isDragging ? '이미지를 여기에 놓으세요' : '냉장고 사진을 업로드하세요'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '16px' }}>
                    드래그 앤 드롭 또는 클릭하여 업로드
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileInputChange}
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
        .fridge-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%);
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
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .spinning {
          animation: spin 1s linear infinite;
          color: #667eea;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fridge-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        .fridge-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 3px solid #e3f2fd;
        }

        .fridge-section.freezer {
          border-color: #e1f5fe;
          background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f3f5;
        }

        .section-icon {
          font-size: 28px;
        }

        .section-header h2 {
          flex: 1;
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0;
        }

        .count-badge {
          padding: 4px 12px;
          background: #667eea;
          color: white;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .ingredients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 16px;
          min-height: 120px;
        }

        .ingredient-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: #f8f9fa;
          border-radius: 16px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .ingredient-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .ingredient-emoji {
          font-size: 40px;
          line-height: 1;
        }

        .ingredient-name {
          font-size: 13px;
          font-weight: 600;
          color: #2d3436;
          text-align: center;
          word-break: keep-all;
        }

        .delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .ingredient-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          background: #d63031;
        }

        .empty-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 20px;
          color: #636e72;
        }

        .empty-message p {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .empty-message .hint {
          font-size: 14px;
          color: #b2bec3;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: white;
          border: 2px solid #667eea;
          border-radius: 12px;
          color: #667eea;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action:hover {
          background: #667eea;
          color: white;
        }

        .btn-cook {
          width: 100%;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .btn-cook:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
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
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f1f3f5;
          color: #2d3436;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .category-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .category-btn {
          padding: 12px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-btn.active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .ingredient-input {
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .ingredient-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .btn-submit {
          padding: 14px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-submit:hover {
          background: #5568d3;
        }

        .upload-area {
          text-align: center;
          padding: 60px 20px;
          border: 2px dashed #e9ecef;
          border-radius: 12px;
          background: #f8f9fa;
          transition: all 0.3s;
        }

        .upload-area.dragging {
          border-color: #667eea;
          background: #e3f2fd;
          transform: scale(1.02);
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
          .ingredients-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 12px;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
