import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { ArrowLeft, ImagePlus, X, SmilePlus, CornerUpLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, Conversation, Message } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Props = {
  conversation: Conversation;
  onBack: () => void;
};

const EMOJI_LIST = ['❤️', '😂', '😮', '😢', '👍', '🔥', '🎉', '👀'];
const EMOJI_PICKER = ['😀','😂','😍','🥹','😎','🤔','😅','🙏','👍','❤️','🔥','🎉','😮','😢','👀','💯','🫡','🤝','🐴','✅'];

export default function DMChat({ conversation, onBack }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetching, setFetching] = useState(true);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`conv-${conversation.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, () => fetchMessages())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      }, () => fetchMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, username), reply_to:reply_to_id(id, content, image_url, sender:sender_id(id, username)), reactions:message_reactions(*)')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    setMessages((data as Message[]) ?? []);
    setFetching(false);
  }

  async function sendMessage() {
    if ((!content.trim() && !imageFile) || !user) return;
    setSending(true);

    let image_url: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `dm/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, imageFile, { upsert: false });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: content.trim() || null,
      image_url,
      reply_to_id: replyingTo?.id ?? null,
    });

    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setReplyingTo(null);
    setSending(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Always re-fetch after sending — don't rely solely on Realtime
    if (!insertError) fetchMessages();
  }

  async function addReaction(messageId: string, emoji: string) {
    if (!user) return;
    const msg = messages.find(m => m.id === messageId);
    const existing = msg?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

    // Optimistic update — mutate local state immediately so animation plays cleanly
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions ?? [];
      if (existing) {
        return { ...m, reactions: reactions.filter(r => !(r.user_id === user.id && r.emoji === emoji)) };
      } else {
        return { ...m, reactions: [...reactions, { id: `temp-${Date.now()}`, message_id: messageId, user_id: user.id, emoji, created_at: new Date().toISOString() }] };
      }
    }));

    setReactionTarget(null);

    // Persist to DB — let Realtime subscription sync the final state,
    // with a delayed fallback fetch after the animation completes (~400ms)
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
    }
    setTimeout(() => fetchMessages(), 400);
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function timeLabel(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  // Group reactions by emoji
  function groupReactions(reactions: Message['reactions']) {
    if (!reactions?.length) return [];
    const map: Record<string, { emoji: string; count: number; mine: boolean }> = {};
    for (const r of reactions) {
      if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, mine: false };
      map[r.emoji].count++;
      if (r.user_id === user?.id) map[r.emoji].mine = true;
    }
    return Object.values(map);
  }

  const isMine = (msg: Message) => msg.sender_id === user?.id;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f0f0f0]">
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-[#154734]/8 flex items-center justify-center hover:bg-[#154734]/12 transition-colors">
          <ArrowLeft size={15} strokeWidth={2.5} className="text-[#154734]" />
        </button>
        <div className="w-8 h-8 bg-[#eef4f0] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-[#154734]">
            {(conversation.other_user?.username ?? '?')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1a1a1a]">@{conversation.other_user?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
        onClick={() => { setReactionTarget(null); setShowEmojiPicker(false); }}
      >
        {fetching ? (
          <div className="flex justify-center mt-12">
            <div className="w-5 h-5 border-2 border-[#154734] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center mt-16 gap-1">
            <p className="text-sm font-medium text-[#1a1a1a]/40">No messages yet</p>
            <p className="text-xs text-[#1a1a1a]/25">Say hello 👋</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const mine = isMine(msg);
            const grouped = groupReactions(msg.reactions);
            const showAvatar = !mine && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
            const isLastInGroup = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
              >
                {/* Reply preview */}
                {msg.reply_to && (
                  <div className={`flex items-center gap-1.5 mb-1 px-3 py-1 rounded-xl bg-[#1a1a1a]/5 max-w-[75%] ${mine ? 'mr-1' : 'ml-9'}`}>
                    <CornerUpLeft size={10} className="text-[#1a1a1a]/30 shrink-0" />
                    <p className="text-[10px] text-[#1a1a1a]/40 truncate">
                      @{(msg.reply_to as any).sender?.username}: {(msg.reply_to as any).content ?? '📷'}
                    </p>
                  </div>
                )}

                <div className={`flex items-end gap-2 group/row ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar for other user */}
                  {!mine && (
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${showAvatar ? 'bg-[#eef4f0]' : 'opacity-0'}`}>
                      {showAvatar && <span className="text-[9px] font-semibold text-[#154734]">{(msg.sender?.username ?? '?')[0].toUpperCase()}</span>}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="relative group max-w-[88%]">
                    <div
                      className={`rounded-2xl px-3 py-2 w-fit ${
                        mine
                          ? 'bg-[#154734] text-white rounded-br-md'
                          : 'bg-white border border-[#e5e7e5] text-[#1a1a1a] rounded-bl-md'
                      }`}
                    >
                      {msg.image_url && (
                        <img src={msg.image_url} alt="attachment" className="rounded-xl max-h-48 w-full object-cover mb-1" />
                      )}
                      {msg.content && (
                        <p className={`text-sm leading-relaxed ${mine ? 'text-white' : 'text-[#1a1a1a]/80'}`}>{msg.content}</p>
                      )}
                      <p className={`text-[9px] mt-0.5 ${mine ? 'text-white/40' : 'text-[#1a1a1a]/25'}`}>{timeLabel(msg.created_at)}</p>
                    </div>

                    {/* Quick reaction picker — always below bubble to avoid header overlap */}
                    <AnimatePresence>
                      {reactionTarget === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={e => e.stopPropagation()}
                          className={`absolute z-20 top-full mt-1 ${mine ? 'right-0' : 'left-0'} bg-white border border-[#e5e7e5] rounded-2xl px-2 py-1.5 flex gap-1 shadow-lg`}
                        >
                          {EMOJI_LIST.map(emoji => (
                            <button key={emoji} onClick={() => addReaction(msg.id, emoji)} className="text-base hover:scale-125 transition-transform">
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action buttons — always occupy space (invisible when not hovered) so bubble width stays consistent */}
                  <div className={`flex items-center gap-1 shrink-0 self-center invisible group-hover/row:visible`}>
                    <button
                      onClick={e => { e.stopPropagation(); setReactionTarget(reactionTarget === msg.id ? null : msg.id); setShowEmojiPicker(false); }}
                      className="w-6 h-6 bg-white border border-[#e5e7e5] rounded-lg flex items-center justify-center hover:border-[#154734]/30 transition-colors shadow-sm"
                    >
                      <SmilePlus size={11} className="text-[#1a1a1a]/40" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setReplyingTo(msg); inputRef.current?.focus(); }}
                      className="w-6 h-6 bg-white border border-[#e5e7e5] rounded-lg flex items-center justify-center hover:border-[#154734]/30 transition-colors shadow-sm"
                    >
                      <CornerUpLeft size={11} className="text-[#1a1a1a]/40" />
                    </button>
                  </div>
                </div>

                {/* Reactions */}
                <AnimatePresence mode="popLayout">
                  {grouped.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex gap-1 mt-1 flex-wrap ${mine ? 'mr-1' : 'ml-9'}`}
                    >
                      <AnimatePresence mode="sync">
                        {grouped.map(r => (
                          <motion.button
                            key={r.emoji}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                            exit={{ opacity: 1 }}
                            onClick={() => addReaction(msg.id, r.emoji)}
                            className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                              r.mine ? 'bg-[#154734]/10 border-[#154734]/30 text-[#154734]' : 'bg-white border-[#e5e7e5] text-[#1a1a1a]/60'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            {r.count > 1 && <span className="text-[10px] font-medium">{r.count}</span>}
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="px-4 pb-4 pt-2 border-t border-[#f0f0f0]">
        {/* Reply banner */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between bg-[#154734]/5 rounded-xl px-3 py-2 mb-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CornerUpLeft size={12} className="text-[#154734] shrink-0" />
                <p className="text-xs text-[#154734] truncate">
                  Replying to @{replyingTo.sender?.username}: {replyingTo.content ?? '📷'}
                </p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="shrink-0 ml-2 text-[#1a1a1a]/30 hover:text-[#1a1a1a]/60">
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative mb-2 overflow-hidden"
            >
              <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover rounded-xl" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-1 left-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white border border-[#e5e7e5] rounded-2xl flex items-center gap-2 px-3 py-2">
          {/* Image attach */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[#154734]/30 hover:text-[#154734] transition-colors shrink-0"
          >
            <ImagePlus size={18} strokeWidth={2} />
          </button>

          {/* Emoji picker toggle */}
          <div className="relative shrink-0 flex items-center">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowEmojiPicker(s => !s); setReactionTarget(null); }}
              className={`transition-colors ${showEmojiPicker ? 'text-[#154734]' : 'text-[#154734]/30 hover:text-[#154734]'}`}
            >
              <SmilePlus size={18} strokeWidth={2} />
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="absolute bottom-full left-0 mb-2 bg-white border border-[#e5e7e5] rounded-2xl p-2 shadow-lg z-10 grid grid-cols-5 gap-1 w-44"
                >
                  {EMOJI_PICKER.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { setContent(c => c + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                      className="text-lg hover:scale-125 transition-transform text-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={content}
            onChange={e => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25 overflow-hidden"
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={sending || (!content.trim() && !imageFile)}
            className="w-7 h-7 bg-[#154734] rounded-lg flex items-center justify-center disabled:opacity-20 hover:bg-[#1a5c42] transition-colors shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
