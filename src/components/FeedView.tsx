import { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
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
    setPosts(data ?? []);
    setFetching(false);
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setLoading(true);

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: content.trim(), category });

    if (!error) {
      setContent('');
      fetchPosts();
    }
    setLoading(false);
  }

  async function handleDelete(postId: string) {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
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
            {posts.map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#8B8B8B] rounded-[20px] p-4 shadow-md"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-black text-black">@{post.profiles?.username ?? 'unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700">{timeAgo(post.created_at)}</span>
                    {user?.id === post.user_id && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-xs text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-black font-medium">{post.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
