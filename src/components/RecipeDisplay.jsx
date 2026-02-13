import React from 'react';
import { Clock, Flame, Activity, ChefHat, AlertCircle } from 'lucide-react';

export default function RecipeDisplay({ recipes, userTargets, onStartCooking }) {
  const exactMatches = recipes.filter(r => r.matchType === 'exact');
  const extendedMatches = recipes.filter(r => r.matchType === 'extended');

  const RecipeCard = ({ recipe }) => {
    const isExact = recipe.matchType === 'exact';
    
    return (
      <div 
        className={`recipe-card ${isExact ? 'exact-match' : 'extended-match'}`}
        onClick={() => onStartCooking && onStartCooking(recipe)}
      >
        <div className="recipe-header">
          <div className="recipe-emoji">{recipe.image || '🍽️'}</div>
          <div className="recipe-title-section">
            <h3 className="recipe-name">{recipe.name}</h3>
            <span className={`match-badge ${isExact ? 'exact' : 'extended'}`}>
              {isExact ? '✓ 보유 재료로 가능' : '+ 추가 재료 필요'}
            </span>
          </div>
        </div>

        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}

        <div className="recipe-meta">
          {recipe.cookingTime && (
            <div className="meta-item">
              <Clock size={16} />
              <span>{recipe.cookingTime}분</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="meta-item">
              <ChefHat size={16} />
              <span>{recipe.difficulty}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="meta-item">
              <Activity size={16} />
              <span>{recipe.servings}인분</span>
            </div>
          )}
        </div>

        <div className="ingredients-section">
          <h4>재료</h4>
          <div className="ingredients-list">
            {recipe.ingredients?.map((ing, idx) => (
              <div
                key={idx}
                className={`ingredient-item ${
                  recipe.matchedIngredients?.includes(ing.name || ing) ? 'available' : 'missing'
                }`}
              >
                <span className="ingredient-bullet">
                  {recipe.matchedIngredients?.includes(ing.name || ing) ? '✓' : '○'}
                </span>
                <span className="ingredient-name">
                  {typeof ing === 'string' ? ing : `${ing.name} ${ing.amount || ''} ${ing.unit || ''}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
          <div className="missing-section">
            <AlertCircle size={16} />
            <span>추가 필요: {recipe.missingIngredients.join(', ')}</span>
          </div>
        )}

        <div className="nutrition-section">
          <h4>영양 정보</h4>
          <div className="nutrition-grid">
            <div className="nutrition-item">
              <Flame size={16} />
              <div>
                <div className="nutrition-value">{recipe.nutrition?.calories || 0}</div>
                <div className="nutrition-label">칼로리</div>
              </div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-icon">P</div>
              <div>
                <div className="nutrition-value">{recipe.nutrition?.protein || 0}g</div>
                <div className="nutrition-label">단백질</div>
              </div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-icon">C</div>
              <div>
                <div className="nutrition-value">{recipe.nutrition?.carbs || 0}g</div>
                <div className="nutrition-label">탄수화물</div>
              </div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-icon">F</div>
              <div>
                <div className="nutrition-value">{recipe.nutrition?.fat || 0}g</div>
                <div className="nutrition-label">지방</div>
              </div>
            </div>
          </div>

          {userTargets && (
            <div className="nutrition-comparison">
              <div className="comparison-label">목표 대비</div>
              <div className="comparison-bars">
                {recipe.nutrition?.calories && (
                  <div className="comparison-item">
                    <span>칼로리</span>
                    <div className="comparison-bar">
                      <div
                        className="comparison-fill"
                        style={{
                          width: `${Math.min((recipe.nutrition.calories / userTargets.calories) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="comparison-percent">
                      {Math.round((recipe.nutrition.calories / userTargets.calories) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {recipe.rationale && (
          <div className="rationale-section">
            <div className="rationale-icon">💡</div>
            <p className="rationale-text">{recipe.rationale}</p>
          </div>
        )}

        <button 
          className="btn-start-cooking"
          onClick={(e) => {
            e.stopPropagation(); // 카드 클릭 이벤트와 중복 방지
            onStartCooking && onStartCooking(recipe);
          }}
        >
          <span className="btn-icon">👨‍🍳</span>
          <span>요리 시작하기</span>
        </button>
      </div>
    );
  };

  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <ChefHat size={64} style={{ color: '#dfe6e9' }} />
        <h3>추천 가능한 레시피가 없습니다</h3>
        <p>다른 재료를 추가하거나 조건을 변경해보세요</p>
      </div>
    );
  }

  return (
    <div className="recipe-display">
      {exactMatches.length > 0 && (
        <div className="recipe-section">
          <h2 className="section-title">
            <span className="title-icon">✓</span>
            보유 재료로 만들 수 있는 요리 ({exactMatches.length})
          </h2>
          <div className="recipe-grid">
            {exactMatches.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {extendedMatches.length > 0 && (
        <div className="recipe-section">
          <h2 className="section-title">
            <span className="title-icon">+</span>
            추가 재료로 만들 수 있는 요리 ({extendedMatches.length})
          </h2>
          <div className="recipe-grid">
            {extendedMatches.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .recipe-display {
          width: 100%;
        }

        .recipe-section {
          margin-bottom: 40px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 24px;
        }

        .title-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          font-size: 18px;
        }

        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .recipe-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #e9ecef;
          transition: all 0.2s;
          cursor: pointer;
        }

        .recipe-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .recipe-card.exact-match {
          border-color: #00b894;
        }

        .recipe-card.extended-match {
          border-color: #fdcb6e;
        }

        .recipe-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .recipe-emoji {
          font-size: 48px;
          line-height: 1;
        }

        .recipe-title-section {
          flex: 1;
        }

        .recipe-name {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 8px 0;
        }

        .match-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .match-badge.exact {
          background: #d5f4e6;
          color: #00b894;
        }

        .match-badge.extended {
          background: #ffeaa7;
          color: #fdcb6e;
        }

        .recipe-description {
          color: #636e72;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .recipe-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #636e72;
          font-size: 14px;
        }

        .ingredients-section {
          margin-bottom: 20px;
        }

        .ingredients-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin: 0 0 12px 0;
        }

        .ingredients-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ingredient-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .ingredient-item.available {
          color: #00b894;
        }

        .ingredient-item.missing {
          color: #636e72;
        }

        .ingredient-bullet {
          font-weight: 600;
        }

        .missing-section {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fff5e6;
          border-radius: 8px;
          color: #e17055;
          font-size: 13px;
          margin-bottom: 20px;
        }

        .nutrition-section {
          margin-bottom: 20px;
        }

        .nutrition-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin: 0 0 12px 0;
        }

        .nutrition-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .nutrition-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .nutrition-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #667eea;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
        }

        .nutrition-value {
          font-size: 16px;
          font-weight: 700;
          color: #2d3436;
        }

        .nutrition-label {
          font-size: 11px;
          color: #636e72;
        }

        .nutrition-comparison {
          padding: 12px;
          background: #f1f3f5;
          border-radius: 8px;
        }

        .comparison-label {
          font-size: 12px;
          font-weight: 600;
          color: #636e72;
          margin-bottom: 8px;
        }

        .comparison-item {
          display: grid;
          grid-template-columns: 60px 1fr 50px;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .comparison-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .comparison-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
        }

        .comparison-percent {
          text-align: right;
          font-weight: 600;
          color: #667eea;
        }

        .rationale-section {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .rationale-icon {
          font-size: 20px;
          line-height: 1;
        }

        .rationale-text {
          flex: 1;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #2d3436;
          font-weight: 500;
        }

        .btn-start-cooking {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: linear-gradient(135deg, var(--primary, #667eea) 0%, var(--primary-dark, #764ba2) 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 16px;
        }

        .btn-start-cooking:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-start-cooking .btn-icon {
          font-size: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
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
          .recipe-grid {
            grid-template-columns: 1fr;
          }

          .nutrition-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
