import React, { useState } from 'react';
import { User, Activity, Heart } from 'lucide-react';

export default function HealthProfileForm({ onSubmit, initialProfile = {} }) {
  const [profile, setProfile] = useState({
    age: initialProfile.age || '',
    gender: initialProfile.gender || '',
    height: initialProfile.height || '',
    weight: initialProfile.weight || '',
    heightUnit: initialProfile.heightUnit || 'cm',
    weightUnit: initialProfile.weightUnit || 'kg',
    allergies: initialProfile.allergies || [],
    dietaryGoal: initialProfile.dietaryGoal || '',
    medicalConditions: initialProfile.medicalConditions || []
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleAddAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !profile.allergies.includes(trimmed)) {
      setProfile({ ...profile, allergies: [...profile.allergies, trimmed] });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergy) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter(a => a !== allergy)
    });
  };

  const handleAllergyKeyDown = (e) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleAddAllergy();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 기본 검증
    if (!profile.age || !profile.gender || !profile.height || !profile.weight || !profile.dietaryGoal) {
      alert('필수 항목을 모두 입력해주세요');
      return;
    }

    if (profile.age <= 0 || profile.height <= 0 || profile.weight <= 0) {
      alert('나이, 키, 몸무게는 0보다 커야 합니다');
      return;
    }

    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="health-profile-form">
      <div className="form-section">
        <div className="section-header">
          <User size={20} />
          <h3>기본 정보</h3>
        </div>
        
        <div className="form-row">
          <div className="form-field">
            <label>나이 *</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => handleChange('age', e.target.value)}
              placeholder="예: 30"
              required
            />
          </div>

          <div className="form-field">
            <label>성별 *</label>
            <select
              value={profile.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              required
            >
              <option value="">선택하세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>키 *</label>
            <div className="input-with-unit">
              <input
                type="number"
                value={profile.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="예: 170"
                required
              />
              <select
                value={profile.heightUnit}
                onChange={(e) => handleChange('heightUnit', e.target.value)}
                className="unit-select"
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>몸무게 *</label>
            <div className="input-with-unit">
              <input
                type="number"
                value={profile.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="예: 70"
                required
              />
              <select
                value={profile.weightUnit}
                onChange={(e) => handleChange('weightUnit', e.target.value)}
                className="unit-select"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <Activity size={20} />
          <h3>건강 목표</h3>
        </div>

        <div className="form-field">
          <label>식단 목표 *</label>
          <select
            value={profile.dietaryGoal}
            onChange={(e) => handleChange('dietaryGoal', e.target.value)}
            required
          >
            <option value="">선택하세요</option>
            <option value="weight_loss">체중 감량</option>
            <option value="weight_gain">체중 증가</option>
            <option value="maintenance">체중 유지</option>
            <option value="muscle_gain">근육 증가</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <Heart size={20} />
          <h3>알레르기 정보</h3>
        </div>

        <div className="form-field">
          <label>알레르기 재료</label>
          <div className="allergy-input-group">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={handleAllergyKeyDown}
              placeholder="예: 우유, 땅콩"
            />
            <button type="button" onClick={handleAddAllergy} className="btn-add-allergy">
              추가
            </button>
          </div>

          {profile.allergies.length > 0 && (
            <div className="allergy-tags">
              {profile.allergies.map((allergy, idx) => (
                <div key={idx} className="allergy-tag">
                  {allergy}
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(allergy)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="btn-submit">
        건강 프로필 저장
      </button>

      <style jsx>{`
        .health-profile-form {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #667eea;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-field {
          margin-bottom: 16px;
        }

        .form-field:last-child {
          margin-bottom: 0;
        }

        .form-field label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
        }

        .form-field input,
        .form-field select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-field input:focus,
        .form-field select:focus {
          outline: none;
          border-color: #667eea;
        }

        .input-with-unit {
          display: flex;
          gap: 8px;
        }

        .input-with-unit input {
          flex: 1;
        }

        .unit-select {
          width: 80px;
        }

        .allergy-input-group {
          display: flex;
          gap: 8px;
        }

        .allergy-input-group input {
          flex: 1;
        }

        .btn-add-allergy {
          padding: 12px 20px;
          background: #00b894;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-add-allergy:hover {
          background: #00a383;
        }

        .allergy-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .allergy-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #ffe5e5;
          color: #d63031;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        .remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: #d63031;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: background 0.2s;
        }

        .remove-btn:hover {
          background: #c0392b;
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

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
}
