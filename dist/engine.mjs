export function initialState() {
  return { attempts: [], sessions: [], completed: [], active: null };
}

export function accuracy(attempts) {
  if (!attempts.length) return '—';
  return Math.round(100 * attempts.filter(a => a.correct).length / attempts.length) + '%';
}

export function addAttempt(state, question, choice, mode, now = Date.now(), sessionId = null) {
  const previous = state.attempts.filter(a => a.questionId === question.id);
  const last = previous.at(-1);
  const correct = choice === question.answer;
  const streak = correct ? (last?.streak || 0) + 1 : 0;
  const intervals = [1, 3, 7, 15, 30, 60];
  const due = new Date(now);
  due.setDate(due.getDate() + intervals[Math.min(streak, intervals.length - 1)]);
  due.setHours(0, 0, 0, 0);
  const attempt = { id: crypto.randomUUID(), questionId: question.id, at: now, choice, correct,
    fresh: previous.length === 0, origin: question.origin, mode, streak, due: due.getTime(), sessionId };
  state.attempts.push(attempt);
  return attempt;
}

export function latestAttempts(state) {
  return new Map(state.attempts.map(a => [a.questionId, a]));
}

export function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createExam(state, questions, rules, now = Date.now()) {
  if (!rules || state.active) throw Error('Confira a configuração e o simulado em andamento.');
  const seen = latestAttempts(state);
  const ids = [];
  for (const part of rules.parts) {
    const pool = shuffled(questions.filter(q => q.area === part.area && q.options.length === rules.alternatives));
    if (pool.length < part.count) throw Error('O banco ainda precisa de questões de ' + part.area + ' para completar esta prova.');
    pool.sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)));
    ids.push(...pool.slice(0, part.count).map(q => q.id));
  }
  state.active = { id: crypto.randomUUID(), ids, answers: {}, index: 0, started: now,
    deadline: now + rules.minutes * 60000, rules: structuredClone(rules) };
}

export function finishExam(state, questions, now = Date.now()) {
  const exam = state.active;
  if (!exam) return;
  const byId = new Map(questions.map(q => [q.id, q]));
  const items = exam.ids.map(id => byId.get(id));
  if (items.some(q => !q)) throw Error('Há uma questão indisponível neste simulado.');
  let score = 0;
  for (const q of items) {
    const attempt = addAttempt(state, q, exam.answers[q.id] ?? null, 'Simulado', Math.min(now, exam.deadline), exam.id);
    if (attempt.correct) score += exam.rules.parts.find(p => p.area === q.area).points;
  }
  const total = exam.rules.parts.reduce((sum, p) => sum + p.count * p.points, 0);
  state.sessions.push({ id: exam.id, at: Math.min(now, exam.deadline), score, total, minimum: exam.rules.minimum, size: items.length });
  state.active = null;
}
