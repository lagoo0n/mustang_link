import { useState, useEffect, useRef, FormEvent } from 'react';
import { ArrowLeft, ImagePlus, X, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, Post } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Props = {
  category: string;
  label: string;
  onBack: () => void;
};

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam',
  'Harassment',
  'False information',
  'Other',
];

export default function FeedView({ category, label, onBack }: Props) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLostAndFound = category === 'lost';

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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setLoading(true);

    let image_url: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, imageFile, { upsert: false });

      if (uploadError) {
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: content.trim(), category, image_url });

    if (!error) {
      setContent('');
      clearImage();
      fetchPosts();
    }
    setLoading(false);
  }

  async function handleDelete(postId: string) {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  async function handleReport(postId: string, reason: string) {
    if (!user) return;
    await supabase.from('reports').insert({
      post_id: postId,
      reporter_id: user.id,
      reason,
    });
    setReportedPosts(prev => new Set(prev).add(postId));
    setReportingPostId(null);
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

          {/* Image preview */}
          {imagePreview && (
            <div className="relative w-full">
              <img
                src={imagePreview}
                alt="preview"
                className="w-full max-h-48 object-cover rounded-[10px]"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-700 font-bold">@{profile?.username}</span>
              {isLostAndFound && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-700 hover:text-black"
                    title="Attach image"
                  >
                    <ImagePlus size={18} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>
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
                    {user?.id !== post.user_id && (
                      reportedPosts.has(post.id) ? (
                        <span className="text-xs text-gray-600 font-bold">Reported</span>
                      ) : (
                        <button
                          onClick={() => setReportingPostId(reportingPostId === post.id ? null : post.id)}
                          className="text-gray-700 hover:text-red-800"
                          title="Report post"
                        >
                          <Flag size={14} strokeWidth={2.5} />
                        </button>
                      )
                    )}
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
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="post attachment"
                    className="mt-2 w-full max-h-64 object-cover rounded-[10px]"
                  />
                )}

                {/* Report reason picker */}
                <AnimatePresence>
                  {reportingPostId === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex flex-col gap-1 overflow-hidden"
                    >
                      <p className="text-xs font-black text-black mb-1">Why are you reporting this?</p>
                      {REPORT_REASONS.map(reason => (
                        <button
                          key={reason}
                          onClick={() => handleReport(post.id, reason)}
                          className="text-left text-xs bg-[#D9D9D9] hover:bg-red-200 text-black font-bold px-3 py-1.5 rounded-[8px]"
                        >
                          {reason}
                        </button>
                      ))}
                      <button
                        onClick={() => setReportingPostId(null)}
                        className="text-xs text-gray-700 font-bold mt-1"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
