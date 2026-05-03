import { useState, FormEvent } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { askAIWithContext, type PostSource } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<PostSource[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResponse('');
    setSources([]);
    const prompt = input;
    setInput('');
    const { answer, sources: postSources } = await askAIWithContext(prompt);
    setResponse(answer);
    setSources(postSources);
    setLoading(false);
  };

  const uniqueCategories = [...new Set(sources.map((s) => s.category))];

  return (
    <div className="px-6 py-4">
      <p className="text-xs text-[#1a1a1a]/35 font-medium mb-4 tracking-wide uppercase">AI Assistant</p>

      <motion.div
        whileHover={{ boxShadow: '0 8px 24px rgba(21,71,52,0.08)', transition: { duration: 0.2 } }}
        className="bg-white border border-[#e5e7e5] rounded-2xl overflow-hidden"
      >
        <AnimatePresence>
          {(loading || response) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 bg-[#154734] rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={10} className="text-white" />
                </div>
                {loading ? (
                  <div className="flex gap-1 pt-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay }}
                        className="w-1.5 h-1.5 bg-[#154734]/40 rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-[#1a1a1a]/70 leading-relaxed">{response}</p>
                    {uniqueCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-[#1a1a1a]/30 font-medium">from feed:</span>
                        {uniqueCategories.map((cat) => (
                          <span
                            key={cat}
                            className="text-xs bg-[#154734]/10 text-[#154734] rounded-full px-2 py-0.5 font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
          <Sparkles size={14} className="text-[#154734]/30 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about campus..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-7 h-7 bg-[#154734] rounded-lg flex items-center justify-center disabled:opacity-20 hover:bg-[#1a5c42] transition-colors shrink-0"
          >
            <ArrowUp size={13} className="text-white" strokeWidth={2.5} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
