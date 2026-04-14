import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <Footer />
    </>
  );
}
