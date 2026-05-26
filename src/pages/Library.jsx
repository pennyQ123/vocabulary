import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllVocab, db } from '../utils/storage';
import { getLevelLabel } from '../utils/ebbinghaus';

const POS_COLORS = {
  n: { bg: '#E8F0F5', text: '#2D5A4A' },
  v: { bg: '#F5E8E8', text: '#8B3A3A' },
  adj: { bg: '#F5F0E8', text: '#7A5A2D' },
  adv: { bg: '#F0E8F5', text: '#5A2D7A' },
  phrase: { bg: '#E8F5E8', text: '#2D5A2D' },
  prep: { bg: '#F5F5E8', text: '#5A5A2D' },
  conj: { bg: '#E8F5F5', text: '#2D5A5A' },
  pron: { bg: '#F5E8F0', text: '#7A2D5A' },
  det: { bg: '#E8E8F5', text: '#2D2D5A' },
};

export default function Library() {
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [sortBy, setSortBy] = useState('alpha');
  const [masteredFilter, setMasteredFilter] = useState('all');
  const [memoryMap, setMemoryMap] = useState({});
  const navigate = useNavigate();

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

    if (posFilter !== 'all') {
      list = list.filter(v => v.pos && v.pos.includes(posFilter));
    }

    if (masteredFilter === 'mastered') {
      list = list.filter(v => (memoryMap[v.word]?.level || 0) > 0);
    } else if (masteredFilter === 'new') {
      list = list.filter(v => !memoryMap[v.word]);
    } else if (masteredFilter === 'review') {
      list = list.filter(v => {
        const m = memoryMap[v.word];
        return m && m.nextReview && m.nextReview <= Date.now();
      });
    }

    if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortBy === 'recent') {
      list = [...list].sort((a, b) => {
        const ma = memoryMap[a.word]?.lastReview || 0;
        const mb = memoryMap[b.word]?.lastReview || 0;
        return mb - ma;
      });
    } else if (sortBy === 'priority') {
      list = [...list].sort((a, b) => {
        const ma = memoryMap[a.word];
        const mb = memoryMap[b.word];
        if (!ma) return 1;
        if (!mb) return -1;
        return (ma.nextReview || Infinity) - (mb.nextReview || Infinity);
      });
    }

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
    { value: 'all', label: '全部' },
    { value: 'n', label: '名词' },
    { value: 'v', label: '动词' },
    { value: 'adj', label: '形容词' },
    { value: 'adv', label: '副词' },
    { value: 'phrase', label: '短语' },
    { value: 'prep', label: '介词' },
    { value: 'conj', label: '连词' },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 80px' }}>
      {/* 搜索栏 */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 50,
        background: 'rgba(245, 237, 224, 0.98)',
        backdropFilter: 'blur(8px)',
        padding: '12px 16px',
        borderBottom: '1px solid var(--paper-shadow)',
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--paper-base)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--paper-shadow)',
          padding: '8px 12px',
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="搜索单词、音标或释义..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
              color: 'var(--ink-primary)', outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
            }}>
              ✕
            </button>
          )}
        </div>

        {/* 筛选栏 */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <select value={posFilter} onChange={e => setPosFilter(e.target.value)} style={{
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--paper-shadow)', fontSize: 12,
            background: 'var(--paper-base)', color: 'var(--ink-primary)',
            fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}>
            {posOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={masteredFilter} onChange={e => setMasteredFilter(e.target.value)} style={{
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--paper-shadow)', fontSize: 12,
            background: 'var(--paper-base)', color: 'var(--ink-primary)',
            fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}>
            <option value="all">全部状态</option>
            <option value="mastered">已学习</option>
            <option value="new">新词</option>
            <option value="review">待复习</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--paper-shadow)', fontSize: 12,
            background: 'var(--paper-base)', color: 'var(--ink-primary)',
            fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}>
            <option value="alpha">按字母</option>
            <option value="recent">最近学习</option>
            <option value="priority">复习优先级</option>
          </select>
        </div>
      </div>

      {/* 统计栏 */}
      <div style={{
        padding: '8px 16px',
        fontSize: 12, color: 'var(--ink-tertiary)',
        display: 'flex', gap: 12,
      }}>
        <span>共 {filtered.length} 词</span>
        {masteredFilter === 'mastered' && <span style={{ color: 'var(--ink-green)' }}>已掌握 {filtered.length}</span>}
        {masteredFilter === 'new' && <span style={{ color: 'var(--amber)' }}>新词 {filtered.length}</span>}
        {masteredFilter === 'review' && <span style={{ color: 'var(--wine-red)' }}>待复习 {filtered.length}</span>}
      </div>

      {/* 单词列表 */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <p>没有找到匹配的单词</p>
          <button onClick={() => { setSearch(''); setPosFilter('all'); setMasteredFilter('all'); }}
            style={{ marginTop: 8, padding: '6px 16px', background: 'var(--paper-base)',
              border: '1px solid var(--paper-shadow)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 12 }}>
            清除筛选
          </button>
        </div>
      ) : (
        Object.keys(grouped).sort().map(letter => (
          <div key={letter}>
            <div style={{
              padding: '6px 16px',
              background: 'var(--paper-shadow)',
              fontSize: 12, fontWeight: 700,
              color: 'var(--ink-tertiary)',
              fontFamily: 'var(--font-title)',
              letterSpacing: '0.1em',
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
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--paper-shadow)',
                    background: idx % 2 === 0 ? 'var(--paper-base)' : 'var(--paper-mid)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-mid)'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'var(--paper-base)' : 'var(--paper-mid)'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-word)',
                          fontSize: 'var(--text-lg)',
                          fontWeight: 600,
                          color: 'var(--ink-primary)',
                        }}>
                          {v.word}
                        </span>
                        {v.phonetic && (
                          <span style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
                            {v.phonetic}
                          </span>
                        )}
                        {v.pos && v.pos.map(p => (
                          <span key={p} style={{
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 10,
                            fontWeight: 600,
                            background: POS_COLORS[p]?.bg || '#f0f0f0',
                            color: POS_COLORS[p]?.text || '#666',
                          }}>
                            {p}
                          </span>
                        ))}
                        {level > 0 && (
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 10,
                            background: isDue ? 'var(--wine-red)' : 'var(--ink-green)',
                            color: 'white',
                          }}>
                            {getLevelLabel(level)}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 12, color: 'var(--ink-secondary)',
                        marginTop: 4, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {v.definitions[0]?.meaning || ''}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 16,
                      color: isDue ? 'var(--wine-red)' : level > 0 ? 'var(--ink-green)' : 'var(--ink-tertiary)',
                    }}>
                      {isDue ? '📝' : level > 0 ? '✓' : '○'}
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