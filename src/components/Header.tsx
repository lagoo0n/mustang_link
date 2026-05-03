import logo from '../logo.png';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 pt-8 pb-4">
      <div className="flex items-center gap-2.5">
        <img src={logo} alt="MustangLink" className="w-9 h-9 object-contain" />
        <div>
          <h1 className="text-[15px] font-semibold text-[#154734] leading-none tracking-tight">MustangLink</h1>
          <p className="text-[10px] text-[#154734]/40 mt-0.5 tracking-wide">Cal Poly SLO</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile && (
          <span className="text-xs text-[#154734]/50 font-medium">@{profile.username}</span>
        )}
        <button
          onClick={signOut}
          className="text-xs text-[#154734]/50 hover:text-[#154734] transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
