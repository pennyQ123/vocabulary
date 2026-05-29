import { useState, useEffect } from 'react';
import synonymsData from '../data/synonyms.json';
import './Analysis.css';

export default function Analysis() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'has' | 'none'

  useEffect(() => {
    setLoading(false);
  }, []);

  const words = Object.entries(synonymsData).map(([word, data]) => ({
    word,
    pos: data.pos || '',
    definitions: data.definitions || [],
    synonyms: data.synonyms || [],
    hasAnalysis: data.synonyms && data.synonyms.length > 0,
  }));

  const filtered = words.filter(w => {
    if (filter === 'has') return w.hasAnalysis;
    if (filter === 'none') return !w.hasAnalysis;
    return true;
  });

  const posColors = {
    n: { bg: 'rgba(74, 122, 90, 0.10)', color: 'var(--night-sea)' },
    v: { bg: 'rgba(139, 74, 74, 0.10)', color: 'var(--lotus-dark)' },
    adj: { bg: 'rgba(184, 120, 58, 0.12)', color: 'var(--lotus-dark)' },
    adv: { bg: 'rgba(107, 106, 138, 0.10)', color: 'var(--night-sea)' },
    vt: { bg: 'rgba(139, 74, 74, 0.10)', color: 'var(--lotus-dark)' },
    vi: { bg: 'rgba(139, 74, 74, 0.10)', color: 'var(--lotus-dark)' },
    短语: { bg: 'rgba(184, 120, 58, 0.10)', color: '#B8783A' },
  };

  const stats = {
    total: words.length,
    hasAnalysis: words.filter(w => w.hasAnalysis).length,
    none: words.filter(w => !w.hasAnalysis).length,
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-faded)' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* Header */}
      <div className="analysis-header">
        <h1 className="analysis-title">近义词辨析</h1>
        <p className="analysis-subtitle">雅思易混淆词 · 独立词库</p>
      </div>

      {/* Stats bar */}
      <div className="analysis-stats">
        <div className="analysis-stat">
          <span className="analysis-stat__num">{stats.total}</span>
          <span className="analysis-stat__label">总词数</span>
        </div>
        <div className="analysis-stat analysis-stat--green">
          <span className="analysis-stat__num">{stats.hasAnalysis}</span>
          <span className="analysis-stat__label">有辨析</span>
        </div>
        <div className="analysis-stat analysis-stat--red">
          <span className="analysis-stat__num">{stats.none}</span>
          <span className="analysis-stat__label">待补充</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="analysis-filter">
        {[
          { key: 'all', label: `全部 ${stats.total}` },
          { key: 'has', label: `有辨析 ${stats.hasAnalysis}` },
          { key: 'none', label: `待补充 ${stats.none}` },
        ].map(f => (
          <button
            key={f.key}
            className={`analysis-filter__btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Word list */}
      <div className="analysis-list">
        {filtered.length === 0 && (
          <div className="analysis-empty">
            <p>暂无记录</p>
          </div>
        )}
        {filtered.map(w => (
          <div key={w.word} className={`analysis-card ${w.hasAnalysis ? 'analysis-card--has' : 'analysis-card--empty'}`}>
            <div className="analysis-card__word-row">
              <div className="analysis-card__word">{w.word}</div>
              {w.pos && (
                <div className="analysis-card__pos-tags">
                  {w.pos.split('/').map(p => (
                    <span key={p.trim()} className={`analysis-pos-tag analysis-pos-tag--${p.trim()}`}>{p.trim()}.</span>
                  ))}
                </div>
              )}
              {!w.hasAnalysis && (
                <span className="analysis-card__badge-empty">待补充</span>
              )}
            </div>

            {/* Definitions */}
            {w.definitions.length > 0 && (
              <div className="analysis-card__def">
                {w.definitions.slice(0, 2).map((d, i) => (
                  <span key={i} className="analysis-card__def-item">{d}</span>
                ))}
              </div>
            )}

            {/* Synonyms with definitions */}
            {w.hasAnalysis && (
              <div className="analysis-card__analysis">
                <div className="analysis-card__related">
                  <div className="analysis-card__related-title">近义词</div>
                  <div className="analysis-card__related-list">
                    {w.synonyms.map((syn, i) => (
                      <div key={i} className="analysis-card__related-item">
                        <span className="analysis-card__related-word">
                          {syn.word}
                        </span>
                        {syn.pos && <span className="analysis-card__related-pos">{syn.pos}.</span>}
                        {syn.meaning && (
                          <span className="analysis-card__related-meaning">{syn.meaning}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}