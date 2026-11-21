import { RefreshCw } from 'lucide-react';

export type ActiveSection = 'home' | 'analyses' | 'channels' | 'bookmarks';

interface NavbarProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  onFetchDaily: () => void;
  isFetching: boolean;
}

export function Navbar({
  activeSection,
  onNavigate,
  onFetchDaily,
  isFetching,
}: NavbarProps) {
  const navItems: { id: ActiveSection; label: string; href: string }[] = [
    { id: 'home', label: 'باش بەت', href: '#home' },
    { id: 'analyses', label: 'ئانالىزلار', href: '#analyses' },
    { id: 'channels', label: 'قاناللار', href: '#channels' },
    { id: 'bookmarks', label: 'ساقلانغانلار', href: '#analyses' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-surface border-b border-[var(--border-subtle)]">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7 h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className="text-2xl font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 flex items-center gap-1"
        >
          <span>ئانالىزلار</span>
          <span className="text-[var(--accent-primary)]">.</span>
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="ئاساسىي يول باشلىغۇچ">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                }}
                className={`text-[15px] font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                  isActive
                    ? 'text-[var(--accent-primary)] border-[var(--accent-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onFetchDaily}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-65 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-[0_8px_20px_rgba(184,75,39,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'يىغىۋاتىدۇ...' : 'كۈندىلىك يىغىش'}</span>
          </button>
        </div>
      </div>

      {/* Mobile clean single-row nav */}
      <div className="md:hidden border-t border-[var(--border-subtle)] px-5 py-2 flex items-center justify-between gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-soft)] font-semibold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
