import React, { useState, useRef } from 'react';
import { Plus, X, Camera } from 'lucide-react';

export default function IngredientInputForm({ onSubmit, onImageUpload, initialIngredients = [], onIngredientsChange, fridgeIngredients = [] }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [currentInput, setCurrentInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef(null);

  // initialIngredients가 변경되면 업데이트
  React.useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);

  const updateIngredients = (newIngredients) => {
    setIngredients(newIngredients);
    if (onIngredientsChange) {
      onIngredientsChange(newIngredients);
    }
  };

  const handleAdd = () => {
    const trimmed = currentInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      const newIngredients = [...ingredients, trimmed];
      updateIngredients(newIngredients);
      setCurrentInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (ingredient) => {
    const newIngredients = ingredients.filter(i => i !== ingredient);
    updateIngredients(newIngredients);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ingredients.length > 0) {
      onSubmit(ingredients);
    }
  };

  const handleClearAll = () => {
    updateIngredients([]);
  };

  return (
    <div className="ingredient-input-form">
      <div className="input-section">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleKeyDown}
            placeholder="재료를 입력하세요 (예: 김치, 돼지고기)"
            className="input-field"
          />
          <button type="button" onClick={handleAdd} className="btn-add">
            <Plus size={20} />
            추가
          </button>
          {onImageUpload && (
            <button type="button" onClick={onImageUpload} className="btn-camera">
              <Camera size={20} />
              촬영
            </button>
          )}
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="ingredients-list">
          <div className="list-header">
            <span>재료 목록 ({ingredients.length}개)</span>
            <button type="button" onClick={handleClearAll} className="btn-clear-all">
              전체 삭제
            </button>
          </div>
          <div className="ingredient-tags">
            {ingredients.map((ing, idx) => (
              <div key={idx} className={`ingredient-tag ${fridgeIngredients.includes(ing) ? 'in-fridge' : ''}`}>
                {fridgeIngredients.includes(ing) && <span className="fridge-icon">🚪</span>}
                {ing}
                <button onClick={() => handleRemove(ing)} className="remove-btn">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {fridgeIngredients.length > 0 && (
        <div className="fridge-ingredients-section">
          <div className="fridge-header">
            <span className="fridge-icon">🚪</span>
            <span>보유한 재료 ({fridgeIngredients.length}개)</span>
          </div>
          <div className="fridge-tags">
            {fridgeIngredients.map((ing, idx) => (
              <div 
                key={idx} 
                className={`fridge-tag ${ingredients.includes(ing) ? 'selected' : ''}`}
                onClick={() => {
                  if (!ingredients.includes(ing)) {
                    const newIngredients = [...ingredients, ing];
                    updateIngredients(newIngredients);
                  }
                }}
              >
                {ing}
                {ingredients.includes(ing) && <span className="check-icon">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {ingredients.length > 0 && (
        <button onClick={handleSubmit} className="btn-submit">
          레시피 추천받기
        </button>
      )}

      <style jsx>{`
        .ingredient-input-form {
          width: 100%;
        }

        .input-section {
          margin-bottom: 24px;
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        .input-field {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
        }

        .btn-add, .btn-camera {
          padding: 12px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }

        .btn-add:hover, .btn-camera:hover {
          background: #5568d3;
        }

        .btn-camera {
          background: #00b894;
        }

        .btn-camera:hover {
          background: #00a383;
        }

        .ingredients-list {
          margin-bottom: 24px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
          color: #2d3436;
        }

        .btn-clear-all {
          padding: 6px 12px;
          background: transparent;
          color: #d63031;
          border: 1px solid #d63031;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear-all:hover {
          background: #d63031;
          color: white;
        }

        .ingredient-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ingredient-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f1f3f5;
          border-radius: 20px;
          font-size: 14px;
          color: #2d3436;
        }

        .ingredient-tag.in-fridge {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border: 2px solid #00b894;
          font-weight: 600;
        }

        .fridge-icon {
          font-size: 16px;
        }

        .remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: #636e72;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
        }

        .remove-btn:hover {
          background: #2d3436;
        }

        .fridge-ingredients-section {
          margin-bottom: 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #e9ecef;
        }

        .fridge-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
        }

        .fridge-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .fridge-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 20px;
          font-size: 14px;
          color: #2d3436;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fridge-tag:hover {
          border-color: var(--primary, #667eea);
          background: #f1f3f5;
        }

        .fridge-tag.selected {
          background: linear-gradient(135deg, var(--primary, #667eea) 0%, var(--primary-dark, #764ba2) 100%);
          border-color: var(--primary, #667eea);
          color: white;
          font-weight: 600;
        }

        .check-icon {
          font-size: 12px;
          font-weight: 700;
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
