import Dexie from 'dexie';

export const db = new Dexie('VocabAntiqueHouse');

db.version(1).stores({
  vocab: 'word',  // 11106词主库，key=word
  memory: 'word', // 记忆记录，key=word
  notes: '++id, word',  // 笔记自增id
  quizRecords: '++id, date',  // 测验记录
  wrongQuestions: 'word',  // 错题本
  settings: 'key',  // 设置
});

// 初始化：把vocab.json数据导入
export async function initVocab() {
  const count = await db.vocab.count();
  if (count === 0) {
    console.log('[DB] Importing vocab data...');
    const vocabData = await import('../data/vocab.json');
    const wordsObj = vocabData.words || {};
    const entries = Object.entries(wordsObj).map(([word, data]) => {
      // Normalize definitions: array of strings → array of {meaning, pos, explanation}
      const rawDefs = data.definitions || [];
      const definitions = rawDefs.map(d => {
        if (typeof d === 'string') return { meaning: d };
        if (d && typeof d === 'object') return d;
        return { meaning: String(d) };
      });
      // Normalize memory: string → array of {type, content}
      const rawMem = data.memory;
      let memory = [];
      if (typeof rawMem === 'string' && rawMem.trim()) {
        memory = [{ type: '词根词缀', content: rawMem }];
      } else if (Array.isArray(rawMem)) {
        memory = rawMem;
      }
      return {
        word,
        ...data,
        definitions,
        memory,
      };
    });
    await db.vocab.bulkPut(entries);
    console.log('[DB] Vocab imported:', entries.length, 'words');
  }
}

// 读取全部词汇
export async function getAllVocab() {
  return db.vocab.toArray();
}

// 按word搜索
export async function searchVocab(query) {
  return db.vocab.where('word').startsWithIgnoreCase(query).toArray();
}

// 记忆记录操作
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

  // Due: has memory record and nextReview <= now
  const due = allMem.filter(r => r.nextReview && r.nextReview <= now);

  // New words: in vocab but no memory record
  const newWords = allVocab
    .filter(v => !memWords.has(v.word))
    .map(v => ({ word: v.word, definitions: v.definitions, phonetic: v.phonetic, pos: v.pos, mem: null }));

  return [...due.map(r => ({ ...r, mem: r })), ...newWords];
}

// 笔记操作
export async function getNotes(word) {
  return db.notes.where('word').equals(word).toArray();
}

export async function addNote({ word, content }) {
  await db.notes.add({ word, content, createdAt: Date.now() });
}

export async function deleteNote(id) {
  await db.notes.delete(id);
}

// 错题本
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

// 设置
export async function getSetting(key, defaultVal) {
  const s = await db.settings.get(key);
  return s ? s.value : defaultVal;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}