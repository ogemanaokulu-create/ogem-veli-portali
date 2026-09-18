import { AuthProvider, useAuth } from '@/lib/auth';
import { LoginScreen } from '@/components/LoginScreen';
import { ManagerPanel } from '@/panels/ManagerPanel';
import { TeacherPanel } from '@/panels/TeacherPanel';
import { ParentPanel } from '@/panels/ParentPanel';

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>OGEM Anaokulu yükleniyor…</span>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  const role = session.profile.role;
  if (role === 'manager') return <ManagerPanel />;
  if (role === 'teacher') return <TeacherPanel />;
  return <ParentPanel />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
