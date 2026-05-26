import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAllVocab, db, getMemory, setMemory, addNote, getNotes, deleteNote } from '../utils/storage';
import { calcNextReview, getLevelLabel } from '../utils/ebbinghaus';

const POS_COLORS = {
  n: { bg: '#E8F0F5', text: '#2D5A4A' },
  v: { bg: '#F5E8E8', text: '#8B3A3A' },
  adj: { bg: '#F5F0E8', text: '#7A5A2D' },
  adv: { bg: '#F0E8F5', text: '#5A2D7A' },
  phrase: { bg: '#E8F5E8', text: '#2D5A2D' },
};

let audioCache = {};

export default function WordDetail() {
  const { word: wordParam } = useParams();
  const navigate = useNavigate();
  const [vocab, setVocab] = useState(null);
  const [mem, setMem] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  useEffect(() => {
    async function load() {
      const allVocab = await getAllVocab();
      const v = allVocab.find(x => x.word === wordParam);
      setVocab(v);

      if (v) {
        const m = await db.memory.get(wordParam);
        setMem(m);
        const n = await db.notes.where('word').equals(wordParam).toArray();
        setNotes(n);
      }
      setLoading(false);
    }
    load();
  }, [wordParam]);

  function playAudio(type) {
    if (!vocab) return;
    const key = `${vocab.word}_${type}`;
    if (audioCache[key]) {
      audioCache[key].currentTime = 0;
      audioCache[key].play();
      return;
    }
    const mp3Map = {
      uk: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(vocab.word)}&type=1`,
      us: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(vocab.word)}&type=2`,
    };
    if (mp3Map[type]) {
      const audio = new Audio(mp3Map[type]);
      audioCache[key] = audio;
      audio.play().catch(() => {});
      setPlaying(type);
      audio.onended = () => setPlaying(false);
    }
  }

  async function markReview(quality) {
    if (!vocab) return;
    const current = await db.memory.get(vocab.word) || {
      word: vocab.word,
      level: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReview: null,
      lastReview: null,
    };
    const { interval, easeFactor, nextReview } = calcNextReview(quality, current);
    await db.memory.put({
      ...current,
      level: quality >= 3 ? Math.min(current.level + 1, 6) : current.level,
      interval,
      easeFactor,
      nextReview,
      lastReview: Date.now(),
    });
    const m = await db.memory.get(vocab.word);
    setMem(m);
  }

  async function handleAddNote() {
    if (!noteText.trim() || !vocab) return;
    await addNote({ word: vocab.word, content: noteText.trim() });
    const n = await db.notes.where('word').equals(vocab.word).toArray();
    setNotes(n);
    setNoteText('');
    setShowNoteEditor(false);
  }

  async function handleDeleteNote(id) {
    await db.notes.delete(id);
    const n = await db.notes.where('word').equals(vocab.word).toArray();
    setNotes(n);
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
        加载中...
      </div>
    );
  }

  if (!vocab) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
        <p style={{ color: 'var(--ink-tertiary)' }}>未找到该单词</p>
        <button onClick={() => navigate(-1)} style={{
          marginTop: 8, padding: '6px 16px',
          background: 'var(--paper-base)', border: '1px solid var(--paper-shadow)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        }}>
          返回
        </button>
      </div>
    );
  }

  const level = mem?.level || 0;
  const isLearned = level > 0;
  const isDue = mem?.nextReview && mem.nextReview <= Date.now();

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* 顶部导航 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245, 237, 224, 0.98)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--paper-shadow)',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
        }}>
          ←
        </button>
        <span style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'var(--text-lg)', fontWeight: 600,
          color: 'var(--ink-primary)',
        }}>
          单词详情
        </span>
        <div style={{ width: 32 }} />
      </div>

      {/* 单词头部 */}
      <div style={{
        padding: '20px 16px',
        background: 'var(--paper-mid)',
        borderBottom: '1px solid var(--paper-shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{
            fontFamily: 'var(--font-word)',
            fontSize: '2rem', fontWeight: 700,
            color: 'var(--ink-primary)', letterSpacing: '0.02em',
          }}>
            {vocab.word}
          </h1>
          {isLearned && (
            <span style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              background: isDue ? 'var(--wine-red)' : 'var(--ink-green)',
              color: 'white',
            }}>
              {getLevelLabel(level)}
            </span>
          )}
        </div>

        {/* 音标 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {vocab.phonetic_uk && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>UK</span>
              <span style={{ fontFamily: 'var(--font-phonetic)', fontSize: 14, color: 'var(--ink-secondary)' }}>
                {vocab.phonetic_uk}
              </span>
              <button onClick={() => playAudio('uk')} disabled={playing} style={{
                background: playing ? 'var(--paper-shadow)' : 'var(--paper-base)',
                border: '1px solid var(--paper-shadow)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12,
                padding: '2px 8px',
              }}>
                {playing ? '🔊' : '🔈'}
              </button>
            </div>
          )}
          {vocab.phonetic_us && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>US</span>
              <span style={{ fontFamily: 'var(--font-phonetic)', fontSize: 14, color: 'var(--ink-secondary)' }}>
                {vocab.phonetic_us}
              </span>
              <button onClick={() => playAudio('us')} disabled={playing} style={{
                background: playing ? 'var(--paper-shadow)' : 'var(--paper-base)',
                border: '1px solid var(--paper-shadow)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12,
                padding: '2px 8px',
              }}>
                {playing ? '🔊' : '🔈'}
              </button>
            </div>
          )}
        </div>

        {/* 词性标签 */}
        {vocab.pos && vocab.pos.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {vocab.pos.map(p => (
              <span key={p} style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 600,
                background: 'var(--paper-base)',
                color: 'var(--ink-secondary)',
                border: '1px solid var(--paper-shadow)',
              }}>
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 释义 */}
      {vocab.definitions && vocab.definitions.length > 0 && (
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--paper-shadow)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            释义
          </h2>
          {vocab.definitions.map((def, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              {def.pos && (
                <span style={{
                  display: 'inline-block',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                  fontWeight: 700,
                  marginRight: 6,
                  background: 'var(--paper-shadow)',
                  color: 'var(--ink-tertiary)',
                }}>
                  {def.pos}
                </span>
              )}
              <span style={{ fontSize: 'var(--text-base)', color: 'var(--ink-primary)' }}>
                {def.meaning}
              </span>
              {def.explanation && (
                <div style={{
                  marginTop: 4, marginLeft: 0,
                  fontSize: 12, color: 'var(--ink-secondary)',
                  lineHeight: 1.5,
                }}>
                  {def.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 例句 */}
      {vocab.examples && vocab.examples.length > 0 && (
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--paper-shadow)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            例句
          </h2>
          {vocab.examples.map((ex, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <p style={{
                fontSize: 13,
                color: 'var(--ink-primary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}>
                "{ex.en}"
              </p>
              {ex.cn && (
                <p style={{
                  fontSize: 12, color: 'var(--ink-secondary)',
                  marginTop: 4, lineHeight: 1.5,
                }}>
                  {ex.cn}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 搭配 */}
      {vocab.collocations && vocab.collocations.length > 0 && (
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--paper-shadow)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            搭配
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {vocab.collocations.map((c, idx) => (
              <span key={idx} style={{
                padding: '4px 12px',
                background: 'var(--paper-base)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                border: '1px solid var(--paper-shadow)',
                color: 'var(--ink-primary)',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 记忆方法 */}
      {vocab.memory && vocab.memory.length > 0 && (
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--paper-shadow)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            记忆法
          </h2>
          {vocab.memory.map((m, idx) => (
            <div key={idx} style={{
              padding: 12,
              background: 'var(--paper-base)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 8,
              border: '1px solid var(--paper-shadow)',
            }}>
              <div style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 10,
                fontWeight: 700,
                background: 'var(--amber)',
                color: 'white',
                marginBottom: 6,
              }}>
                {m.type}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-primary)', lineHeight: 1.6 }}>
                {m.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 辨析 */}
      {vocab.synGroup && vocab.synGroup.length > 0 && (
        <div style={{
          padding: 16,
          borderBottom: '1px solid var(--paper-shadow)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            易混淆词辨析
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vocab.synGroup.map((w, idx) => (
              <Link key={w} to={`/word/${w}`}>
                <div style={{
                  padding: '8px 12px',
                  background: w === vocab.word ? 'var(--wine-red)' : 'var(--paper-base)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  border: '1px solid var(--paper-shadow)',
                  color: w === vocab.word ? 'white' : 'var(--ink-primary)',
                  fontFamily: 'var(--font-word)',
                  cursor: 'pointer',
                }}>
                  {w}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 个人笔记 */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--paper-shadow)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 12,
        }}>
          <h2 style={{
            fontSize: 'var(--text-base)', fontWeight: 600,
            color: 'var(--ink-tertiary)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            我的笔记
          </h2>
          <button onClick={() => setShowNoteEditor(!showNoteEditor)} style={{
            background: 'var(--paper-base)',
            border: '1px solid var(--paper-shadow)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 12px', cursor: 'pointer', fontSize: 12,
          }}>
            {showNoteEditor ? '取消' : '+ 添加'}
          </button>
        </div>

        {showNoteEditor && (
          <div style={{
            padding: 12,
            background: 'var(--paper-base)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--paper-shadow)',
            marginBottom: 12,
          }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="写下你的记忆心得..."
              rows={3}
              style={{
                width: '100%', border: 'none',
                background: 'transparent',
                fontSize: 13, fontFamily: 'var(--font-body)',
                color: 'var(--ink-primary)', resize: 'none', outline: 'none',
              }}
            />
            <button onClick={handleAddNote} disabled={!noteText.trim()} style={{
              marginTop: 8, padding: '6px 16px',
              background: noteText.trim() ? 'var(--wine-red)' : 'var(--paper-shadow)',
              color: 'white', border: 'none',
              borderRadius: 'var(--radius-sm)', cursor: noteText.trim() ? 'pointer' : 'default',
              fontSize: 12,
            }}>
              保存笔记
            </button>
          </div>
        )}

        {notes.length === 0 && !showNoteEditor && (
          <p style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontStyle: 'italic' }}>
            还没有笔记，添加第一条吧
          </p>
        )}
        {notes.map(n => (
          <div key={n.id} style={{
            padding: 10,
            background: 'var(--paper-base)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--paper-shadow)',
            marginBottom: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--ink-primary)', lineHeight: 1.5 }}>
              {n.content}
            </p>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 6,
            }}>
              <span style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>
                {new Date(n.createdAt || Date.now()).toLocaleDateString('zh-CN')}
              </span>
              <button onClick={() => handleDeleteNote(n.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--wine-red)',
              }}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 复习操作 */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0,
        background: 'rgba(245, 237, 224, 0.98)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--paper-shadow)',
        padding: '12px 16px',
        zIndex: 90,
      }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          display: 'flex', gap: 12,
        }}>
          <button onClick={() => markReview(1)} style={{
            flex: 1, padding: '10px 16px',
            background: 'var(--paper-base)',
            border: '1px solid var(--paper-shadow)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            color: 'var(--wine-red)',
          }}>
            模糊
          </button>
          <button onClick={() => markReview(2)} style={{
            flex: 1, padding: '10px 16px',
            background: 'var(--paper-base)',
            border: '1px solid var(--paper-shadow)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            color: 'var(--amber)',
          }}>
            记得
          </button>
          <button onClick={() => markReview(3)} style={{
            flex: 1, padding: '10px 16px',
            background: isLearned ? 'var(--ink-green)' : 'var(--wine-red)',
            border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            color: 'white',
          }}>
            牢记
          </button>
        </div>
      </div>
    </div>
  );
}