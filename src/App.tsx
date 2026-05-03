import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import ActionGrid from './components/ActionGrid';
import AIAssistant from './components/AIAssistant';
import AuthScreen from './components/AuthScreen';
import Footer from './components/Footer';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf8] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#154734] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-[#f9faf8] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <ActionGrid />
          <AIAssistant />
          <Footer />
        </main>
      </div>
    </div>
  );
}
