import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Register({ onSwitch }) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a05] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-base font-bold shadow-lg shadow-amber-500/25 text-black">S</div>
          <span className="text-xl font-semibold tracking-tight text-white">Spendr</span>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Create account</h2>
          <p className="text-sm text-white/30 mb-7">Start tracking your finances</p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest block mb-2">Full Name</label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
                type="text"
                placeholder="Faiz Ahmad"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest block mb-2">Email</label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest block mb-2">Password</label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-amber-500/20 mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/25 mt-6">
          Already have an account?{' '}
          <span className="text-amber-400 hover:text-amber-300 cursor-pointer transition-colors" onClick={onSwitch}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}