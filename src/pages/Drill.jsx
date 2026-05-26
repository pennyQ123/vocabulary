import { useState, useEffect, useCallback } from 'react';
import { getDrillQueue, setDrillResult } from '../store/drillStore';
import './Drill.css';

export default function Drill() {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('question'); // question | reveal
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [animating, setAnimating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    async function build() {
      const q = await getDrillQueue();
      setQueue(q.slice(0, 30));
      setLoading(false);
    }
    build();
  }, []);

  const current = queue[index];

  const handleJudge = useCallback(async (known) => {
    if (!current || animating) return;
    setLastResult(known ? 'correct' : 'wrong');
    setAnimating(true);
    setPhase('reveal');
    await setDrillResult(current.word, known);
    setSessionStats(s => ({
      ...s,
      correct: s.correct + (known ? 1 : 0),
      wrong: s.wrong + (known ? 0 : 1),
    }));
    setTimeout(() => setAnimating(false), 350);
  }, [current, animating]);

  const handleNext = useCallback(() => {
    setLastResult(null);
    setPhase('question');
    if (index + 1 >= queue.length) {
      setSessionDone(true);
    } else {
      setIndex(i => i + 1);
    }
  }, [index, queue.length]);

  const restart = async () => {
    const q = await getDrillQueue();
    setQueue(q.slice(0, 30));
    setIndex(0);
    setPhase('question');
    setSessionStats({ correct: 0, wrong: 0 });
    setSessionDone(false);
    setLastResult(null);
  };

  if (loading) {
    return (
      <div className="drill-loading">
        <div className="drill-loading__spinner" />
        <p>正在加载词库...</p>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="drill-session-done">
        <div className="drill-session-done__card">
          <div className="drill-session-done__stamp">
            {sessionStats.wrong === 0 ? 'COMPLETE' : 'REVIEWED'}
          </div>
          <h2 className="drill-session-done__title">本轮结束</h2>
          <div className="drill-session-done__stats">
            <div className="drill-stat drill-stat--correct">
              <span className="drill-stat__num">{sessionStats.correct}</span>
              <span className="drill-stat__label">认识</span>
            </div>
            <div className="drill-session-done__divider" />
            <div className="drill-stat drill-stat--wrong">
              <span className="drill-stat__num">{sessionStats.wrong}</span>
              <span className="drill-stat__label">再记</span>
            </div>
          </div>
          <div className="drill-session-done__rate">
            {sessionStats.correct + sessionStats.wrong > 0
              ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100)
              : 0}% 正确率
          </div>
          <button className="drill-btn drill-btn--restart" onClick={restart}>
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const word = current.word;
  const phonetic = current.phonetic || '';
  const definitions = current.definitions || [];
  const memory = current.memory || '';
  const pos = Array.isArray(current.pos) ? current.pos : [];
  const progress = current.progress || {};

  // Parse memory text to extract related words for display
  // Memory format: "intense adj. 剧烈的，强烈的 intensively adv.深入地，密集地"
  const relatedWords = [];
  if (memory && typeof memory === 'string' && memory.trim()) {
    // Try to find word+pos patterns in memory
    const relMatch = memory.matchAll(/([a-zA-Z\-]+)\s+(adj\.?|n\.?|v\.?|adv\.?|vi\.?|vt\.?)\s*([^，,。\n]+)?/gi);
    for (const m of relMatch) {
      const [, rw, rwPos, rwDef] = m;
      if (rw.toLowerCase() !== word.toLowerCase()) {
        relatedWords.push({
          word: rw,
          pos: rwPos.replace('.', ''),
          meaning: rwDef ? rwDef.trim().replace(/[，。]$/, '') : '',
        });
      }
    }
  }

  const posColors = {
    n: { bg: 'rgba(45,90,74,0.1)', color: '#2D5A4A' },
    v: { bg: 'rgba(139,58,58,0.1)', color: '#8B3A3A' },
    adj: { bg: 'rgba(90,123,139,0.1)', color: '#5A7B8B' },
    adv: { bg: 'rgba(123,90,139,0.1)', color: '#7B5A8B' },
    vt: { bg: 'rgba(139,58,58,0.1)', color: '#8B3A3A' },
    vi: { bg: 'rgba(139,58,58,0.1)', color: '#8B3A3A' },
  };

  return (
    <div className="drill">
      {/* Header */}
      <div className="drill-header">
        <div className="drill-header__counter">
          <span className="drill-header__current">{index + 1}</span>
          <span className="drill-header__sep">/</span>
          <span className="drill-header__total">{queue.length}</span>
        </div>
        <div className="drill-header__bar">
          <div className="drill-header__fill" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
        <div className="drill-header__session-stats">
          <span className="drill-stat-inline drill-stat-inline--correct">✓ {sessionStats.correct}</span>
          <span className="drill-stat-inline drill-stat-inline--wrong">✗ {sessionStats.wrong}</span>
        </div>
      </div>

      {/* Priority badge */}
      {progress.unknownCount > 0 && (
        <div className="drill-priority-badge">
          <span className="drill-priority-badge__dot" />
          本词已忘记 {progress.unknownCount} 次
        </div>
      )}

      {/* Card */}
      <div className="drill-card-wrapper">
        <div className={[
          'drill-card',
          phase === 'reveal' ? 'drill-card--revealed' : '',
          animating ? `drill-card--anim-${lastResult}` : '',
        ].join(' ')}>

          {phase === 'reveal' && (
          <div className="drill-card__topbar">
            {pos.length > 0 && (
              <div className="drill-card__pos-tags">
                {pos.map(p => (
                  <span
                    key={p}
                    className="drill-pos-tag"
                    style={posColors[p] ? {
                      background: posColors[p].bg,
                      color: posColors[p].color,
                    } : {}}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
            {relatedWords.length > 0 && (
              <span className="drill-card__word-group-tag">辨析</span>
            )}
          </div>
          )}

          {/* Word */}
          <div className="drill-card__word">{word}</div>
          {phase === 'reveal' && phonetic && (
            <div className="drill-card__phonetic">{phonetic}</div>
          )}

          <div className="drill-card__divider" />

          {/* Revealed section */}
          {phase === 'reveal' && (
            <div className="drill-card__reveal">
              {/* Meanings */}
              <ul className="drill-card__def-list">
                {definitions.length > 0 ? definitions.map((d, i) => (
                  <li key={i} className="drill-card__def-item">
                    {typeof d === 'string' ? d : d.meaning}
                  </li>
                )) : (
                  <li className="drill-card__def-empty">（暂无释义）</li>
                )}
              </ul>

              {/* Related words from memory field */}
              {relatedWords.length > 0 && (
                <div className="drill-card__word-group">
                  <div className="drill-card__word-group-title">形近词·近义词</div>
                  <div className="drill-card__word-group-list">
                    {relatedWords.map((rw, i) => (
                      <div key={i} className="drill-card__related-word">
                        <span
                          className="drill-related-word__text"
                          style={posColors[rw.pos] ? {
                            background: posColors[rw.pos].bg,
                            color: posColors[rw.pos].color,
                          } : {}}
                        >
                          {rw.word}
                          {rw.pos && <span className="drill-related-word__pos"> {rw.pos}</span>}
                        </span>
                        {rw.meaning && (
                          <span className="drill-related-word__meaning">{rw.meaning}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw memory if no related words extracted */}
              {relatedWords.length === 0 && memory && typeof memory === 'string' && memory.trim() && (
                <div className="drill-card__memory">
                  <div className="drill-card__memory-label">辨析</div>
                  <div className="drill-card__memory-content">{memory}</div>
                </div>
              )}

              {/* Examples */}
              {current.examples && current.examples.length > 0 && (
                <div className="drill-card__examples">
                  <div className="drill-card__examples-label">例句</div>
                  {current.examples.slice(0, 2).map((ex, i) => (
                    <div key={i} className="drill-card__example-item">{ex}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stamp overlay */}
          {lastResult && (
            <div className={`drill-card__stamp drill-card__stamp--${lastResult}`}>
              {lastResult === 'correct' ? '认识' : '再记'}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="drill-actions">
        {phase === 'question' ? (
          <div className="drill-actions__judge">
            <button
              className="drill-btn drill-btn--wrong"
              onClick={() => handleJudge(false)}
              disabled={animating}
            >
              <span className="drill-btn__icon">✗</span>
              <span className="drill-btn__text">不认识</span>
            </button>
            <button
              className="drill-btn drill-btn--correct"
              onClick={() => handleJudge(true)}
              disabled={animating}
            >
              <span className="drill-btn__icon">✓</span>
              <span className="drill-btn__text">认识</span>
            </button>
          </div>
        ) : (
          <button className="drill-btn drill-btn--next" onClick={handleNext}>
            下一个
          </button>
        )}
      </div>

      <div className="drill-hint">
        {phase === 'question'
          ? '先回忆词义，判断是否认识'
          : '查看释义后，进入下一词'}
      </div>
    </div>
  );
}