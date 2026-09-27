import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'The telegraph operator refused your message. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16 pb-40">
      <div className="record-sleeve rounded-lg p-8">
        <p className="typeline text-center mb-1">MEMBERS ONLY · APPLY AT THE COUNTER</p>
        <h1 className="font-display font-black text-3xl text-center mb-6">
          {mode === 'login' ? 'Welcome Back' : 'Join the Society'}
        </h1>

        {error && (
          <p className="bg-oxblood/10 border border-oxblood text-oxblood font-mono text-xs rounded p-3 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="typeline">USERNAME</span>
              <input
                name="username" value={form.username} onChange={onChange} required minLength={3}
                className="w-full mt-1 bg-parchment border border-sepia/40 rounded px-3 py-2 focus:outline-none focus:border-gold"
              />
            </label>
          )}
          <label className="block">
            <span className="typeline">EMAIL</span>
            <input
              type="email" name="email" value={form.email} onChange={onChange} required
              className="w-full mt-1 bg-parchment border border-sepia/40 rounded px-3 py-2 focus:outline-none focus:border-gold"
            />
          </label>
          <label className="block">
            <span className="typeline">PASSWORD</span>
            <input
              type="password" name="password" value={form.password} onChange={onChange} required minLength={6}
              className="w-full mt-1 bg-parchment border border-sepia/40 rounded px-3 py-2 focus:outline-none focus:border-gold"
            />
          </label>

          <button type="submit" disabled={busy} className="btn-primary w-full text-center">
            {busy ? 'WAITING ON THE OPERATOR…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center typeline mt-5">
          {mode === 'login' ? 'New to the archive? ' : 'Already a member? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="text-oxblood underline"
          >
            {mode === 'login' ? 'Register here' : 'Sign in'}
          </button>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="font-mono text-xs text-sepia hover:text-oxblood">← back to the stacks</Link>
        </p>
      </div>
    </main>
  );
}
