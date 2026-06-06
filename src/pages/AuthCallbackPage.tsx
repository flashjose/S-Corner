import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('未收到登录凭证');
      return;
    }

    login(token, {
      id: '',
      email: '',
      displayName: '...',
    });

    authApi.me()
      .then((user) => {
        login(token, user);
        navigate('/', { replace: true });
      })
      .catch(() => {
        useAuthStore.getState().logout();
        setError('登录验证失败，请重试');
      });
  }, [searchParams, login, navigate]);

  return (
    <div
      className="min-h-screen font-['Manrope'] flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm mb-4" style={{ color: '#c44' }}>{error}</p>
            <Link
              to="/login"
              className="text-[10px] font-bold uppercase tracking-[0.3em] underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              返回登录
            </Link>
          </>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse" style={{ color: 'var(--text-muted)' }}>
            正在完成登录...
          </p>
        )}
      </div>
    </div>
  );
}
