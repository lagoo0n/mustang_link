import { useState, FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { askAI } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResponse('');
    const aiResponse = await askAI(input);
    setResponse(aiResponse || "No response");
    setLoading(false);
  };

  return (
    <div className="px-14 py-2">
      <div className="bg-[#8B8B8B] rounded-[20px] p-5 min-h-[120px] flex flex-col gap-2 relative shadow-md">
        <div className="flex items-center gap-2 text-black font-black text-lg">
          AI Assistant <Sparkles size={20} fill="black" />
        </div>
        
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="type here ..."
            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-[#D9D9D9] p-0 text-base font-bold"
          />
        </form>

        <AnimatePresence>
          {(loading || response) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-gray-800 text-sm italic"
            >
              {loading ? (
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-gray-600 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-gray-600 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-gray-600 rounded-full" />
                </div>
              ) : (
                <p className="line-clamp-4">{response}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
