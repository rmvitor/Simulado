import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../dist/catalog.js';
import { addAttempt, createExam, discardExam, finishExam, initialState } from '../dist/engine.mjs';

const { questions, rules, topics } = catalog;
const byId = new Map(questions.map(q => [q.id,q]));
test('Todas as questões são rastreáveis a um tópico e têm cinco alternativas', () => {
  const leaves = new Set(topics.filter(t => t.id.split('.').length === 3).map(t => t.id));
  assert.equal(leaves.size, 158);
  assert.equal(questions.length, byId.size);
  for (const q of questions) {
    assert.ok(leaves.has(q.topic), q.id);
    assert.ok(q.prompt && q.source && new URL(q.url).protocol === 'https:',q.id);
    assert.equal(q.options.length, 5, q.id);
    // Duas alternativas incorretas são idênticas no caderno de Tibagi, questão 5.
    if (q.id !== 'fafipa-tibagiprev-2022-05') assert.equal(new Set(q.options).size,5,q.id);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 5, q.id);
    if (q.origin === 'oficial') {
      assert.ok(q.keyUrl && q.qcUrl && !q.referenceOnly, q.id);
      assert.ok(q.options.every(o=>o.trim() && !/^Alternativa [A-E]$/.test(o)),q.id);
    }
    else assert.ok(q.origin === 'ia' && q.explanation,q.id);
  }
});
test('As três seleções de origem respeitam a distribuição e a nota de corte', () => {
  for (const origin of ['ia','oficial','mista']) {
    const state = initialState();
    const pool = questions.filter(q => origin === 'mista' || q.origin === origin);
    createExam(state, pool, rules);
    const exam = state.active;
    assert.equal(new Set(exam.ids).size,40);
    assert.equal(exam.deadline-exam.started,4*3600000);
    assert.deepEqual(rules.parts.map(p => exam.ids.filter(id => byId.get(id).area===p.area).length),[5,5,30]);
    for (const id of exam.ids.slice(0,24)) exam.answers[id] = byId.get(id).answer;
    const resumed = structuredClone(state);
    finishExam(resumed,questions,exam.deadline + 60000);
    assert.equal(resumed.sessions[0].score,48);
    assert.equal(resumed.sessions[0].minimum,48);
    assert.equal(resumed.sessions[0].total,80);
    assert.equal(resumed.sessions[0].at,exam.deadline);
    assert.equal(resumed.attempts.filter(a => a.choice===null).length,16);
    finishExam(resumed,questions);
    assert.equal(resumed.sessions.length,1);
    assert.equal(resumed.attempts.length,40);
  }
});
test('O primeiro erro e o acerto na revisão permanecem em grupos distintos', () => {
  const state = initialState(), q = questions[0];
  const today = new Date(2026, 10, 24, 10).getTime();
  const first = addAttempt(state,q,(q.answer+1)%5,'Estudo',today);
  const repeat = addAttempt(state,q,q.answer,'Revisão',today);
  assert.ok(first.fresh && !first.correct);
  assert.ok(!repeat.fresh && repeat.correct);
  assert.equal(new Date(first.due).getDate(),25);
  assert.equal(new Date(repeat.due).getDate(),27);
});

test('Descartar uma prova libera a próxima e preserva o histórico anterior', () => {
  const state = initialState();
  addAttempt(state,questions[0],questions[0].answer,'Estudo');
  createExam(state,questions,rules);
  finishExam(state,questions);
  const previous = structuredClone(state);
  createExam(state,questions,rules);
  const firstId = state.active.id;
  state.active.answers[state.active.ids[0]] = 1;
  assert.equal(discardExam(state,'outra-prova'),false);
  assert.equal(discardExam(state,firstId),true);
  assert.deepEqual(state,previous);
  createExam(state,questions,rules);
  assert.equal(discardExam(state,firstId),false);
  assert.notEqual(state.active.id,firstId);
});

test('Um simulado salvo na versão anterior conserva a correção e os links das questões', () => {
  const all = [...questions, ...catalog.references];
  const refs = new Set(catalog.references.map(q=>q.id));
  assert.equal(new Set(all.map(q=>q.id)).size,all.length);
  assert.ok(questions.every(q=>!refs.has(q.id)));
  for(const q of catalog.references) assert.ok(q.referenceOnly && q.qcUrl && q.keyUrl && q.url);
  const old = catalog.references[0];
  const s = initialState();
  createExam(s,questions,rules);
  s.active.ids[0] = old.id;
  s.active.answers[old.id] = old.answer;
  finishExam(s,all);
  assert.equal(s.sessions[0].score,2);
  assert.ok(s.attempts.find(a=>a.questionId===old.id)?.correct);
});
