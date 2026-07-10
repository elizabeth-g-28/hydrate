import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/common/BottomNav';

export const AppLayout = () => (
  <div className="min-h-screen bg-hydro-bg">
    <main>
      <Outlet />
    </main>
    <BottomNav />
  </div>
);
