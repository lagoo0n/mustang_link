import { Link2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#E9E9E9]">
      <h1 className="text-[32px] font-bold text-[#43A047] tracking-tight flex items-center gap-1">
        MustangLink
        <Link2 className="text-[#43A047] rotate-45 transform -translate-y-0.5" size={32} strokeWidth={3} />
      </h1>
      <div className="flex items-center gap-2">
        {profile && (
          <span className="text-xs font-black text-gray-600">@{profile.username}</span>
        )}
        <button
          onClick={signOut}
          className="w-10 h-10 bg-[#313621] rounded-full flex items-center justify-center"
          title="Sign out"
        >
          <LogOut size={18} className="text-white" />
        </button>
      </div>
    </header>
  );
}
