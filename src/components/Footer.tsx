import { useState, useEffect } from 'react';
import logo from '../logo.png';

const NAV_LINKS = [
  { id: 'rideshare',      label: 'Ride Share' },
  { id: 'lost',           label: 'Lost & Found' },
  { id: 'social',         label: 'Social' },
  { id: 'opportunities',  label: 'Opportunities' },
];

type Props = {
  onNavigate: (cat: { id: string; label: string }) => void;
};

export default function Footer({ onNavigate }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const date = `${String(now.getMonth() + 1).padStart(2, '0')} · ${String(now.getDate()).padStart(2, '0')} · ${String(now.getFullYear()).slice(2)}`;

  return (
    <footer className="px-6 py-8 mt-4 border-t border-[#e5e7e5]">
      <div className="flex justify-between items-start mb-6">
        {/* Left — logo + tagline */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src={logo} alt="MustangLink" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-[#154734]">MustangLink</span>
          </div>
          <p className="text-[11px] text-[#1a1a1a]/30 mt-1">🐴 {time} · San Luis Obispo</p>
        </div>

        {/* Right — links */}
        <div className="flex flex-col gap-1.5 text-right">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate({ id: link.id, label: link.label })}
              className="text-xs text-[#1a1a1a]/35 hover:text-[#154734] transition-colors text-right"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom line */}
      <div className="flex flex-col items-center gap-1 pt-4 border-t border-[#f0f0f0]">
        <p className="text-[11px] text-[#1a1a1a]/25">
          Built by Mustangs, for Mustangs 🌿
        </p>
        <p className="text-[10px] text-[#1a1a1a]/20 tracking-widest uppercase">
          Last updated · {date}
        </p>
      </div>
    </footer>
  );
}
