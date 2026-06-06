import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthLayout from '@/components/AuthLayout';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: providers } = useQuery({
    queryKey: ['auth-providers'],
    queryFn: () => authApi.providers(),
    staleTime: 60_000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(email, password, displayName || undefined);
      login(res.token, res.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="注册"
      subtitle="Create an account to save your data"
      footer={
        <span style={{ color: 'var(--text-secondary)' }}>
          已有账号？{' '}
          <Link to="/login" className="underline hover:opacity-70" style={{ color: 'var(--text-primary)' }}>
            登录
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-muted)' }}>
            昵称（可选）
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            className="w-full text-sm bg-transparent border-b py-2 outline-none focus:border-[var(--border-hover)] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-muted)' }}>
            邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full text-sm bg-transparent border-b py-2 outline-none focus:border-[var(--border-hover)] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-muted)' }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full text-sm bg-transparent border-b py-2 outline-none focus:border-[var(--border-hover)] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-muted)' }}>
            确认密码
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full text-sm bg-transparent border-b py-2 outline-none focus:border-[var(--border-hover)] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        {error && (
          <p className="text-sm" style={{ color: '#c44' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.3em] border transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      {providers?.github && (
        <>
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>或</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>
          <a
            href={authApi.githubOAuthUrl()}
            className="block w-full py-3 text-center text-[10px] font-bold uppercase tracking-[0.3em] border transition-opacity hover:opacity-70"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            使用 GitHub 注册
          </a>
        </>
      )}
    </AuthLayout>
  );
}
