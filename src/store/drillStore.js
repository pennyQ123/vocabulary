import Dexie from 'dexie';

export const db = new Dexie('VocabAntiqueHouse_v2');

db.version(1).stores({
  vocab: 'word',
  drillProgress: 'word',
});
db.version(2).stores({
  vocab: 'word',
  drillProgress: 'word',
});
db.version(3).stores({
  vocab: 'word',
  drillProgress: 'word',
});
db.version(4).stores({
  vocab: 'word',
  drillProgress: 'word',
});
db.version(5).stores({
  vocab: 'word',
  drillProgress: 'word',
  memory: 'word',
  notes: '++id, word',
  quizRecords: '++id, date',
  wrongQuestions: 'word',
  settings: 'key',
});

// Gist 持久化配置
const GIST_TOKEN = import.meta.env.VITE_GIST_TOKEN || '';
const GIST_ID = 'f4af5288641e645de4b42de84a1fa2b1';
const GIST_RAW_URL = 'https://gist.githubusercontent.com/pennyQ123/f4af5288641e645de4b42de84a1fa2b1/raw/vocab-progress.json';
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

// 从 Gist 加载远程进度
async function fetchGistProgress() {
  try {
    const res = await fetch(GIST_RAW_URL, {
      headers: { Authorization: `token ${GIST_TOKEN}` },
    });
    if (!res.ok) return {};
    const text = await res.text();
    return JSON.parse(text || '{}');
  } catch (e) {
    console.warn('[Gist] 读取失败:', e);
    return {};
  }
}

// 推送进度到 Gist（全量覆盖）
async function pushGistProgress(progressMap) {
  try {
    const body = JSON.stringify({
      description: '词汇进度',
      files: {
        'vocab-progress.json': {
          content: JSON.stringify(progressMap, null, 2),
        },
      },
    });
    const res = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (!res.ok) console.warn('[Gist] 推送失败:', res.status);
  } catch (e) {
    console.warn('[Gist] 推送失败:', e);
  }
}

// 启动时恢复 Gist 数据到本地
export async function restoreFromGist() {
  try {
    const remote = await fetchGistProgress();
    const local = await db.drillProgress.toArray();
    const localMap = {};
    local.forEach(p => { localMap[p.word] = p; });

    // 合并：远程有则取远程，合并后的 total 累加
    const merged = { ...localMap };
    Object.entries(remote).forEach(([word, rp]) => {
      if (merged[word]) {
        merged[word] = {
          ...merged[word],
          total: Math.max(merged[word].total || 0, rp.total || 0),
          correct: Math.max(merged[word].correct || 0, rp.correct || 0),
          unknownCount: Math.max(merged[word].unknownCount || 0, rp.unknownCount || 0),
          lastDrill: Math.max(merged[word].lastDrill || 0, rp.lastDrill || 0),
        };
      } else {
        merged[word] = rp;
      }
    });

    await db.drillProgress.bulkPut(Object.values(merged));
    console.log('[Gist] 恢复完成:', Object.keys(merged).length, '词');
  } catch (e) {
    console.warn('[Gist] 恢复失败:', e);
  }
}

// Load vocab data
export async function initVocab() {
  const vocabData = await import('../data/vocab.json');
  const wordsObj = vocabData.words || {};
  const entries = Object.entries(wordsObj).map(([word, data]) => {
    const rawDefs = data.definitions || [];
    const definitions = rawDefs.map(d => {
      if (typeof d === 'string') return { meaning: d };
      if (d && typeof d === 'object') return d;
      return { meaning: String(d) };
    });
    const rawMem = data.memory;
    let memory = [];
    if (typeof rawMem === 'string' && rawMem.trim()) {
      memory = [{ type: '词根词缀', content: rawMem }];
    } else if (Array.isArray(rawMem)) {
      memory = rawMem;
    }
    return { word, ...data, definitions, memory };
  });
  await db.vocab.clear();
  await db.vocab.bulkPut(entries);
  console.log('[DB] Vocab reloaded:', entries.length, 'words');
}

export async function getAllVocab() {
  return db.vocab.toArray();
}

export async function getDrillProgress(word) {
  return db.drillProgress.get(word);
}

export async function setDrillResult(word, known, undo = false) {
  if (undo) {
    await db.drillProgress.delete(word);
    // 后台同步到 Gist（不阻塞 UI）
    syncGistAfterUndo(word);
    return;
  }
  const existing = await db.drillProgress.get(word);
  const now = Date.now();
  let updated;
  if (existing) {
    updated = {
      ...existing,
      total: (existing.total || 0) + 1,
      correct: (existing.correct || 0) + (known ? 1 : 0),
      lastDrill: now,
      unknownCount: known ? 0 : Math.min((existing.unknownCount || 0) + 1, 9),
    };
    await db.drillProgress.put(updated);
  } else {
    updated = {
      word,
      total: 1,
      correct: known ? 1 : 0,
      lastDrill: now,
      unknownCount: known ? 0 : 1,
    };
    await db.drillProgress.put(updated);
  }

  // 后台同步到 Gist（不阻塞 UI）
  syncGistInBackground(word, updated);
}

// 后台 Gist 同步，延迟执行避免阻塞
let gistSyncTimer = null;
let gistPending = {};

