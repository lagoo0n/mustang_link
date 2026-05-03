import { useState, useEffect, useRef, FormEvent } from 'react';
import { ArrowLeft, ImagePlus, X, Flag, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLostAndFound = category === 'lost';

  useEffect(() => { fetchPosts(); }, [category]);

  async function fetchPosts() {
    setFetching(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (!data) { setPosts([]); setFetching(false); return; }

    const topLevel = data.filter(p => !p.parent_id);
    const replies = data.filter(p => p.parent_id);
    const nested = topLevel.map(post => ({
      ...post,
      replies: replies
        .filter(r => r.parent_id === post.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));

    setPosts(nested);
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
      const { error: uploadError } = await supabase.storage.from('post-images').upload(path, imageFile, { upsert: false });
      if (uploadError) { setLoading(false); return; }
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from('posts')
      .insert({ user_id: user.id, content: content.trim(), category, image_url, parent_id: null });

    if (!error) { setContent(''); clearImage(); fetchPosts(); }
    setLoading(false);
  }

  async function handleReply(e: FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;
    setReplyLoading(true);

    const { error } = await supabase.from('posts')
      .insert({ user_id: user.id, content: replyContent.trim(), category, parent_id: parentId });

    if (!error) {
      setReplyContent('');
      setReplyingTo(null);
      setExpandedThreads(prev => new Set(prev).add(parentId));
      fetchPosts();
    }
    setReplyLoading(false);
  }

  async function handleDelete(postId: string, parentId: string | null) {
    await supabase.from('posts').delete().eq('id', postId);
    if (parentId) {
      setPosts(prev => prev.map(p =>
        p.id === parentId ? { ...p, replies: (p.replies ?? []).filter(r => r.id !== postId) } : p
      ));
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  }

  async function handleReport(postId: string, reason: string) {
    if (!user) return;
    await supabase.from('reports').insert({ post_id: postId, reporter_id: user.id, reason });
    setReportedPosts(prev => new Set(prev).add(postId));
    setReportingPostId(null);
  }

  function toggleThread(postId: string) {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  }

  function toggleReply(postId: string) {
    if (replyingTo === postId) { setReplyingTo(null); setReplyContent(''); }
    else { setReplyingTo(postId); setReplyContent(''); }
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
      <div className="flex items-center gap-3 px-6 py-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-[#154734]/8 flex items-center justify-center hover:bg-[#154734]/12 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={2.5} className="text-[#154734]" />
        </button>
        <h2 className="text-base font-semibold text-[#1a1a1a]">{label}</h2>
      </div>

      {/* Compose */}
      <div className="px-6 pb-4">
        <form onSubmit={handlePost} className="bg-white border border-[#e5e7e5] rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Share something in ${label}...`}
              rows={2}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25"
            />
          </div>

          {imagePreview && (
            <div className="relative mx-4 mb-3">
              <img src={imagePreview} alt="preview" className="w-full max-h-40 object-cover rounded-xl" />
              <button type="button" onClick={clearImage} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center">
                <X size={11} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center px-4 py-3 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#1a1a1a]/30 font-medium">@{profile?.username}</span>
              {isLostAndFound && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#154734]/30 hover:text-[#154734] transition-colors">
                    <ImagePlus size={15} strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-[#154734] text-white text-xs font-medium px-4 py-1.5 rounded-lg disabled:opacity-25 hover:bg-[#1a5c42] transition-colors"
            >
              {loading ? '...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-3 pb-6">
        {fetching ? (
          <div className="flex justify-center mt-12">
            <div className="w-5 h-5 border-2 border-[#154734] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center mt-16 gap-1">
            <p className="text-sm font-medium text-[#1a1a1a]/40">Nothing here yet</p>
            <p className="text-xs text-[#1a1a1a]/25">Be the first to post</p>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post, i) => {
              const replyCount = post.replies?.length ?? 0;
              const isExpanded = expandedThreads.has(post.id);
              const isReplying = replyingTo === post.id;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ boxShadow: '0 8px 24px rgba(21,71,52,0.08)', transition: { duration: 0.2 } }}
                  className="bg-white border border-[#e5e7e5] rounded-2xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#eef4f0] rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-semibold text-[#154734]">
                            {(post.profiles?.username ?? '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1a1a1a]">@{post.profiles?.username ?? 'unknown'}</p>
                          <p className="text-[10px] text-[#1a1a1a]/30">{timeAgo(post.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user?.id !== post.user_id && (
                          reportedPosts.has(post.id) ? (
                            <span className="text-[10px] text-[#1a1a1a]/25">Reported</span>
                          ) : (
                            <button onClick={() => setReportingPostId(reportingPostId === post.id ? null : post.id)} className="text-[#1a1a1a]/20 hover:text-red-400 transition-colors">
                              <Flag size={13} strokeWidth={2} />
                            </button>
                          )
                        )}
                        {user?.id === post.user_id && (
                          <button onClick={() => handleDelete(post.id, null)} className="text-[#1a1a1a]/20 hover:text-red-400 transition-colors text-xs">✕</button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-[#1a1a1a]/80 leading-relaxed mb-3">{post.content}</p>

                    {post.image_url && (
                      <img src={post.image_url} alt="post attachment" className="mb-3 w-full max-h-56 object-cover rounded-xl" />
                    )}

                    <AnimatePresence>
                      {reportingPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 bg-[#fdf5f5] border border-red-100 rounded-xl p-3 flex flex-col gap-1.5 overflow-hidden"
                        >
                          <p className="text-xs font-medium text-[#1a1a1a]/50 mb-1">Why are you reporting this?</p>
                          {REPORT_REASONS.map(reason => (
                            <button key={reason} onClick={() => handleReport(post.id, reason)} className="text-left text-xs text-[#1a1a1a]/60 hover:text-[#1a1a1a] font-medium px-3 py-2 rounded-lg hover:bg-white transition-colors">
                              {reason}
                            </button>
                          ))}
                          <button onClick={() => setReportingPostId(null)} className="text-xs text-[#1a1a1a]/30 mt-1 text-center">Cancel</button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleReply(post.id)} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isReplying ? 'text-[#154734]' : 'text-[#1a1a1a]/30 hover:text-[#154734]'}`}>
                        <MessageCircle size={13} /> Reply
                      </button>
                      {replyCount > 0 && (
                        <button onClick={() => toggleThread(post.id)} className="flex items-center gap-1.5 text-xs font-medium text-[#1a1a1a]/30 hover:text-[#154734] transition-colors">
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isReplying && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#f0f0f0]"
                      >
                        <form onSubmit={e => handleReply(e, post.id)} className="px-4 py-3 flex flex-col gap-2">
                          <textarea
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder={`Reply to @${post.profiles?.username ?? 'unknown'}...`}
                            rows={2}
                            autoFocus
                            className="w-full bg-transparent border-none outline-none resize-none text-sm text-[#1a1a1a] placeholder-[#1a1a1a]/25"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-[#1a1a1a]/30">@{profile?.username}</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => toggleReply(post.id)} className="text-xs text-[#1a1a1a]/30 hover:text-[#1a1a1a]/60 transition-colors px-2 py-1">Cancel</button>
                              <button type="submit" disabled={replyLoading || !replyContent.trim()} className="bg-[#154734] text-white text-xs font-medium px-4 py-1.5 rounded-lg disabled:opacity-25 hover:bg-[#1a5c42] transition-colors">
                                {replyLoading ? '...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isExpanded && replyCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#f0f0f0] bg-[#fafbfa]"
                      >
                        {post.replies!.map((reply, idx) => (
                          <div key={reply.id} className={`px-4 py-3 ${idx < replyCount - 1 ? 'border-b border-[#f0f0f0]' : ''}`}>
                            <div className="flex gap-3">
                              <div className="w-0.5 bg-[#154734]/15 rounded-full self-stretch ml-1 shrink-0" />
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-[#eef4f0] rounded-lg flex items-center justify-center shrink-0">
                                      <span className="text-[8px] font-semibold text-[#154734]">{(reply.profiles?.username ?? '?')[0].toUpperCase()}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-[#1a1a1a]/70">@{reply.profiles?.username ?? 'unknown'}</span>
                                    <span className="text-[10px] text-[#1a1a1a]/25">{timeAgo(reply.created_at)}</span>
                                  </div>
                                  {user?.id === reply.user_id && (
                                    <button onClick={() => handleDelete(reply.id, post.id)} className="text-[#1a1a1a]/20 hover:text-red-400 transition-colors text-xs">✕</button>
                                  )}
                                </div>
                                <p className="text-sm text-[#1a1a1a]/65 leading-relaxed">{reply.content}</p>
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
