import Navigation from '@/components/Navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SessionWarningModal } from '@/components/admin/SessionWarningModal';
import { useSessionManagement } from '@/hooks/use-session-management';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { showWarning, timeLeft, formatTime, extendSession, logout } = useSessionManagement();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            <AdminSidebar />
            <div>{children}</div>
          </div>
        </div>
      </main>
      <SessionWarningModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        formatTime={formatTime}
        onExtend={extendSession}
        onLogout={logout}
      />
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
