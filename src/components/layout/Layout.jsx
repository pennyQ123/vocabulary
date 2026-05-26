import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="layout paper-texture">
      <Header />
      <main className="page-enter" style={{ paddingBottom: 80 }}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}