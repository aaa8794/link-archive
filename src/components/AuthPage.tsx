import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

type Screen = 'main' | 'signup-form';

const AuthPage: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, checkUsername } = useAuth();
  const [screen, setScreen] = useState<Screen>('main');
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckUsername = async () => {
    if (username.length < 2) return;
    setUsernameStatus('checking');
    const taken = await checkUsername(username);
    setUsernameStatus(taken ? 'taken' : 'available');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(loginUsername, loginPassword);
    if (error) setError('아이디 또는 비밀번호가 올바르지 않아요.');
    setLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (signupPassword !== signupConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('이미 사용 중인 아이디예요.');
      return;
    }
    if (usernameStatus !== 'available') {
      setError('아이디 중복 확인이 필요해요.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, username);
    if (error) {
      setError('회원가입에 실패했어요. 다시 시도해 주세요.');
    } else {
      setMessage('확인 메일을 보냈어요. 메일함을 확인해 주세요!');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError('Google 로그인에 실패했어요.');
  };

  const goBack = () => {
    setScreen('main');
    setError('');
    setMessage('');
    setUsername('');
    setUsernameStatus('idle');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirm('');
  };

  const passwordMismatch = signupConfirm.length > 0 && signupPassword !== signupConfirm;

  if (screen === 'signup-form') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2 className="signup-form-title">회원가입</h2>

          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <input
              type="email"
              placeholder="이메일"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              autoFocus
            />

            <div className="auth-username-wrap">
              <div className="input-with-btn">
                <input
                  type="text"
                  placeholder="아이디 (영문, 숫자, _)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''));
                    setUsernameStatus('idle');
                  }}
                  required
                  minLength={2}
                  maxLength={20}
                />
                <button
                  type="button"
                  className="btn-check-username"
                  onClick={handleCheckUsername}
                  disabled={username.length < 2 || usernameStatus === 'checking'}
                >
                  {usernameStatus === 'checking' ? '...' : '중복확인'}
                </button>
              </div>
              {usernameStatus === 'available' && (
                <span className="username-hint available">✓ 사용 가능해요</span>
              )}
              {usernameStatus === 'taken' && (
                <span className="username-hint taken">이미 사용 중이에요</span>
              )}
            </div>

            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              minLength={6}
            />

            <div className="auth-confirm-wrap">
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                required
              />
              {passwordMismatch && (
                <p className="auth-error-inline">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message">{message}</p>}

            {!message && (
              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking' || passwordMismatch}
              >
                {loading ? '처리 중...' : '회원가입'}
              </button>
            )}
          </form>

          <button className="auth-btn-back" onClick={goBack}>
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/Archivologo.svg" alt="archiv*o" className="auth-logo-img" />
        </div>
        <p className="auth-tagline">영감을 저장하고, 아이디어로 발전시키는 공간</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            회원가입
          </button>
        </div>

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="아이디"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? '처리 중...' : '로그인'}
            </button>
          </form>
        ) : (
          <div className="signup-start">
            {error && <p className="auth-error">{error}</p>}
            <button
              className="auth-btn-primary signup-start-btn"
              onClick={() => { setError(''); setScreen('signup-form'); }}
            >
              회원가입
            </button>
          </div>
        )}

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <button className="auth-btn-google" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
