import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, getDueWords, getMemory } from '../utils/storage';
import { getLevelLabel, sortReviewQueue, calcNextReview } from '../utils/ebbinghaus';

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
      setQueue(sorted);
      setCurrent(sorted[0] || null);
      setIndex(0);
      setStats({ total: sorted.length, remaining: sorted.length, done: 0 });
      setLoading(false);
    }
    load();
  }, []);

  async function markReview(quality) {
    if (!current) return;
    const word = current.word;
    const memRecord = await db.memory.get(word) || {
      word,
      level: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReview: null,
      lastReview: null,
      errorCount: 0,
    };
    const result = calcNextReview(quality, memRecord);
    await db.memory.put({
      ...memRecord,
      level: result.level,
      interval: result.interval,
      easeFactor: result.easeFactor,
      nextReview: result.nextReview,
      lastReview: Date.now(),
    });

    const nextIdx = index + 1;
    if (nextIdx >= queue.length) {
      setDone(true);
    } else {
      setIndex(nextIdx);
      setCurrent(queue[nextIdx]);
      setShowAnswer(false);
    }
    setStats(prev => ({
      ...prev,
      remaining: prev.remaining - 1,
      done: prev.done + (quality >= 3 ? 1 : 0),
    }));
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
        加载中...
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-title)', color: 'var(--ink-primary)' }}>
          太棒了！
        </h2>
        <p style={{ color: 'var(--ink-tertiary)', marginTop: 8 }}>
          目前没有需要复习的单词
        </p>
        <Link to="/library">
          <button style={{
            marginTop: 16, padding: '10px 24px',
            background: 'var(--wine-red)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 14,
          }}>
            去学习新词
          </button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-title)', color: 'var(--ink-primary)' }}>
          复习完成！
        </h2>
        <div style={{
          marginTop: 20, padding: 20,
          background: 'var(--paper-mid)',
          borderRadius: 'var(--radius-lg)',
          display: 'inline-block',
        }}>
          <p style={{ fontSize: 14, color: 'var(--ink-primary)' }}>
            本次复习 <strong>{stats.total}</strong> 词
          </p>
          <p style={{ fontSize: 14, color: 'var(--ink-green)', marginTop: 4 }}>
            掌握 <strong>{stats.done}</strong> 词
          </p>
        </div>
        <div style={{ marginTop: 16 }}>
          <Link to="/">
            <button style={{
              padding: '10px 24px',
              background: 'var(--wine-red)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 14,
            }}>
              返回首页
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const w = current;

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* 顶部进度 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245, 237, 224, 0.98)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--paper-shadow)',
        padding: '12px 16px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>
            复习进度
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>
            {index + 1} / {queue.length}
          </span>
        </div>
        <div style={{
          height: 4,
          background: 'var(--paper-shadow)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((index) / queue.length) * 100}%`,
            background: 'var(--wine-red)',
            transition: 'width 0.3s ease',
          }} />
        </div>
        {w && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              fontSize: 10, background: 'var(--paper-base)',
              color: 'var(--ink-tertiary)',
            }}>
              {w.priority || 'NEW'}
            </span>
            {w.mem?.level > 0 && (
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                fontSize: 10, background: 'var(--ink-green)',
                color: 'white',
              }}>
                {getLevelLabel(w.mem.level)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 卡片 */}
      {w && (
        <div style={{ padding: 16 }}>
          <div
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              background: 'var(--paper-mid)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 20px',
              textAlign: 'center',
              border: '1px solid var(--paper-shadow)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.2s',
            }}
          >
            <h1 style={{
              fontFamily: 'var(--font-word)',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}>
              {w.word}
            </h1>
            {w.phonetic && (
              <p style={{
                fontFamily: 'var(--font-phonetic)',
                fontSize: 'var(--text-lg)',
                color: 'var(--ink-tertiary)',
                marginBottom: 4,
              }}>
                {w.phonetic}
              </p>
            )}
            {w.pos && w.pos.length > 0 && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                {w.pos.map(p => (
                  <span key={p} style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 10,
                    background: 'var(--paper-base)',
                    color: 'var(--ink-secondary)',
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            )}

            {!showAnswer && (
              <div style={{ marginTop: 24, color: 'var(--ink-tertiary)', fontSize: 13 }}>
                点击查看释义
              </div>
            )}
          </div>

          {showAnswer && (
            <div style={{
              marginTop: 16,
              background: 'var(--paper-base)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              border: '1px solid var(--paper-shadow)',
              animation: 'fade-in-up 0.3s ease',
            }}>
              {/* 释义 */}
              {w.definitions && w.definitions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {w.definitions.map((def, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      {def.pos && (
                        <span style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 10,
                          background: 'var(--paper-shadow)',
                          color: 'var(--ink-tertiary)',
                          marginRight: 4,
                        }}>
                          {def.pos}
                        </span>
                      )}
                      <span style={{ fontSize: 14, color: 'var(--ink-primary)' }}>
                        {def.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 例句 */}
              {w.examples && w.examples.length > 0 && (
                <div style={{
                  padding: 12,
                  background: 'var(--paper-mid)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 12,
                }}>
                  <p style={{
                    fontSize: 13, color: 'var(--ink-primary)',
                    fontStyle: 'italic', lineHeight: 1.5,
                  }}>
                    "{w.examples[0].en}"
                  </p>
                  {w.examples[0].cn && (
                    <p style={{
                      fontSize: 12, color: 'var(--ink-secondary)',
                      marginTop: 4, lineHeight: 1.4,
                    }}>
                      {w.examples[0].cn}
                    </p>
                  )}
                </div>
              )}

              {/* 记忆法 */}
              {w.memory && w.memory.length > 0 && (
                <div style={{
                  padding: 10,
                  background: 'rgba(196, 145, 90, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--amber)',
                  marginBottom: 12,
                }}>
                  <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, marginBottom: 4 }}>
                    {w.memory[0].type}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                    {w.memory[0].content}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 底部操作 */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0,
        background: 'rgba(245, 237, 224, 0.98)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--paper-shadow)',
        padding: '12px 16px',
        zIndex: 90,
      }}>
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            style={{
              width: '100%', padding: '14px',
              background: 'var(--wine-red)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 15, fontWeight: 600,
            }}
          >
            显示答案
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => markReview(1)}
              style={{
                flex: 1, padding: '12px',
                background: 'var(--paper-base)',
                border: '1px solid var(--paper-shadow)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: 'var(--wine-red)',
              }}
            >
              模糊
            </button>
            <button
              onClick={() => markReview(2)}
              style={{
                flex: 1, padding: '12px',
                background: 'var(--paper-base)',
                border: '1px solid var(--paper-shadow)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: 'var(--amber)',
              }}
            >
              记得
            </button>
            <button
              onClick={() => markReview(3)}
              style={{
                flex: 2, padding: '12px',
                background: 'var(--ink-green)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: 'white',
              }}
            >
              牢记 ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}