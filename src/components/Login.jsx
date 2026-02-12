import React, { useState } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');

    // 회원가입 시 비밀번호 확인
    if (mode === 'register') {
      const confirmPassword = formData.get('confirmPassword');
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' 
        ? { email, password }
        : { email, password, name };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인/회원가입 성공
        localStorage.setItem('authToken', data.token);
        onLoginSuccess({
          user: data.user,
          token: data.token,
          onboardingComplete: data.user.onboardingComplete || false
        });
      } else {
        setError(data.error || '요청에 실패했습니다');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <ChefHat size={48} />
          </div>
          <h1>냉장고 요리 도우미</h1>
          <p>AI가 추천하는 맞춤 레시피</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            로그인
          </button>
          <button
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="이름을 입력하세요"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="이메일을 입력하세요"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력하세요"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spinning" />
                처리 중...
              </>
            ) : (
              mode === 'login' ? '로그인' : '회원가입'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <div className="login-footer">
            <button className="btn-link" onClick={() => alert('비밀번호 찾기 기능은 추후 제공될 예정입니다')}>
              비밀번호를 잊으셨나요?
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-primary);
          padding: 20px;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: var(--gradient-primary);
          border-radius: 20px;
          margin-bottom: 16px;
          color: white;
        }

        .login-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #2d3436;
        }

        .login-header p {
          font-size: 14px;
          color: #636e72;
          margin: 0;
        }

        .login-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #f1f3f5;
          padding: 4px;
          border-radius: 8px;
        }

        .tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
        }

        .form-group input {
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .error-message {
          padding: 12px;
          background: #fff5f5;
          border: 1px solid #fc8181;
          border-radius: 8px;
          color: #c53030;
          font-size: 14px;
          text-align: center;
        }

        .btn-submit {
          padding: 14px;
          background: var(--gradient-primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
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

        .login-footer {
          margin-top: 16px;
          text-align: center;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .btn-link:hover {
          color: var(--primary-dark);
        }
      `}</style>
    </div>
  );
}
