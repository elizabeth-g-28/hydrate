import { NavLink } from 'react-router-dom';
import { Droplets, History, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: Droplets },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export const BottomNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-hydro-border/50 pb-[env(safe-area-inset-bottom,0px)]"
    role="navigation"
    aria-label="Main navigation"
  >
    <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-1 pb-1.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={label}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
              isActive
                ? 'text-hydro-accent bg-hydro-accent/10'
                : 'text-hydro-text-muted hover:text-hydro-text hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);
