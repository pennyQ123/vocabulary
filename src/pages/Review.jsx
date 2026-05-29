import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, getDueWords } from '../store/drillStore';
import { getLevelLabel, sortReviewQueue, calcNextReview } from '../utils/ebbinghaus';

const paperCard = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-paper)',
};

export default function Review() {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ total: 0, remaining: 0, done: 0 });

  useEffect(() => {
    async function load() {
      const due = await getDueWords();
      const sorted = sortReviewQueue(due);
      setQueue(sorted); setCurrent(sorted[0] || null); setIndex(0);
      setStats({ total: sorted.length, remaining: sorted.length, done: 0 });
      setLoading(false);
    }
    load();
  }, []);

  async function markReview(quality) {
    if (!current) return;
    const word = current.word;
    const memRecord = await db.memory.get(word) || { word, level: 0, interval: 0, easeFactor: 2.5, nextReview: null, lastReview: null, errorCount: 0 };
    const result = calcNextReview(quality, memRecord);
    await db.memory.put({ ...memRecord, level: result.level, interval: result.interval, easeFactor: result.easeFactor, nextReview: result.nextReview, lastReview: Date.now() });
    const nextIdx = index + 1;
    if (nextIdx >= queue.length) { setDone(true); }
    else { setIndex(nextIdx); setCurrent(queue[nextIdx]); setShowAnswer(false); }
    setStats(prev => ({ ...prev, remaining: prev.remaining - 1, done: prev.done + (quality >= 3 ? 1 : 0) }));
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faded)' }}>加载中...</div>
  );

  if (queue.length === 0) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12, color: 'var(--lotus)', filter: 'drop-shadow(0 4px 12px rgba(184, 138, 58, 0.30))' }}>✦</div>
      <h2 style={{ fontSize: 22, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 8 }}>太棒了！</h2>
      <p style={{ color: 'var(--ink-faded)', fontSize: 14 }}>目前没有需要复习的单词</p>
      <Link to="/library">
        <button style={{ marginTop: 18, padding: '10px 24px', background: 'var(--lotus-dark)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: 'var(--shadow-button)' }}>
          去学习新词
        </button>
      </Link>
    </div>
  );

  if (done) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
      <h2 style={{ fontSize: 24, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 8 }}>复习完成！</h2>
      <div style={{ ...paperCard, display: 'inline-block', padding: 22, marginTop: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--ink-primary)' }}>本次复习 <strong>{stats.total}</strong> 词</p>
        <p style={{ fontSize: 14, color: 'var(--night-sea)', marginTop: 6 }}>掌握 <strong>{stats.done}</strong> 词</p>
      </div>
      <div style={{ marginTop: 18 }}>
        <Link to="/">
          <button style={{ padding: '10px 24px', background: 'var(--lotus-dark)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: 'var(--shadow-button)' }}>
            返回首页
          </button>
        </Link>
      </div>
    </div>
  );

  const w = current;

  function undoLast() {
    setShowAnswer(false);
  }

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--paper-surface)',
        borderBottom: '1px solid var(--border-medium)',
        padding: '12px 16px',
        boxShadow: '0 2px 12px rgba(30, 44, 35, 0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-faded)' }}>复习进度</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-primary)' }}>{index + 1} / {queue.length}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(184, 138, 58, 0.12)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(index / queue.length) * 100}%`, background: 'var(--lotus-dark)', transition: 'width 0.3s ease' }} />
        </div>
        {w && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, background: 'rgba(184, 138, 58, 0.10)', color: 'var(--lotus-dark)', fontWeight: 600 }}>{w.priority || 'NEW'}</span>
            {w.mem?.level > 0 && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, background: 'var(--night-sea)', color: 'white' }}>{getLevelLabel(w.mem.level)}</span>}
          </div>
        )}
        {showAnswer && (
          <button onClick={undoLast} style={{
            marginTop: 8, padding: '6px 12px',
            background: 'var(--paper-bg)',
            border: '1px solid var(--border-medium)',
            borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--ink-secondary)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ↩ 重新选择
          </button>
        )}
      </div>

      {/* Card */}
      {w && (
        <div style={{ padding: 16 }}>
          <div onClick={() => setShowAnswer(!showAnswer)} style={{
            ...paperCard,
            padding: '32px 22px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '2.6rem', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
              {w.word}
            </h1>
            {w.phonetic && <p style={{ fontFamily: 'var(--font-phonetic)', fontSize: 15, color: 'var(--ink-faded)', marginBottom: 4 }}>{w.phonetic}</p>}
            {w.pos && w.pos.length > 0 && (
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 8 }}>
                {w.pos.map(p => (
                  <span key={p} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(184, 138, 58, 0.08)', color: 'var(--lotus-dark)', border: '1px solid rgba(184, 138, 58, 0.15)' }}>{p}</span>
                ))}
              </div>
            )}
            {!showAnswer && <div style={{ marginTop: 24, color: 'var(--ink-faded)', fontSize: 13 }}>点击查看释义</div>}
          </div>

          {showAnswer && (
            <div style={{ ...paperCard, marginTop: 14, padding: 20, animation: 'fade-in-up 0.3s ease' }}>
              {w.definitions && w.definitions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {w.definitions.map((def, idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      {def.pos && <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, background: 'rgba(61, 90, 74, 0.08)', color: 'var(--night-sea)', marginRight: 5 }}>{def.pos}</span>}
                      <span style={{ fontSize: 14, color: 'var(--ink-primary)', lineHeight: 1.6 }}>{def.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
              {w.examples && w.examples.length > 0 && (
                <div style={{ padding: 12, background: 'rgba(184, 138, 58, 0.05)', borderRadius: 8, marginBottom: 12, borderLeft: '3px solid var(--lotus)' }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>"{w.examples[0].en}"</p>
                  {w.examples[0].cn && <p style={{ fontSize: 12, color: 'var(--ink-faded)', marginTop: 4, lineHeight: 1.4 }}>{w.examples[0].cn}</p>}
                </div>
              )}
              {w.memory && w.memory.length > 0 && (
                <div style={{ padding: 10, background: 'rgba(184, 138, 58, 0.05)', borderRadius: 8, borderLeft: '3px solid var(--lotus)', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--lotus)', fontWeight: 650, marginBottom: 4 }}>{w.memory[0].type}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-primary)', lineHeight: 1.5 }}>{w.memory[0].content}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0,
        background: 'var(--paper-surface)',
        borderTop: '1px solid var(--border-medium)',
        padding: '12px 16px', zIndex: 90,
        boxShadow: '0 -4px 16px rgba(30, 44, 35, 0.08)',
      }}>
        {!showAnswer ? (
          <button onClick={() => setShowAnswer(true)} style={{
            width: '100%', padding: '14px',
            background: 'var(--lotus-dark)',
            color: 'white', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 15, fontWeight: 650,
            boxShadow: 'var(--shadow-button)',
          }}>
            显示答案
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => markReview(1)} style={{ flex: 1, padding: '12px', background: 'var(--paper-bg)', border: '1px solid var(--border-medium)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 650, color: 'var(--lotus-dark)' }}>模糊</button>
            <button onClick={() => markReview(2)} style={{ flex: 1, padding: '12px', background: 'var(--paper-bg)', border: '1px solid var(--border-medium)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 650, color: 'var(--lotus)' }}>记得</button>
            <button onClick={() => markReview(3)} style={{ flex: 2, padding: '12px', background: 'var(--night-sea)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 650, color: 'white' }}>牢记 ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}
