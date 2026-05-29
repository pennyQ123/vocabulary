import { useState, useEffect, useRef, useCallback } from 'react';
import { db, getNotes, addNote } from '../store/drillStore';

let cachedVoices = null;

function getVoices() {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve([]);
    const voices = synth.getVoices();
    if (voices.length > 0) return resolve(voices);
    synth.onvoiceschanged = () => resolve(synth.getVoices());
    setTimeout(() => resolve(synth.getVoices()), 500);
  });
}

async function speakWord(word) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = 'en-US';
  utter.rate = 0.85;
  utter.pitch = 1.05;
  if (!cachedVoices || cachedVoices.length === 0) {
    cachedVoices = await getVoices();
  }
  const preferred = cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Samantha'))
    || cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Karen'))
    || cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Zira'))
    || cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Female'))
    || cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Susan'))
    || cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Linda'))
    || cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Mary'))
    || cachedVoices.find(v => v.lang === 'en-US')
    || cachedVoices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;
  synth.speak(utter);
}

const posColors = {
  n: { bg: 'rgba(74, 122, 90, 0.10)', color: '#4A7A5A' },
  v: { bg: 'rgba(139, 74, 74, 0.10)', color: '#8B4A4A' },
  vt: { bg: 'rgba(139, 74, 74, 0.10)', color: '#8B4A4A' },
  vi: { bg: 'rgba(139, 74, 74, 0.10)', color: '#8B4A4A' },
  adj: { bg: 'rgba(184, 120, 58, 0.12)', color: '#B8783A' },
  adv: { bg: 'rgba(107, 106, 138, 0.10)', color: '#6B6A8A' },
};

function getDefText(def) {
  if (!def) return '';
  if (typeof def === 'string') return def;
  if (def.meaning) return def.meaning;
  return String(def);
}

function getDefinitionArray(definitions) {
  if (!definitions) return [];
  if (!Array.isArray(definitions)) return [getDefText(definitions)];
  return definitions.map(getDefText).filter(Boolean);
}

