/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import ActionGrid from './components/ActionGrid';
import AIAssistant from './components/AIAssistant';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E9E9E9] flex items-center justify-center">
        <p className="text-gray-500 font-bold">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#E9E9E9] flex justify-center">
      <div className="w-full max-w-[480px] bg-[#E9E9E9] min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {/* <Hero /> */}
          <ActionGrid />
          <AIAssistant />
        </main>
        <div className="h-10" />
      </div>
    </div>
  );
}

