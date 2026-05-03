import { useState, useRef, useEffect, FormEvent } from 'react';
import { Sparkles, ArrowUp, RotateCcw } from 'lucide-react';
import { askAIWithContext } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const { answer } = await askAIWithContext(input.trim(), updatedMessages);

    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
  }

  function clearChat() {
    setMessages([]);
    setInput('');
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#1a1a1a]/35 font-medium tracking-wide uppercase">AI Assistant</p>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1 text-xs text-[#1a1a1a]/30 hover:text-[#154734] transition-colors"
          >
            <RotateCcw size={11} />
            Clear
          </button>
        )}
      </div>

      <motion.div
        whileHover={{ boxShadow: '0 8px 24px rgba(21,71,52,0.08)', transition: { duration: 0.2 } }}
        className="bg-white border border-[#e5e7e5] rounded-2xl overflow-hidden"
      >
        {/* Conversation */}
        {messages.length > 0 && (
          <div className="px-4 pt-4 pb-2 flex flex-col gap-3 max-h-72 overflow-y-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-5 h-5 bg-[#154734] rounded-md flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={10} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] text-sm leading-relaxed px-3 py-2 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-[#154734] text-white rounded-br-sm'
                        : 'bg-[#f5f5f5] text-[#1a1a1a]/80 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading dots */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-5 h-5 bg-[#154734] rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="bg-[#f5f5f5] px-3 py-2 rounded-xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay }}
                      className="w-1.5 h-1.5 bg-[#154734]/40 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-3 px-4 py-3 ${messages.length > 0 ? 'border-t border-[#f0f0f0]' : ''}`}
        >
          <Sparkles size={14} className="text-[#154734]/30 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={messages.length === 0 ? 'Ask anything about campus...' : 'Follow up...'}
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
