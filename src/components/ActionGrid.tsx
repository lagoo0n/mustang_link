import { useState } from 'react';
import { motion } from 'motion/react';
import { Car, Search, Users, Briefcase } from 'lucide-react';
import FeedView from './FeedView';

const actions = [
  { id: 'rideshare',     label: 'Ride Share',    sub: 'Find a ride',        icon: Car,      color: '#154734', bg: '#eef4f0' },
  { id: 'lost',         label: 'Lost & Found',  sub: 'Missing something?', icon: Search,   color: '#1a5c42', bg: '#e8f2ec' },
  { id: 'social',       label: 'Social',        sub: 'Connect up',         icon: Users,    color: '#154734', bg: '#eef4f0' },
  { id: 'opportunities',label: 'Opportunities', sub: 'Jobs & gigs',        icon: Briefcase,color: '#1a5c42', bg: '#e8f2ec' },
];

export default function ActionGrid() {
  const [activeCategory, setActiveCategory] = useState<{ id: string; label: string } | null>(null);

  if (activeCategory) {
    return (
      <FeedView
        category={activeCategory.id}
        label={activeCategory.label}
        onBack={() => setActiveCategory(null)}
      />
    );
  }

  return (
    <div className="px-6 pt-2 pb-2">
      <p className="text-xs text-[#1a1a1a]/35 font-medium mb-4 tracking-wide uppercase">Explore</p>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                y: -4,
                boxShadow: '0 12px 32px rgba(21,71,52,0.12)',
                transition: { duration: 0.2, ease: 'easeOut' }
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveCategory({ id: action.id, label: action.label })}
              className="text-left rounded-2xl p-4 cursor-pointer"
              style={{ background: action.bg, aspectRatio: '1/1' }}
            >
              <div className="flex flex-col justify-between h-full">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${action.color}18` }}
                >
                  <Icon size={17} style={{ color: action.color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight" style={{ color: action.color }}>{action.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: `${action.color}70` }}>{action.sub}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
