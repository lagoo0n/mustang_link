import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, Conversation, Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Props = {
  onOpen: (conv: Conversation) => void;
  onClose: () => void;
};

export default function DMList({ onOpen, onClose }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  async function fetchConversations() {
    setFetching(true);
    const { data } = await supabase
      .from('conversations')
      .select('*, user1:user1_id(id, username), user2:user2_id(id, username)')
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });

    if (!data) { setFetching(false); return; }

    // For each conversation, fetch the last message
    const enriched = await Promise.all(data.map(async (conv: any) => {
      const other = conv.user1.id === user!.id ? conv.user2 : conv.user1;
      const { data: msgs } = await supabase
        .from('messages')
        .select('content, image_url, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const last = msgs?.[0];
      return {
        ...conv,
        other_user: other,
        last_message: last?.content ?? (last?.image_url ? '📷 Image' : null),
        last_message_at: last?.created_at ?? conv.created_at,
      } as Conversation;
    }));

    // Sort by most recent message
    enriched.sort((a, b) =>
      new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime()
    );

    setConversations(enriched);
    setFetching(false);
  }

  async function searchUsers(query: string) {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', user!.id)
      .limit(8);
    setSearchResults(data ?? []);
    setSearching(false);
  }

  async function startConversation(otherUser: Profile) {
    console.log('[DM] startConversation called with', otherUser);

    // Check both orderings since user1/user2 could be either way
    const { data: existing, error: existingError } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_id.eq.${user!.id},user2_id.eq.${otherUser.id}),and(user1_id.eq.${otherUser.id},user2_id.eq.${user!.id})`
      )
      .maybeSingle();

    console.log('[DM] existing check:', existing, existingError);

    if (existing) {
      console.log('[DM] opening existing conversation');
      onOpen({ ...existing, other_user: otherUser });
      return;
    }

    const { data: created, error: insertError } = await supabase
      .from('conversations')
      .insert({ user1_id: user!.id, user2_id: otherUser.id })
      .select()
      .single();

    console.log('[DM] insert result:', created, insertError);

    if (created) {
      onOpen({ ...created, other_user: otherUser });
      return;
    }

    if (insertError) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(user1_id.eq.${user!.id},user2_id.eq.${otherUser.id}),and(user1_id.eq.${otherUser.id},user2_id.eq.${user!.id})`
        )
        .maybeSingle();
      console.log('[DM] fallback:', fallback, fallbackError);
      if (fallback) onOpen({ ...fallback, other_user: otherUser });
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#154734]/8 flex items-center justify-center hover:bg-[#154734]/12 transition-colors">
            <ArrowLeft size={15} strokeWidth={2.5} className="text-[#154734]" />
          </button>
          <h2 className="text-base font-semibold text-[#1a1a1a]">Messages</h2>
        </div>
        <button
          onClick={() => { setShowSearch(s => !s); setSearch(''); setSearchResults([]); }}
          className="w-8 h-8 rounded-xl bg-[#154734]/8 flex items-center justify-center hover:bg-[#154734]/12 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} className="text-[#154734]" />
        </button>
      </div>

      {/* New conversation search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-3 overflow-hidden"
          >
            <div className="bg-white border border-[#e5e7e5] rounded-2xl px-4 py-2 flex items-center gap-2">
              <Search size={13} className="text-[#1a1a1a]/30 shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search users..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-[#e5e7e5] rounded-2xl overflow-hidden">
                {searchResults.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={async () => { await startConversation(u); setShowSearch(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f5] transition-colors text-left ${i < searchResults.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}
                  >
                    <div className="w-8 h-8 bg-[#eef4f0] rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[#154734]">{u.username[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-[#1a1a1a]">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
            {search.trim() && !searching && searchResults.length === 0 && (
              <p className="text-xs text-[#1a1a1a]/30 text-center mt-3">No users found</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-2 pb-6">
        {fetching ? (
          <div className="flex justify-center mt-12">
            <div className="w-5 h-5 border-2 border-[#154734] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center mt-16 gap-1">
            <p className="text-sm font-medium text-[#1a1a1a]/40">No messages yet</p>
            <p className="text-xs text-[#1a1a1a]/25">Tap + to start a conversation</p>
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onOpen(conv)}
                className="w-full flex items-center gap-3 bg-white border border-[#e5e7e5] rounded-2xl px-4 py-3 hover:border-[#154734]/20 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#eef4f0] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-[#154734]">
                    {(conv.other_user?.username ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-semibold text-[#1a1a1a]">@{conv.other_user?.username ?? '...'}</p>
                    <span className="text-[10px] text-[#1a1a1a]/25 shrink-0 ml-2">{timeAgo(conv.last_message_at ?? conv.created_at)}</span>
                  </div>
                  <p className="text-xs text-[#1a1a1a]/40 truncate mt-0.5">
                    {conv.last_message ?? 'No messages yet'}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
