import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../logo.png';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (!email.endsWith('@calpoly.edu')) {
        setError('Only Cal Poly SLO email addresses are allowed.');
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: {}, emailRedirectTo: undefined },
      });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, username });
        if (profileError) { setError(profileError.message); setLoading(false); return; }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { persistSession: rememberMe },
      });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f9faf8] flex flex-col justify-center px-8 max-w-[430px] mx-auto">

      {/* Logo + title */}
      <div className="mb-10">
        <img src={logo} alt="MustangLink" className="w-14 h-14 object-contain" />
        <h1 className="text-3xl font-semibold text-[#1a1a1a] mt-4 tracking-tight">MustangLink</h1>
        <p className="text-sm text-[#1a1a1a]/40 mt-1">The Cal Poly SLO student network.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="w-full bg-white border border-[#e5e7e5] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/30 outline-none focus:border-[#154734] transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              placeholder="you@calpoly.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-[#e5e7e5] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/30 outline-none focus:border-[#154734] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-[#e5e7e5] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/30 outline-none focus:border-[#154734] transition-colors"
            />

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    rememberMe ? 'bg-[#154734] border-[#154734]' : 'bg-white border-[#d0d0d0]'
                  }`}
                >
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-[#1a1a1a]/50 font-medium">Remember me</span>
              </label>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-500 text-xs px-1">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#154734] text-white font-medium rounded-xl py-3 text-sm mt-1 hover:bg-[#1a5c42] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  One sec...
                </span>
              ) : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-[#1a1a1a]/40 mt-6 text-center">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-[#154734] font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
    </div>
  );
}
