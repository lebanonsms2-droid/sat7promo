import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SAT-7 Promo Desk - Dashboard',
  description: 'Internal Promo Department Management System',
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Set dark mode based on system preference or class
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background textforeground antialiased">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            <Topbar onMenuToggle={() => setIsCollapsed(true)} />

            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}