async function searchVocab(query) {
  if (!query || query.trim().length === 0) return [];

  const q = query.trim().toLowerCase();
  const isChinese = /[\u4e00-\u9fff]/.test(q);

  const all = await db.vocab.toArray();

  const results = [];
  for (const entry of all) {
    if (isChinese) {
      // Chinese search: match against definitions
      const defs = getDefinitionArray(entry.definitions);
      const matched = defs.some(d => d.includes(q));
      if (matched) results.push(entry);
    } else {
      // English search: prefix match first, then contains
      const wordLower = entry.word.toLowerCase();
      if (wordLower.startsWith(q)) {
        results.push({ ...entry, _prefix: true });
      } else if (wordLower.includes(q)) {
        results.push({ ...entry, _prefix: false });
      }
    }
  }

  // Sort: prefix matches first, then alphabetical
  if (!isChinese) {
    results.sort((a, b) => {
      if (a._prefix !== b._prefix) return a._prefix ? -1 : 1;
      return a.word.localeCompare(b.word);
    });
  }

  return results.slice(0, 100);
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [notePos, setNotePos] = useState({ x: 0, y: 0 });
  const noteSaveTimer = useRef(null);
  const noteDragRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const r = await searchVocab(query);
      setResults(r);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const toggleExpand = useCallback((word) => {
    const newWord = expanded === word ? null : word;
    setExpanded(newWord);
    if (newWord) {
      // Load note
      (async () => {
        try {
          const res = await fetch('/api/notes?word=' + encodeURIComponent(newWord));
          if (res.ok) { const d = await res.json(); setNoteText(d.content || ''); return; }
        } catch (e) {}
        const notes = await getNotes(newWord);
        setNoteText(notes.length > 0 ? (notes[0].content || '') : '');
      })();
    } else {
      setNoteText('');
    }
  }, [expanded]);

  // Save note
  const saveSearchNote = useCallback((word, text) => {
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(async () => {
      const trimmed = text.trim();
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, content: trimmed }),
        });
      } catch (e) {}
      try {
        const existing = await getNotes(word);
        if (existing.length > 0) {
          if (trimmed) await db.notes.update(existing[0].id, { content: trimmed });
          else await db.notes.delete(existing[0].id);
        } else if (trimmed) {
          await addNote({ word, content: trimmed });
        }
      } catch (e) {}
    }, 500);
  }, []);

  // Drag handler
  const handleNoteDragStart = useCallback((e) => {
    const el = noteDragRef.current; if (!el) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = clientX - notePos.x, startY = clientY - notePos.y;
    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      setNotePos({ x: cx - startX, y: cy - startY });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    e.preventDefault();
  }, [notePos]);

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* Search input */}
      <div style={{
        padding: '16px 16px 14px',
        position: 'sticky', top: 48, zIndex: 10,
        background: 'var(--paper-bg)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--paper-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 12,
          padding: '0 14px',
          boxShadow: 'var(--shadow-paper)',
        }}>
          <span style={{
            fontSize: 18, color: 'var(--ink-faded)',
            marginRight: 10, flexShrink: 0,
          }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入英文或中文搜索单词..."
            style={{
              flex: 1, padding: '14px 0',
              background: 'none', border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', fontSize: 16,
              color: 'var(--ink-primary)',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 16, color: 'var(--ink-faded)', padding: 4,
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: '0 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-faded)' }}>
            搜索中...
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-faded)' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>⌕</div>
            <div style={{ fontSize: 15 }}>未找到 "{query}" 的相关单词</div>
          </div>
        )}

        {!query && (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--ink-faded)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2, filter: 'drop-shadow(0 4px 12px rgba(184, 138, 58, 0.30))' }}>✦</div>
            <div style={{ fontSize: 15 }}>输入英文单词或中文释义进行搜索</div>
            <div style={{ fontSize: 13, marginTop: 6, opacity: 0.6 }}>共收录 10,771 个词条</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div style={{
              fontSize: 13, color: 'var(--ink-faded)',
              padding: '4px 0 10px', textAlign: 'center',
            }}>
              找到 {results.length} 个结果
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(entry => {
                const isOpen = expanded === entry.word;
                const pos = Array.isArray(entry.pos) ? entry.pos : [];
                const defs = getDefinitionArray(entry.definitions);
                const examples = entry.examples || [];
                const collocations = entry.collocations || [];
                const memory = entry.memory || [];

                return (
                  <div
                    key={entry.word}
                    onClick={() => toggleExpand(entry.word)}
                    style={{
                      background: 'var(--paper-surface)',
                      border: `1px solid ${isOpen ? 'var(--lotus)' : 'var(--border-light)'}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      boxShadow: isOpen ? 'var(--shadow-paper-hover)' : 'var(--shadow-paper)',
                      cursor: 'pointer',
                      transition: 'all 180ms ease',
                    }}
                  >
                    {/* Always visible: word row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-word)',
                        fontSize: 20, fontWeight: 700,
                        color: 'var(--ink-primary)',
                      }}>{entry.word}</span>
                      <button
                        onClick={e => { e.stopPropagation(); speakWord(entry.word); }}
                        title="发音"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 16, padding: '2px 4px', lineHeight: 1,
                          opacity: 0.7, transition: 'opacity 150ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                      >🔊</button>
                      {entry.phonetic && (
                        <span style={{
                          fontFamily: 'var(--font-phonetic)',
                          fontSize: 12, color: 'var(--ink-faded)',
                        }}>{entry.phonetic}</span>
                      )}
                      {pos.map(p => {
                        const c = posColors[p] || posColors.n;
                        return (
                          <span key={p} style={{
                            fontFamily: 'var(--font-title)', fontSize: 10, fontWeight: 600,
                            padding: '2px 6px', borderRadius: 4,
                            background: c.bg, color: c.color,
                            border: `1px solid ${c.color}22`,
                          }}>{p}.</span>
                        );
                      })}
                      {isOpen && (
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--lotus)' }}>▲</span>
                      )}
                    </div>

                    {/* Always visible: first definition */}
                    {defs.length > 0 && (
                      <div style={{
                        fontFamily: 'var(--font-body)', fontSize: 13,
                        color: 'var(--ink-secondary)', marginTop: 6,
                        lineHeight: 1.6,
                      }}>
                        {defs.length === 1 ? defs[0] : defs.slice(0, 2).join('；')}
                      </div>
                    )}

                    {/* Expanded details */}
                    {isOpen && (
                      <div style={{
                        marginTop: 12, paddingTop: 12,
                        borderTop: '1px solid rgba(184, 138, 58, 0.15)',
                        animation: 'fadeIn 200ms ease',
                      }}>
                        {/* Full definitions */}
                        {defs.length > 1 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{
                              fontFamily: 'var(--font-title)', fontSize: 11,
                              color: 'var(--ink-faded)', fontWeight: 600,
                              letterSpacing: '0.12em', textTransform: 'uppercase',
                              marginBottom: 4,
                            }}>全部释义</div>
                            {defs.map((d, i) => (
                              <div key={i} style={{
                                fontFamily: 'var(--font-body)', fontSize: 13,
                                color: 'var(--ink-secondary)', lineHeight: 1.6,
                                paddingLeft: 8,
                              }}>· {d}</div>
                            ))}
                          </div>
                        )}

                        {/* Memory aids */}
                        {memory.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{
                              fontFamily: 'var(--font-title)', fontSize: 11,
                              color: 'var(--ink-faded)', fontWeight: 600,
                              letterSpacing: '0.12em', textTransform: 'uppercase',
                              marginBottom: 4,
                            }}>记忆法</div>
                            {memory.map((m, i) => {
                              const content = typeof m === 'string' ? m : m.content;
                              if (!content) return null;
                              return (
                                <div key={i} style={{
                                  background: 'rgba(184, 138, 58, 0.05)',
                                  border: '1px solid rgba(184, 138, 58, 0.15)',
                                  borderRadius: 8, padding: '8px 12px', marginBottom: 4,
                                  fontFamily: 'var(--font-body)', fontSize: 13,
                                  color: 'var(--ink-secondary)', lineHeight: 1.6,
                                }}>{content}</div>
                              );
                            })}
                          </div>
                        )}

                        {/* Note in expanded card */}
                        <div ref={isOpen ? noteDragRef : null} style={{
                          marginTop: 4,
                          background: 'rgba(184, 138, 58, 0.04)',
                          border: '1px solid rgba(184, 138, 58, 0.12)',
                          borderRadius: 10,
                          padding: 10,
                        }}>
                          <div
                            onMouseDown={handleNoteDragStart}
                            onTouchStart={handleNoteDragStart}
                            style={{
                              fontFamily: 'var(--font-title)', fontSize: 10,
                              color: 'var(--ink-faded)', fontWeight: 600,
                              letterSpacing: '0.12em', textTransform: 'uppercase',
                              marginBottom: 6, cursor: 'grab', userSelect: 'none',
                            }}
                          >⠿ 笔记</div>
                          <textarea
                            value={noteText}
                            onChange={e => { setNoteText(e.target.value); saveSearchNote(entry.word, e.target.value); }}
                            placeholder="写点笔记..."
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: '100%',
                              minHeight: 80,
                              background: 'rgba(30, 44, 35, 0.02)',
                              border: '1px solid rgba(184, 138, 58, 0.10)',
                              borderRadius: 6,
                              padding: '8px 10px',
                              fontFamily: 'var(--font-body)',
                              fontSize: 12,
                              color: 'var(--ink-primary)',
                              resize: 'vertical',
                              outline: 'none',
                              lineHeight: 1.6,
                            }}
                          />
                        </div>

                        {/* Collocations */}
                        {collocations.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{
                              fontFamily: 'var(--font-title)', fontSize: 11,
                              color: 'var(--ink-faded)', fontWeight: 600,
                              letterSpacing: '0.12em', textTransform: 'uppercase',
                              marginBottom: 4,
                            }}>短语搭配</div>
                            {collocations.map((c, i) => (
                              <div key={i} style={{
                                fontFamily: 'var(--font-body)', fontSize: 13,
                                color: 'var(--ink-secondary)', lineHeight: 1.6,
                                paddingLeft: 8,
                              }}>· {c}</div>
                            ))}
                          </div>
                        )}

                        {/* Examples */}
                        {examples.length > 0 && (
                          <div>
                            <div style={{
                              fontFamily: 'var(--font-title)', fontSize: 11,
                              color: 'var(--ink-faded)', fontWeight: 600,
                              letterSpacing: '0.12em', textTransform: 'uppercase',
                              marginBottom: 6,
                            }}>例句</div>
                            {examples.map((ex, i) => (
                              <div key={i} style={{ marginBottom: 6 }}>
                                <div style={{
                                  fontFamily: 'var(--font-body)', fontSize: 13,
                                  color: 'var(--ink-primary)', lineHeight: 1.6,
                                }}>{ex.en}</div>
                                <div style={{
                                  fontFamily: 'var(--font-body)', fontSize: 12,
                                  color: 'var(--ink-faded)', lineHeight: 1.5,
                                  marginTop: 2,
                                }}>{ex.cn}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
