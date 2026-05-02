import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Link2 } from 'lucide-react';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, username });
        if (profileError) { setError(profileError.message); setLoading(false); return; }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#E9E9E9] flex justify-center">
      <div className="w-full max-w-[480px] bg-[#E9E9E9] min-h-screen flex flex-col px-14 pt-12">
        <h1 className="text-[32px] font-bold text-[#43A047] tracking-tight flex items-center gap-1 mb-8">
          MustangLink
          <Link2 className="text-[#43A047] rotate-45 transform -translate-y-0.5" size={32} strokeWidth={3} />
        </h1>

        <div className="bg-[#8B8B8B] rounded-[20px] p-6 shadow-md">
          <h2 className="text-xl font-black text-black mb-4">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-[#D9D9D9] rounded-[10px] px-4 py-2 text-black font-bold placeholder-gray-500 border-none outline-none"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#D9D9D9] rounded-[10px] px-4 py-2 text-black font-bold placeholder-gray-500 border-none outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-[#D9D9D9] rounded-[10px] px-4 py-2 text-black font-bold placeholder-gray-500 border-none outline-none"
            />

            {error && <p className="text-red-800 text-sm font-bold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#43A047] text-white font-black rounded-[10px] py-2 mt-1 disabled:opacity-50"
            >
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-black mt-4 text-center">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="font-black underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