function syncGistInBackground(word, updated) {
  gistPending[word] = updated;
  if (gistSyncTimer) clearTimeout(gistSyncTimer);
  gistSyncTimer = setTimeout(async () => {
    try {
      const remote = await fetchGistProgress();
      Object.assign(remote, gistPending);
      await pushGistProgress(remote);
      gistPending = {};
    } catch (e) { /* non-fatal */ }
  }, 300);
}

async function syncGistAfterUndo(word) {
  try {
    const remote = await fetchGistProgress();
    delete remote[word];
    await pushGistProgress(remote);
  } catch (e) { /* non-fatal */ }
}

export async function getDrillQueue() {
  const allVocab = await db.vocab.toArray();
  const allProgress = await db.drillProgress.toArray();
  const progressMap = {};
  allProgress.forEach(p => { progressMap[p.word] = p; });

  const POS_PRIORITY = { n: 0, v: 1, adj: 2, adv: 3 };

  return allVocab
    .map(v => ({
      ...v,
      progress: progressMap[v.word] || { unknownCount: 0, total: 0 },
    }))
    .sort((a, b) => {
      // 1. unknownCount desc (错得多优先)
      const ua = a.progress.unknownCount || 0;
      const ub = b.progress.unknownCount || 0;
      if (ua !== ub) return ub - ua;
      // 2. 词性优先级 n>v>adj>adv
      const posA = POS_PRIORITY[a.pos?.[0]] ?? 9;
      const posB = POS_PRIORITY[b.pos?.[0]] ?? 9;
      if (posA !== posB) return posA - posB;
      // 3. 随机
      return Math.random() - 0.5;
    });
}

// ── Migrate data from old VocabAntiqueHouse DB ──
export async function migrateOldDB() {
  try {
    const oldDB = new Dexie('VocabAntiqueHouse');
    // Check if old DB exists
    const oldVersion = await Dexie.exists('VocabAntiqueHouse');
    if (!oldVersion) return;

    // Check if migration already done
    const migrated = await db.settings.get('_migrated_from_v1');
    if (migrated) return;

    console.log('[Migrate] Moving data from old database...');

    // Open old schema
    oldDB.version(1).stores({
      vocab: 'word', memory: 'word', notes: '++id, word',
      quizRecords: '++id, date', wrongQuestions: 'word', settings: 'key',
    });

    // Migrate memory
    const oldMemory = await oldDB.memory.toArray();
    if (oldMemory.length > 0) await db.memory.bulkPut(oldMemory);

    // Migrate notes
    const oldNotes = await oldDB.notes.toArray();
    if (oldNotes.length > 0) await db.notes.bulkPut(oldNotes);

    // Migrate quizRecords
    const oldQuiz = await oldDB.quizRecords.toArray();
    if (oldQuiz.length > 0) await db.quizRecords.bulkPut(oldQuiz);

    // Migrate wrongQuestions
    const oldWrong = await oldDB.wrongQuestions.toArray();
    if (oldWrong.length > 0) await db.wrongQuestions.bulkPut(oldWrong);

    // Migrate settings (skip _migrated key)
    const oldSettings = await oldDB.settings.toArray();
    for (const s of oldSettings) {
      if (s.key !== '_migrated_from_v1') await db.settings.put(s);
    }

    // Mark migration done
    await db.settings.put({ key: '_migrated_from_v1', value: Date.now() });
    console.log('[Migrate] Done. Memory:', oldMemory.length, 'Notes:', oldNotes.length,
      'Quiz:', oldQuiz.length, 'Wrong:', oldWrong.length);
  } catch (e) {
    console.warn('[Migrate] Failed (non-fatal):', e);
  }
}

// ── Memory (Ebbinghaus review) ──

export async function getMemory(word) {
  return db.memory.get(word);
}

export async function setMemory(word, data) {
  await db.memory.put({ word, ...data });
}

export async function getDueWords() {
  const now = Date.now();
  const allMem = await db.memory.toArray();
  const allVocab = await db.vocab.toArray();
  const memWords = new Set(allMem.map(m => m.word));

  const due = allMem.filter(r => r.nextReview && r.nextReview <= now);
  const newWords = allVocab
    .filter(v => !memWords.has(v.word))
    .map(v => ({ word: v.word, definitions: v.definitions, phonetic: v.phonetic, pos: v.pos, mem: null }));

  return [...due.map(r => ({ ...r, mem: r })), ...newWords];
}

// ── Notes ──

export async function getNotes(word) {
  return db.notes.where('word').equals(word).toArray();
}

export async function addNote({ word, content }) {
  await db.notes.add({ word, content, createdAt: Date.now() });
}

export async function deleteNote(id) {
  await db.notes.delete(id);
}

// ── Wrong questions ──

export async function addWrongQuestion(word, questionId) {
  const existing = await db.wrongQuestions.get(word);
  if (existing) {
    existing.errorCount += 1;
    existing.lastError = Date.now();
    await db.wrongQuestions.put(existing);
  } else {
    await db.wrongQuestions.put({
      word,
      questionId,
      errorCount: 1,
      lastError: Date.now(),
      removed: false,
    });
  }
}

export async function getWrongQuestions() {
  return db.wrongQuestions.filter(w => !w.removed && w.errorCount > 0).toArray();
}

export async function removeWrongQuestion(word) {
  await db.wrongQuestions.update(word, { removed: true });
}

// ── Settings ──

export async function getSetting(key, defaultVal) {
  const s = await db.settings.get(key);
  return s ? s.value : defaultVal;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}