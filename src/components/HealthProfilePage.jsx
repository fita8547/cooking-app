import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import HealthProfileForm from './HealthProfileForm';
import { createHealthProfile, getHealthProfile } from '../services/api';

export default function HealthProfilePage({ user, onBack, isPremium = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await getHealthProfile();
      if (result.profile) {
        setProfile(result.profile);
        setCalculatedMetrics(result.profile.calculatedMetrics);
      }
    } catch (err) {
      console.log('건강 프로필 없음');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (profileData) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await createHealthProfile(profileData);
      setCalculatedMetrics(result.calculatedMetrics);
      setSuccess(true);
      
      // 3초 후 성공 메시지 숨김
      setTimeout(() => setSuccess(false), 3000);
      
      // 프로필 다시 로드
      await loadProfile();
    } catch (err) {
      console.error('프로필 저장 실패:', err);
      setError(err.message || '프로필 저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="health-profile-page">
        <div className="loading-container">
          <Loader2 size={48} className="spinning" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="health-profile-page">
      <header className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          뒤로
        </button>
        <h1 className="page-title">건강 프로필</h1>
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
        <div className="intro-section">
          <h2>나만의 맞춤 추천을 위해</h2>
          <p>건강 정보를 입력하면 영양 목표에 맞는 레시피를 추천해드립니다</p>
        </div>

        {error && (
          <div className="message error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="message success-message">
            <CheckCircle size={20} />
            <span>건강 프로필이 저장되었습니다!</span>
          </div>
        )}

        <HealthProfileForm
          initialProfile={profile}
          onSubmit={handleSubmit}
        />

        {saving && (
          <div className="saving-overlay">
            <div className="saving-content">
              <Loader2 size={48} className="spinning" />
              <p>저장 중...</p>
            </div>
          </div>
        )}

        {calculatedMetrics && (
          <div className="metrics-section">
            <h3>계산된 영양 목표</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">BMI</div>
                <div className="metric-value">{calculatedMetrics.bmi?.toFixed(1)}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">기초대사량 (BMR)</div>
                <div className="metric-value">{calculatedMetrics.bmr?.toFixed(0)} kcal</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">일일 권장 칼로리 (TDEE)</div>
                <div className="metric-value">{calculatedMetrics.tdee?.toFixed(0)} kcal</div>
              </div>
            </div>

            {calculatedMetrics.macronutrientTargets && (
              <div className="macros-section">
                <h4>일일 영양소 목표</h4>
                <div className="macros-grid">
                  <div className="macro-item">
                    <div className="macro-icon" style={{ background: '#667eea' }}>P</div>
                    <div>
                      <div className="macro-label">단백질</div>
                      <div className="macro-value">
                        {calculatedMetrics.macronutrientTargets.protein?.toFixed(0)}g
                      </div>
                    </div>
                  </div>
                  <div className="macro-item">
                    <div className="macro-icon" style={{ background: '#00b894' }}>C</div>
                    <div>
                      <div className="macro-label">탄수화물</div>
                      <div className="macro-value">
                        {calculatedMetrics.macronutrientTargets.carbs?.toFixed(0)}g
                      </div>
                    </div>
                  </div>
                  <div className="macro-item">
                    <div className="macro-icon" style={{ background: '#fdcb6e' }}>F</div>
                    <div>
                      <div className="macro-label">지방</div>
                      <div className="macro-value">
                        {calculatedMetrics.macronutrientTargets.fat?.toFixed(0)}g
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {calculatedMetrics.targetWeightRange && (
              <div className="weight-range-section">
                <h4>권장 체중 범위</h4>
                <p className="weight-range">
                  {calculatedMetrics.targetWeightRange.min?.toFixed(1)}kg - {' '}
                  {calculatedMetrics.targetWeightRange.max?.toFixed(1)}kg
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .health-profile-page {
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

        .intro-section {
          text-align: center;
          margin-bottom: 40px;
        }

        .intro-section h2 {
          font-size: 28px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 12px 0;
        }

        .intro-section p {
          font-size: 16px;
          color: #636e72;
          margin: 0;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .error-message {
          background: #fff5f5;
          border: 1px solid #ff6b6b;
          color: #d63031;
        }

        .success-message {
          background: #e8f5e9;
          border: 1px solid #00b894;
          color: #00b894;
        }

        .saving-overlay {
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

        .saving-content {
          background: white;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }

        .saving-content p {
          margin-top: 16px;
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
        }

        .metrics-section {
          margin-top: 40px;
          padding: 32px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e9ecef;
        }

        .metrics-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin: 0 0 24px 0;
        }

        .metrics-section h4 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin: 24px 0 16px 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .metric-label {
          font-size: 13px;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
        }

        .macros-section {
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .macros-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .macro-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .macro-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .macro-label {
          font-size: 12px;
          color: #636e72;
          margin-bottom: 4px;
        }

        .macro-value {
          font-size: 18px;
          font-weight: 700;
          color: #2d3436;
        }

        .weight-range-section {
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .weight-range {
          font-size: 20px;
          font-weight: 600;
          color: #667eea;
          margin: 8px 0 0;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .macros-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
