/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import ActionGrid from './components/ActionGrid';
import AIAssistant from './components/AIAssistant';
import AuthScreen from './components/AuthScreen';
import Footer from './components/Footer';
import DMList from './components/DMList';
import DMChat from './components/DMChat';
import { Conversation, Profile, supabase } from './lib/supabase';

type View = 'home' | 'dm-list' | 'dm-chat';

export default function App() {
  const { session, loading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<{ id: string; label: string } | null>(null);
  const [view, setView] = useState<View>('home');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf8] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#154734] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  function openDMs() {
    setView('dm-list');
    setActiveCategory(null);
  }

  function openConversation(conv: Conversation) {
    setActiveConversation(conv);
    setView('dm-chat');
  }

  function closeDMs() {
    setView('home');
    setActiveConversation(null);
  }

  async function messageUser(otherUser: Profile) {
    if (!session) return;
    const myId = session.user.id;

    // post.profiles may only have username — fetch the full profile to ensure we have the id
    let fullProfile = otherUser;
    if (!otherUser.id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', otherUser.username)
        .single();
      if (!data) return;
      fullProfile = data;
    }

    // Check both orderings with separate queries
    const { data: conv1 } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', myId)
      .eq('user2_id', fullProfile.id)
      .maybeSingle();

    if (conv1) { openConversation({ ...conv1, other_user: fullProfile }); return; }

    const { data: conv2 } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', fullProfile.id)
      .eq('user2_id', myId)
      .maybeSingle();

    if (conv2) { openConversation({ ...conv2, other_user: fullProfile }); return; }

    // No existing conversation — create one
    const { data: created } = await supabase
      .from('conversations')
      .insert({ user1_id: myId, user2_id: fullProfile.id })
      .select()
      .single();

    if (created) openConversation({ ...created, other_user: fullProfile });
  }

  return (
    <div className="min-h-screen bg-[#f9faf8] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col">
        {view === 'home' && (
          <>
            <Header onOpenDMs={openDMs} />
            <main className="flex-1 overflow-y-auto">
              <ActionGrid activeCategory={activeCategory} setActiveCategory={setActiveCategory} onMessageUser={messageUser} />
              {!activeCategory && (
                <>
                  <AIAssistant onMessageUser={messageUser} />
                  <Footer onNavigate={setActiveCategory} />
                </>
              )}
            </main>
          </>
        )}

        {view === 'dm-list' && (
          <main className="flex-1 overflow-y-auto flex flex-col">
            <DMList onOpen={openConversation} onClose={closeDMs} />
          </main>
        )}

        {view === 'dm-chat' && activeConversation && (
          <main className="flex-1 overflow-hidden flex flex-col">
            <DMChat
              conversation={activeConversation}
              onBack={() => setView('dm-list')}
            />
          </main>
        )}
      </div>
    </div>
  );
}
