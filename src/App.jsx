import { useEffect, useState } from 'react';
import { initVocab } from './store/drillStore';
import Drill from './pages/Drill';
import Leaderboard from './pages/Leaderboard';
import './styles/base.css';

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('drill');

  useEffect(() => {
    initVocab().then(() => setReady(true)).catch(e => {
      console.error('[App] init failed:', e);
      setReady(true);
    });
  }, []);

  // Simple hash-based nav
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'leaderboard') setPage('leaderboard');
      else setPage('drill');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F5EDE0',
        fontFamily: 'Georgia, serif', color: '#3D2B1F',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 18 }}>词汇故纸屋</div>
          <div style={{ fontSize: 14, color: '#9A8677', marginTop: 8 }}>正在加载词库...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-base)' }}>
      {/* Nav bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(245, 237, 224, 0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--paper-shadow)',
        display: 'flex',
      }}>
        <button
          onClick={() => { setPage('drill'); window.location.hash = ''; }}
          style={{
            flex: 1, padding: '12px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 14,
            fontWeight: page === 'drill' ? 700 : 400,
            color: page === 'drill' ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
            borderBottom: page === 'drill' ? '2px solid var(--wine-red)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          速刷
        </button>
        <button
          onClick={() => { setPage('leaderboard'); window.location.hash = 'leaderboard'; }}
          style={{
            flex: 1, padding: '12px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 14,
            fontWeight: page === 'leaderboard' ? 700 : 400,
            color: page === 'leaderboard' ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
            borderBottom: page === 'leaderboard' ? '2px solid var(--wine-red)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          错词榜
        </button>
      </div>

      {page === 'drill' ? <Drill /> : <Leaderboard />}
    </div>
  );
}