import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllVocab, db } from '../store/drillStore';
import { getLevelLabel } from '../utils/ebbinghaus';

const POS_COLORS = {
  n: { bg: 'rgba(61, 90, 74, 0.08)', text: 'var(--night-sea)' },
  v: { bg: 'rgba(139, 69, 69, 0.08)', text: 'var(--lotus-dark)' },
  adj: { bg: 'rgba(184, 138, 58, 0.08)', text: 'var(--lotus-dark)' },
  adv: { bg: 'rgba(61, 90, 74, 0.08)', text: 'var(--night-sea)' },
  phrase: { bg: 'rgba(184, 138, 58, 0.06)', text: 'var(--lotus)' },
  prep: { bg: 'rgba(61, 90, 74, 0.06)', text: 'var(--night-sea)' },
  conj: { bg: 'rgba(92, 61, 46, 0.08)', text: 'var(--ink-secondary)' },
  pron: { bg: 'rgba(139, 69, 69, 0.06)', text: 'var(--lotus-dark)' },
};

const paperCard = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-paper)',
};

const paperInput = {
  background: 'var(--paper-bg)',
  border: '1px solid var(--border-medium)',
  borderRadius: 8,
  boxShadow: 'inset 0 1px 4px rgba(30, 44, 35, 0.06)',
};

