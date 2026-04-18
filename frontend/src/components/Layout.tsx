import { ReactNode, useState } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { LayoutDashboard, CreditCard, PiggyBank, Target, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from './ui/Button';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transazioni', icon: CreditCard },
  { id: 'budgets', label: 'Budget', icon: PiggyBank },
  { id: 'goals', label: 'Obiettivi', icon: Target },
];

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggleDarkMode, darkMode } = useAppStore();
  const logout = useAppStore((state) => state.logout);

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden mr-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="text-xl font-bold text-foreground">MoneyFlow</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="text-foreground">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Esci</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card pt-14 transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-[calc(100vh-3.5rem)] md:shadow-none',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <nav className="space-y-1 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setMobileMenuOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
