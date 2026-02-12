import React, { useState } from 'react';
import { HeartPulse, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function QuickHealthInfo({ user, onComplete, onSkip }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  
  // Quick 입력 필드
  const [allergies, setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [goal, setGoal] = useState('');
  const [preferences, setPreferences] = useState([]);
  
  // 상세 입력 필드
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // 선호 옵션
  const preferenceOptions = [
    { id: 'korean', label: '한식' },
    { id: 'simple', label: '간편식' },
    { id: 'high-protein', label: '고단백' },
    { id: 'low-carb', label: '저탄수화물' },
    { id: 'vegetarian', label: '채식' },
    { id: 'diabetic', label: '당뇨식' },
    { id: 'low-sodium', label: '고혈압식' },
    { id: 'gluten-free', label: '글루텐프리' }
  ];

  // 유효성 검사 함수
  const validateHeight = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 50 && num <= 250;
  };

  const validateWeight = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 10 && num <= 300;
  };

  const validateAge = (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 120;
  };

  const isDetailedFormValid = () => {
    if (!heightCm && !weightKg && !age) return true; // 비어있으면 OK
    
    if (heightCm && !validateHeight(heightCm)) return false;
    if (weightKg && !validateWeight(weightKg)) return false;
    if (age && !validateAge(age)) return false;
    
    return true;
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const togglePreference = (prefId) => {
    if (preferences.includes(prefId)) {
      setPreferences(preferences.filter(p => p !== prefId));
    } else {
      setPreferences([...preferences, prefId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 상세 폼 유효성 검사
    if (!isDetailedFormValid()) {
      setError('입력값이 유효하지 않습니다. 범위를 확인해주세요.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // 입력된 값만 포함
      const payload = {};
      if (allergies.length > 0) payload.allergies = allergies;
      if (goal) payload.goal = goal;
      if (preferences.length > 0) payload.preferences = preferences;
      if (heightCm) payload.heightCm = parseFloat(heightCm);
      if (weightKg) payload.weightKg = parseFloat(weightKg);
      if (age) payload.age = parseInt(age);
      if (gender) payload.gender = gender;

      const response = await fetch(`${API_BASE_URL}/profile/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        onComplete(data);
      } else {
        setError(data.message || '저장에 실패했습니다');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="health-info-container">
      <div className="health-info-card">
        {/* 헤더 */}
        <div className="health-info-header">
          <div className="icon-wrapper">
            <HeartPulse size={40} />
          </div>
          <h1>Quick 건강기록</h1>
          <p className="subtitle">
            더 개인화된 레시피 추천을 원한다면 진행해주세요.<br />
            나중에 입력하는 것도 가능합니다.
          </p>
        </div>

        {/* 에러 배너 */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="health-info-form">
          {/* Quick 입력 필드 */}
          <div className="form-section">
            <label className="field-label">알러지 (선택사항)</label>
            <div className="allergy-input-wrapper">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComposing) {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
                placeholder="예: 우유, 땅콩"
                className="text-input"
              />
              <button type="button" onClick={addAllergy} className="btn-add">
                추가
              </button>
            </div>
            {allergies.length > 0 && (
              <div className="tag-list">
                {allergies.map((allergy, idx) => (
                  <span key={idx} className="tag">
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <label className="field-label">식단 목표 (선택사항)</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="select-input"
            >
              <option value="">선택하세요</option>
              <option value="lose">체중 감량</option>
              <option value="maintain">체중 유지</option>
              <option value="gain">체중 증량</option>
              <option value="health">건강 관리</option>
            </select>
          </div>

          <div className="form-section">
            <label className="field-label">선호 (선택사항)</label>
            <div className="preference-grid">
              {preferenceOptions.map((pref) => (
                <button
                  key={pref.id}
                  type="button"
                  onClick={() => togglePreference(pref.id)}
                  className={`preference-btn ${preferences.includes(pref.id) ? 'selected' : ''}`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 입력 토글 */}
          <button
            type="button"
            onClick={() => setShowDetailedForm(!showDetailedForm)}
            className="toggle-detailed-btn"
          >
            <span>구체적으로 더 작성하기</span>
            {showDetailedForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* 상세 입력 섹션 */}
          {showDetailedForm && (
            <div className="detailed-section">
              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">성별</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="select-input"
                  >
                    <option value="">선택하세요</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">나이</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="예: 30"
                    min="1"
                    max="120"
                    className={`number-input ${age && !validateAge(age) ? 'invalid' : ''}`}
                  />
                  {age && !validateAge(age) && (
                    <span className="field-error">1-120 범위로 입력하세요</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">키 (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="예: 170"
                    min="50"
                    max="250"
                    step="0.1"
                    className={`number-input ${heightCm && !validateHeight(heightCm) ? 'invalid' : ''}`}
                  />
                  {heightCm && !validateHeight(heightCm) && (
                    <span className="field-error">50-250 범위로 입력하세요</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="field-label">체중 (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="예: 70"
                    min="10"
                    max="300"
                    step="0.1"
                    className={`number-input ${weightKg && !validateWeight(weightKg) ? 'invalid' : ''}`}
                  />
                  {weightKg && !validateWeight(weightKg) && (
                    <span className="field-error">10-300 범위로 입력하세요</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 하단 고정 CTA */}
          <div className="cta-sticky">
            <button
              type="button"
              onClick={handleSkip}
              className="btn-skip"
              disabled={loading}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading || !isDetailedFormValid()}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spinning" />
                  저장 중...
                </>
              ) : (
                'SAVE'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .health-info-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-primary);
          padding: 20px;
          padding-bottom: 100px;
        }

        .health-info-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 560px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-height: 85vh;
          overflow-y: auto;
        }

        .health-info-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: var(--gradient-primary);
          border-radius: 16px;
          margin-bottom: 16px;
          color: white;
        }

        .health-info-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #2d3436;
        }

        .subtitle {
          font-size: 14px;
          color: #636e72;
          margin: 0;
          line-height: 1.6;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fff5f5;
          border: 1px solid #fc8181;
          border-radius: 8px;
          color: #c53030;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .health-info-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-label {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 4px;
        }

        .allergy-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .text-input,
        .select-input,
        .number-input {
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .text-input {
          flex: 1;
        }

        .text-input:focus,
        .select-input:focus,
        .number-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .number-input.invalid {
          border-color: #fc8181;
        }

        .select-input {
          width: 100%;
          cursor: pointer;
        }

        .btn-add {
          padding: 12px 20px;
          background: #00b894;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .btn-add:hover {
          background: #00a383;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #ffe5e5;
          color: #d63031;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .tag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: #d63031;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
        }

        .preference-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }

        .preference-btn {
          padding: 10px 16px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preference-btn:hover {
          border-color: var(--primary);
          background: var(--primary-lightest);
        }

        .preference-btn.selected {
          background: var(--gradient-primary);
          border-color: var(--primary);
          color: white;
        }

        .toggle-detailed-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 16px;
          background: transparent;
          border: 2px dashed #e9ecef;
          border-radius: 8px;
          color: var(--primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .toggle-detailed-btn:hover {
          border-color: var(--primary);
          background: var(--primary-lightest);
        }

        .detailed-section {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-top: -8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-error {
          font-size: 12px;
          color: #fc8181;
        }

        .cta-sticky {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #e9ecef;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .btn-skip {
          flex: 1;
          padding: 14px;
          background: transparent;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          color: #636e72;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-skip:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .btn-skip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-save {
          flex: 2;
          padding: 14px;
          background: var(--gradient-primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .health-info-card {
            padding: 24px;
          }

          .preference-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
