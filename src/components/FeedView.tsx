import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Props = {
  category: string;
  label: string;
  onBack: () => void;
};

export default function FeedView({ category, label, onBack }: Props) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Track which post has the reply composer open
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Track which threads are expanded
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
  }, [category]);

  async function fetchPosts() {
    setFetching(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (!data) {
      setPosts([]);
      setFetching(false);
      return;
    }

    // Separate top-level posts and replies
    const topLevel = data.filter(p => !p.parent_id);
    const replies = data.filter(p => p.parent_id);

    // Nest replies under their parent
    const nested = topLevel.map(post => ({
      ...post,
      replies: replies
        .filter(r => r.parent_id === post.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));

    setPosts(nested);
    setFetching(false);
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setLoading(true);

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: content.trim(), category, parent_id: null });

    if (!error) {
      setContent('');
      fetchPosts();
    }
    setLoading(false);
  }

  async function handleReply(e: FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;
    setReplyLoading(true);

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: replyContent.trim(), category, parent_id: parentId });

    if (!error) {
      setReplyContent('');
      setReplyingTo(null);
      // Auto-expand the thread after replying
      setExpandedThreads(prev => new Set(prev).add(parentId));
      fetchPosts();
    }
    setReplyLoading(false);
  }

  async function handleDelete(postId: string, parentId: string | null) {
    await supabase.from('posts').delete().eq('id', postId);
    if (parentId) {
      // Remove reply from nested structure
      setPosts(prev =>
        prev.map(p =>
          p.id === parentId
            ? { ...p, replies: (p.replies ?? []).filter(r => r.id !== postId) }
            : p
        )
      );
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  }

  function toggleThread(postId: string) {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  function toggleReply(postId: string) {
    if (replyingTo === postId) {
      setReplyingTo(null);
      setReplyContent('');
    } else {
      setReplyingTo(postId);
      setReplyContent('');
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack} className="text-black">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h2 className="text-xl font-black text-black">{label}</h2>
      </div>

      {/* Compose */}
      <div className="px-4 pb-3">
        <form onSubmit={handlePost} className="bg-[#8B8B8B] rounded-[20px] p-4 shadow-md flex flex-col gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`Post something in ${label}...`}
            rows={2}
            className="w-full bg-transparent border-none outline-none resize-none text-black font-bold placeholder-[#D9D9D9] text-sm"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-700 font-bold">@{profile?.username}</span>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-[#43A047] text-white text-sm font-black px-4 py-1 rounded-[10px] disabled:opacity-40"
            >
              {loading ? '...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-4">
        {fetching ? (
          <p className="text-center text-gray-500 text-sm mt-8">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-8">No posts yet. Be the first!</p>
        ) : (
          <AnimatePresence>
            {posts.map(post => {
              const replyCount = post.replies?.length ?? 0;
              const isExpanded = expandedThreads.has(post.id);
              const isReplying = replyingTo === post.id;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#8B8B8B] rounded-[20px] shadow-md overflow-hidden"
                >
                  {/* Post body */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black text-black">@{post.profiles?.username ?? 'unknown'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-700">{timeAgo(post.created_at)}</span>
                        {user?.id === post.user_id && (
                          <button
                            onClick={() => handleDelete(post.id, null)}
                            className="text-xs text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-black font-medium mb-3">{post.content}</p>

                    {/* Action row */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleReply(post.id)}
                        className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                          isReplying ? 'text-[#43A047]' : 'text-gray-700 hover:text-black'
                        }`}
                      >
                        <MessageCircle size={14} />
                        Reply
                      </button>
                      {replyCount > 0 && (
                        <button
                          onClick={() => toggleThread(post.id)}
                          className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-black transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply composer */}
                  <AnimatePresence>
                    {isReplying && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-black/10"
                      >
                        <form
                          onSubmit={e => handleReply(e, post.id)}
                          className="px-4 py-3 flex flex-col gap-2"
                        >
                          <textarea
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder={`Reply to @${post.profiles?.username ?? 'unknown'}...`}
                            rows={2}
                            autoFocus
                            className="w-full bg-transparent border-none outline-none resize-none text-black font-bold placeholder-[#D9D9D9] text-sm"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-700 font-bold">@{profile?.username}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => toggleReply(post.id)}
                                className="text-xs text-gray-700 font-bold px-3 py-1 rounded-[10px] hover:text-black"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={replyLoading || !replyContent.trim()}
                                className="bg-[#43A047] text-white text-sm font-black px-4 py-1 rounded-[10px] disabled:opacity-40"
                              >
                                {replyLoading ? '...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Replies thread */}
                  <AnimatePresence>
                    {isExpanded && replyCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-black/10"
                      >
                        {post.replies!.map((reply, idx) => (
                          <div
                            key={reply.id}
                            className={`px-4 py-3 flex flex-col gap-1 ${
                              idx < replyCount - 1 ? 'border-b border-black/10' : ''
                            }`}
                          >
                            {/* Thread line + content */}
                            <div className="flex gap-3">
                              <div className="w-0.5 bg-black/20 rounded-full self-stretch ml-1 shrink-0" />
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-black text-black">
                                    @{reply.profiles?.username ?? 'unknown'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700">{timeAgo(reply.created_at)}</span>
                                    {user?.id === reply.user_id && (
                                      <button
                                        onClick={() => handleDelete(reply.id, post.id)}
                                        className="text-xs text-red-800 font-bold"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-black font-medium">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
