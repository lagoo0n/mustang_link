import { useState } from 'react';
import { motion } from 'motion/react';
import rideshare from '../ridshare.png';
import lost from '../lost.png';
import social from '../social.png';
import opportunity from '../oppurtunity.png';
import FeedView from './FeedView';

const actions = [
  { id: 'rideshare', label: 'Ride Share', img: rideshare },
  { id: 'lost', label: 'Lost & Found', img: lost },
  { id: 'social', label: 'Social', img: social },
  { id: 'opportunities', label: 'Oppurtunities', img: opportunity },
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
    <div className="grid grid-cols-2 gap-3 px-14 pt-8 pb-4">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full"
          onClick={() => setActiveCategory({ id: action.id, label: action.label })}
        >
          <div
            className="bg-[#8B8B8B] rounded-[20px] shadow-md p-3 flex flex-col justify-between w-full"
            style={{ aspectRatio: '1 / 1' }}
          >
            <div className="flex-1 flex items-center justify-center min-h-0">
              <img src={action.img} alt={action.label} className="object-contain w-3/5" style={{ height: '50%' }} />
            </div>
            <span className="text-[16px] font-bold text-black text-center whitespace-pre-line leading-tight w-full shrink-0">
              {action.label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
