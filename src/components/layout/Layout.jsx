import { Outlet } from 'react-router-dom';
import TabBar from './TabBar';
import Header from './Header';
import SoundControl from '../SoundControl';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="page-enter" style={{ paddingBottom: 84 }}>
        <Outlet />
      </main>
      <TabBar />
      <SoundControl />
    </div>
  );
}