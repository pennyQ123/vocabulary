import { useEffect, useState } from 'react';
import { initVocab, restoreFromGist, migrateOldDB } from './store/drillStore';
import Drill from './pages/Drill';
import Leaderboard from './pages/Leaderboard';
import Analysis from './pages/Analysis';
import Search from './pages/Search';
import SoundControl from './components/SoundControl';
import './styles/base.css';

const paperCardStyle = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-paper)',
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('drill');

  useEffect(() => {
    initVocab().then(() => migrateOldDB()).then(() => restoreFromGist()).then(() => setReady(true)).catch(e => {
      console.error('[App] init failed:', e);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'leaderboard') setPage('leaderboard');
      else if (hash === 'analysis') setPage('analysis');
      else if (hash === 'search') setPage('search');
      else setPage('drill');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper-bg)',
        fontFamily: 'var(--font-body)', color: 'var(--ink-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--lotus)', filter: 'drop-shadow(0 4px 12px rgba(184, 138, 58, 0.30))' }}>✦</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--ink-faded)' }}>背单词</div>
          <div style={{ fontSize: 14, color: 'var(--ink-faded)', marginTop: 10 }}>正在加载词库...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Nav bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--paper-surface)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        boxShadow: '0 2px 12px rgba(30, 44, 35, 0.08)',
      }}>
        <button
          onClick={() => { setPage('drill'); window.location.hash = ''; }}
          style={{
            flex: 1, padding: '14px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 14,
            fontWeight: page === 'drill' ? 700 : 400,
            color: 'var(--ink-primary)',
            borderBottom: page === 'drill' ? '2.5px solid var(--ink-primary)' : '2.5px solid transparent',
            transition: 'all 150ms ease',
          }}
        >
          速刷
        </button>
        <button
          onClick={() => { setPage('leaderboard'); window.location.hash = 'leaderboard'; }}
          style={{
            flex: 1, padding: '14px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 14,
            fontWeight: page === 'leaderboard' ? 700 : 400,
            color: 'var(--ink-primary)',
            borderBottom: page === 'leaderboard' ? '2.5px solid var(--ink-primary)' : '2.5px solid transparent',
            transition: 'all 150ms ease',
          }}
        >
          错词榜
        </button>
        <button
          onClick={() => { setPage('analysis'); window.location.hash = 'analysis'; }}
          style={{
            flex: 1, padding: '14px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 14,
            fontWeight: page === 'analysis' ? 700 : 400,
            color: 'var(--ink-primary)',
            borderBottom: page === 'analysis' ? '2.5px solid var(--ink-primary)' : '2.5px solid transparent',
            transition: 'all 150ms ease',
          }}
        >
          辨析
        </button>
        <button
          onClick={() => { setPage('search'); window.location.hash = 'search'; }}
          style={{
            flex: 1, padding: '14px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-title)', fontSize: 14,
            fontWeight: page === 'search' ? 700 : 400,
            color: 'var(--ink-primary)',
            borderBottom: page === 'search' ? '2.5px solid var(--ink-primary)' : '2.5px solid transparent',
            transition: 'all 150ms ease',
          }}
        >
          搜索
        </button>
      </div>

      {page === 'drill' ? <Drill /> : page === 'leaderboard' ? <Leaderboard /> : page === 'analysis' ? <Analysis /> : <Search />}
      <SoundControl />
    </div>
  );
}
