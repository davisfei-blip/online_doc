import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  if (user) {
    navigate('/notes');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const success = await login(password);
      if (success) {
        navigate('/notes');
      } else {
        setError('密码错误，请重试');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            访问云笔记
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            请输入密码以继续
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="请输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? '验证中...' : '进入'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