export default function Library() {
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [sortBy, setSortBy] = useState('alpha');
  const [masteredFilter, setMasteredFilter] = useState('all');
  const [memoryMap, setMemoryMap] = useState({});

  useEffect(() => {
    async function load() {
      const data = await getAllVocab();
      const mem = await db.memory.toArray();
      const memMap = {};
      mem.forEach(m => { memMap[m.word] = m; });
      setMemoryMap(memMap);
      setVocab(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = vocab;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(v =>
        v.word.toLowerCase().includes(q) ||
        (v.phonetic && v.phonetic.includes(q)) ||
        v.definitions.some(d => d.meaning.toLowerCase().includes(q))
      );
    }
    if (posFilter !== 'all') list = list.filter(v => v.pos && v.pos.includes(posFilter));
    if (masteredFilter === 'mastered') list = list.filter(v => (memoryMap[v.word]?.level || 0) > 0);
    else if (masteredFilter === 'new') list = list.filter(v => !memoryMap[v.word]);
    else if (masteredFilter === 'review') list = list.filter(v => { const m = memoryMap[v.word]; return m && m.nextReview && m.nextReview <= Date.now(); });

    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.word.localeCompare(b.word));
    else if (sortBy === 'recent') list = [...list].sort((a, b) => (memoryMap[b.word]?.lastReview || 0) - (memoryMap[a.word]?.lastReview || 0));
    else if (sortBy === 'priority') list = [...list].sort((a, b) => { const ma = memoryMap[a.word]; const mb = memoryMap[b.word]; if (!ma) return 1; if (!mb) return -1; return (ma.nextReview || Infinity) - (mb.nextReview || Infinity); });
    return list;
  }, [vocab, search, posFilter, sortBy, masteredFilter, memoryMap]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(v => {
      const letter = v.word[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(v);
    });
    return groups;
  }, [filtered]);

  const posOptions = [
    { value: 'all', label: '全部' }, { value: 'n', label: '名词' }, { value: 'v', label: '动词' },
    { value: 'adj', label: '形容词' }, { value: 'adv', label: '副词' },
    { value: 'phrase', label: '短语' }, { value: 'prep', label: '介词' }, { value: 'conj', label: '连词' },
  ];

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faded)' }}>加载中...</div>
  );

  const paperSelect = {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid var(--border-medium)',
    fontSize: 12,
    background: 'var(--paper-bg)',
    color: 'var(--ink-primary)',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '0 0 84px' }}>
      {/* Search sticky bar */}
      <div style={{
        position: 'sticky', top: 54, zIndex: 50,
        background: 'var(--paper-bg)',
        borderBottom: '1px solid var(--border-medium)',
        padding: '12px 16px',
        boxShadow: '0 2px 12px rgba(30, 44, 35, 0.06)',
      }}>
        <div style={{ ...paperInput, display: 'flex', gap: 8, alignItems: 'center', padding: '9px 14px' }}>
          <span style={{ fontSize: 16, color: 'var(--ink-faded)' }}>⌕</span>
          <input type="text" placeholder="搜索单词、音标或释义..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--ink-primary)', outline: 'none', fontFamily: 'var(--font-body)' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink-faded)' }}>✕</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <select value={posFilter} onChange={e => setPosFilter(e.target.value)} style={paperSelect}>
            {posOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={masteredFilter} onChange={e => setMasteredFilter(e.target.value)} style={paperSelect}>
            <option value="all">全部状态</option><option value="mastered">已学习</option><option value="new">新词</option><option value="review">待复习</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={paperSelect}>
            <option value="alpha">按字母</option><option value="recent">最近学习</option><option value="priority">复习优先级</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--ink-faded)', display: 'flex', gap: 14 }}>
        <span>共 {filtered.length} 词</span>
        {masteredFilter === 'mastered' && <span style={{ color: 'var(--night-sea)' }}>已掌握 {filtered.length}</span>}
        {masteredFilter === 'new' && <span style={{ color: 'var(--lotus)' }}>新词 {filtered.length}</span>}
        {masteredFilter === 'review' && <span style={{ color: 'var(--lotus-dark)' }}>待复习 {filtered.length}</span>}
      </div>

      {/* Word list */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding: 50, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>◇</div>
          <p style={{ color: 'var(--ink-faded)', fontSize: 14 }}>没有找到匹配的单词</p>
          <button onClick={() => { setSearch(''); setPosFilter('all'); setMasteredFilter('all'); }}
            style={{ marginTop: 12, padding: '8px 20px', background: 'var(--paper-surface)', border: '1px solid var(--border-medium)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--ink-secondary)', boxShadow: 'var(--shadow-button)' }}>
            清除筛选
          </button>
        </div>
      ) : (
        Object.keys(grouped).sort().map(letter => (
          <div key={letter}>
            <div style={{
              padding: '7px 16px',
              background: 'rgba(184, 138, 58, 0.06)',
              fontSize: 12, fontWeight: 700,
              color: 'var(--lotus)',
              fontFamily: 'var(--font-title)',
              letterSpacing: '0.12em',
            }}>
              {letter}
            </div>
            {grouped[letter].map((v, idx) => {
              const mem = memoryMap[v.word];
              const level = mem?.level || 0;
              const nextReview = mem?.nextReview;
              const isDue = nextReview && nextReview <= Date.now();
              return (
                <Link key={v.word} to={`/word/${v.word}`}>
                  <div style={{
                    padding: '13px 16px',
                    background: idx % 2 === 0 ? 'var(--paper-surface)' : 'var(--paper-bg)',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-title)', fontSize: 17, fontWeight: 600, color: 'var(--ink-primary)' }}>{v.word}</span>
                        {v.phonetic && <span style={{ fontSize: 12, color: 'var(--ink-faded)' }}>{v.phonetic}</span>}
                        {v.pos && v.pos.map(p => (
                          <span key={p} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: POS_COLORS[p]?.bg || 'rgba(100,100,100,0.06)', color: POS_COLORS[p]?.text || 'var(--ink-faded)', border: '1px solid rgba(100,100,100,0.10)' }}>{p}</span>
                        ))}
                        {level > 0 && (
                          <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, background: isDue ? 'rgba(139, 69, 69, 0.10)' : 'rgba(61, 90, 74, 0.10)', color: isDue ? 'var(--lotus-dark)' : 'var(--night-sea)', fontWeight: 600 }}>
                            {getLevelLabel(level)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-faded)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.definitions[0]?.meaning || ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 15, color: isDue ? 'var(--lotus-dark)' : level > 0 ? 'var(--night-sea)' : 'var(--ink-faded)' }}>
                      {isDue ? '◈' : level > 0 ? '◉' : '○'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
