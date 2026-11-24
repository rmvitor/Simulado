import { catalog } from './catalog.js';
import { initialState, accuracy, addAttempt, latestAttempts, shuffled, createExam, discardExam, finishExam } from './engine.mjs';

const { questions, topics, rules } = catalog;
const byId = new Map(questions.map(q => [q.id, q]));
const topicNames = new Map(topics.map(t => [t.id,t.name]));
const originName = q => q.origin === 'oficial' ? 'Oficial FAFIPA' : 'Autoral por IA';
const paths = {
  painel:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  edital:'M3 4h6q2 0 3 2 1-2 3-2h6v15h-6q-2 0-3 2-1-2-3-2H3z M12 6v15',
  banco:'M3 7l9-4 9 4-9 4z M3 12l9 4 9-4 M3 17l9 4 9-4',
  estudo:'M4 4h13v14H6q-2 0-2 2z M6 18q-4 0-2 3h14 M8 8h5 M8 12h5',
  simulados:'M7 4h3V2h4v2h4v17H6V4z M9 10h6 M9 14h6',
  erros:'M5 3h14v18l-7-4-7 4z M9 8l6 6 M15 8l-6 6',
  revisao:'M4 9a8 8 0 1 1-1 7 M3 4v6h6 M12 7v5l3 2',
  historico:'M3 21h18 M6 17v-5 M12 17V4 M18 17V8',
  date:'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18',
  target:'M12 2a10 10 0 1 0 .01 0 M12 7a5 5 0 1 0 .01 0 M12 11v2',
  start:'M6 3l14 9-14 9z'
};
const nav = [['painel','Painel'],['edital','Edital'],['banco','Questões'],['estudo','Estudo'],['simulados','Simulados'],['erros','Erros'],['revisao','Revisão'],['historico','Histórico']];
function icon(key) { return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]}"/></svg>`; }
const tile = (key,color='') => `<span class="tile ${color}">${icon(key)}</span>`;
const esc = str => String(str ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const sourceLinks = q => `<div class="source">${ext(q.url, q.referenceOnly ? 'Abrir questão no caderno (PDF)' : q.source)}${q.keyUrl ? ext(q.keyUrl,'Gabarito definitivo') : ''}</div>`;
const dateFmt = (ts,opts={day:'2-digit',month:'2-digit',year:'numeric'}) => new Date(ts).toLocaleDateString('pt-BR',opts);
const choiceLabel = i => i == null ? 'Em branco' : String.fromCharCode(65+i);
const main = document.getElementById('main');
const alertBox = document.getElementById('alert');
const dialog = document.getElementById('dialog');
let db, state = initialState(), study = null, examSource = 'todas', busy=false;
let filters={area:'',origin:'',fresh:'',topic:''}, page=0;
const route = () => { const name=location.hash.slice(1); return nav.some(n=>n[0]===name)?name:'painel'; };
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('caderno-contador-curitiba-v1') : null;
function notifyError(err) { alertBox.textContent=err?.message || 'Falha ao salvar no dispositivo.'; alertBox.hidden=false; }
function openDb() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('caderno-contador-curitiba-v1',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('dados');
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
function transact(fn) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('dados',fn?'readwrite':'readonly');
    const store=tx.objectStore('dados'), req=store.get('perfil');
    let next,reason;
    req.onsuccess=()=>{
      next=req.result || initialState();
      if (fn) {try { fn(next); store.put(next,'perfil'); } catch(e){reason=e;tx.abort();}}
    };
    tx.oncomplete=()=>{state=next;if(fn)channel?.postMessage('changed');resolve();};
    tx.onabort=()=>reject(reason||tx.error||Error('Gravação interrompida.'));
    tx.onerror=()=>reject(tx.error);
  });
}
function title(h,p) { return `<div class="sectiontitle"><h1>${h}</h1><p>${p}</p></div>`; }
function empty(s) {return `<p class="empty">${s}</p>`;}
function metric(key,label,value,detail,color) {
  return `<div class="metric"><div class="methead">${tile(key,color)}${label}</div><strong>${value}</strong><small>${detail}</small></div>`;
}
const quick=(key,label,caption,color) => `<a class="row" href="#${key}">${tile(key,color)}<div><h3>${label}</h3><p>${caption}</p></div></a>`;
function week(){
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-6+i);const stamp=d.toDateString();
    return {d,n:state.attempts.filter(a=>new Date(a.at).toDateString()===stamp).length};
  });
  const max=Math.max(1,...days.map(x=>x.n));
  return `<div class="activity">${days.map(({d,n},i)=>`<div class="day ${i===6?'today':''}" title="${dateFmt(d)} · ${n} respostas"><span><i style="height:${Math.round(n/max*100)}%"></i></span>${dateFmt(d,{weekday:'short'}).slice(0,3)}<br>${n}</div>`).join('')}</div>`;
}
function dashboard(){
  const attempts=state.attempts, fresh=attempts.filter(a=>a.fresh), repeated=attempts.filter(a=>!a.fresh);
  const due=[...latestAttempts(state).values()].filter(a=>a.due<=Date.now()).length;
  return `<section class="hero"><div class="herotext"><div class="eyebrow">${icon('edital')} Curitiba · Contador</div><h1>Painel de estudos</h1><p>Edital nº 5/2026 · Fundação FAFIPA</p><a class="herocta" href="#estudo">${icon('estudo')} Iniciar estudo</a></div></section>
  <div class="metrics">${metric('banco','Questões resolvidas',fresh.length,'de '+questions.length+' no banco','')}
  ${metric('target','Acerto em novas',accuracy(fresh),'Primeira tentativa','mint')}
  ${metric('revisao','Acerto em repetidas',accuracy(repeated),'Tentativas seguintes','peach')}
  ${metric('date','Revisões devidas',due,'A revisar até hoje','blue')}</div>
  <div class="cols"><section class="panel"><div class="panelhead"><h2>Próxima sessão</h2></div><div class="rows">
  ${quick('estudo','Modo estudo','Resolva por tema com correção imediata.','')}
  ${quick('simulados',state.active?'Retomar simulado':'Simulado da prova','40 questões · 4 horas · 80 pontos','mint')}
  ${quick('revisao','Revisão espaçada','Retome as questões previstas para hoje.','peach')}</div></section>
  <section class="panel"><div class="panelhead"><h2>Atividade recente</h2><a href="#historico">Ver histórico</a></div><p class="fine">Respostas nos últimos 7 dias</p>${week()}
  <div class="chartline"><span>Tópicos estudados</span><strong>${state.completed.length} / ${topics.filter(t=>t.id.split('.').length===3).length}</strong></div>
  <div class="chartline"><span>Simulados concluídos</span><strong>${state.sessions.length}</strong></div></section></div>`;
}
function syllabus(){
  const groups=topics.filter(t=>t.id.split('.').length===2);
  return title('Edital por tópicos','Conteúdo programático de Contador · Anexo II retificado')+`<div class="actions">${ext('./materiais/edital.pdf','Edital completo (PDF)')} · ${ext('./materiais/anexo-ii.pdf','Anexo II (PDF)')}</div><p class="fine">Marque os tópicos que já estudou. O progresso fica salvo neste dispositivo.</p><div class="list" style="margin-top:1rem">${groups.map(g=>{
    const children=topics.filter(t=>t.id.startsWith(g.id+'.'));
    const done=children.filter(t=>state.completed.includes(t.id)).length;
    return `<details class="card" data-group="${g.id}"><summary>${esc(g.id+' · '+g.name)} <span class="meta">(${done}/${children.length})</span></summary>${children.map(t=>`<label class="topic"><input type="checkbox" data-topic="${t.id}" ${state.completed.includes(t.id)?'checked':''}><span>${esc(t.id+' '+t.name)}</span></label>`).join('')}</details>`;
  }).join('')}</div>`;
}
function selectFilter(key,label,items){
  return `<label>${label}<select data-filter="${key}"><option value="">Todas</option>${items.map(([val,name])=>`<option value="${esc(val)}" ${filters[key]===val?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`;
}
function filterBar(){
  const topicItems=topics.filter(t=>t.id.split('.').length===2);
  return `<div class="toolbar">
  ${selectFilter('area','Disciplina',rules.parts.map(p=>[p.area,p.area]))}
  ${selectFilter('topic','Tema',topicItems.map(t=>[t.id,t.name]))}
  ${selectFilter('origin','Origem',[['oficial','Oficial FAFIPA'],['ia','Autoral por IA']])}
  ${selectFilter('fresh','Exposição',[['nova','Novas'],['repetida','Repetidas']])}
  </div>`;
}
function pool(){
  const seen=latestAttempts(state);
  return questions.filter(q=>(!filters.area||q.area===filters.area)&&(!filters.origin||filters.origin===q.origin)&&
    (!filters.topic||q.topic.startsWith(filters.topic+'.'))&&(!filters.fresh||(filters.fresh==='nova')===!seen.has(q.id)));
}
function chips(q,seen){return `<span class="chip ${q.origin==='oficial'?'good':''}">${originName(q)}</span><span class="chip warm">${seen?'Repetida':'Nova'}</span><span class="meta">${esc(q.area)} · ${esc(q.topic)}</span>`;}
function questionCard(q,seen){
  return `<article class="card">${chips(q,seen)}<p class="qtext">${esc(q.prompt.slice(0,240))}${q.prompt.length>240?'…':''}</p><div class="meta">${esc(q.source)}</div>
  <div class="actions"><button data-open="${esc(q.id)}">Resolver</button></div></article>`;
}
function bank() {
  const qs=pool(),seen=latestAttempts(state);page=Math.min(page,Math.max(0,Math.ceil(qs.length/12)-1));
  return title('Banco de questões',questions.filter(q=>q.origin==='oficial').length+' oficiais da FAFIPA e '+questions.filter(q=>q.origin==='ia').length+' autorais por IA.')+filterBar()+
  `<div class="panelhead"><strong>${qs.length} questões encontradas</strong></div><div class="list">${qs.length?qs.slice(page*12,page*12+12).map(q=>questionCard(q,seen.has(q.id))).join(''):empty('Nenhuma questão corresponde aos filtros.')}</div>
  ${qs.length>12?`<div class="actions"><button data-page="-1" ${page===0?'disabled':''}>Anterior</button><span>Página ${page+1} de ${Math.ceil(qs.length/12)}</span><button data-page="1" ${(page+1)*12>=qs.length?'disabled':''}>Próxima</button></div>`:''}
  <details class="card" style="margin-top:1rem"><summary>Provas e gabaritos de origem</summary>${catalog.sources.map(s=>`<p>${esc(s.name)}</p><div class="source">${ext(s.url,'Página da banca')} ${ext(s.booklet,'Caderno')} ${ext(s.keyUrl,'Gabarito definitivo')}</div>`).join('')}</details>`;
}
function answers(q, selected, result, exam=false){
  return `<div class="opts">${q.options.map((option,i)=>`<button class="opt ${result && i===q.answer?'correct':''} ${result&&i===selected&&i!==q.answer?'wrong':''}" aria-pressed="${i===selected}" data-${exam?'exam-choice':'choice'}="${i}" ${result?'disabled':''}><span class="choice">${choiceLabel(i)}</span>${esc(option)}</button>`).join('')}</div>`;
}
function booklet(q){return q.referenceOnly?`<details class="reader"><summary>Ler enunciado e alternativas no caderno original</summary><div data-pdf="${esc(q.url)}"></div></details><div class="source">${ext(q.url,'Abrir caderno na questão (PDF)')}</div>`:'';}
function beginStudy(ids,mode){
  if (!ids.length) return;
  study={ids,index:0,choice:null,result:null,mode};
  if(location.hash==='#estudo') render();else location.hash='estudo';
}
function studyView(){
  if(!study){
    const qs=pool();return title('Modo estudo','Escolha a disciplina e o tema. A correção aparece depois de cada resposta.')+filterBar()+
    `<div class="panel"><h2>Sessão de prática</h2><p>${qs.length} questões disponíveis com estes filtros.</p><button class="primary" data-start-study ${qs.length?'':'disabled'}>Iniciar estudo</button></div>`;
  }
  const q=byId.get(study.ids[study.index]),result=study.result;
  return title(study.mode,'Questão '+(study.index+1)+' de '+study.ids.length)+`<article class="card">${chips(q,result?!result.fresh:latestAttempts(state).has(q.id))}
  <p class="meta">${esc(q.source)}</p><p class="qtext">${esc(q.prompt)}</p>${booklet(q)}${answers(q,study.choice,result)}
  ${result?`<div class="notice"><strong>${result.correct?'Você acertou.':'Resposta incorreta.'} Gabarito ${choiceLabel(q.answer)}.</strong><p>${esc(q.explanation||'Confira a alternativa indicada no gabarito definitivo da banca.')}</p>${sourceLinks(q)}<p class="fine">Revisão em ${dateFmt(result.due)}.</p></div>`:''}
  <div class="actions">${result?`<button class="primary" data-next-study>${study.index===study.ids.length-1?'Concluir sessão':'Próxima questão'}</button>`:`<button class="primary" data-submit-study ${study.choice===null?'disabled':''}>Conferir resposta</button>`}<button data-end-study>Sair da sessão</button></div></article>`;
}
function review(errors){
  const now=Date.now();
  const records=[...latestAttempts(state).values()].filter(a=>errors?!a.correct:a.due<=now).sort((a,b)=>a.due-b.due);
  const ids=records.map(a=>a.questionId),upcoming=[...latestAttempts(state).values()].filter(a=>a.due>now).sort((a,b)=>a.due-b.due);
  return title(errors?'Caderno de erros':'Revisão espaçada',errors?'Questões cuja tentativa mais recente terminou em erro ou em branco.':'Após um erro, revise em 1 dia. Acertos seguidos agendam a próxima revisão em 3, 7, 15, 30 e 60 dias.')+
  `<section class="panel"><h2>${errors?'Erros para retomar':'Revisões devidas'} · ${ids.length}</h2>${ids.length?`<div class="actions"><button class="primary" data-drill="${errors?'erros':'revisao'}">Iniciar revisão</button></div>`:empty(errors?'Seu caderno está em dia. Os erros das próximas sessões aparecerão aqui.':'Você está em dia com as revisões.')}<div class="list">${ids.map(id=>questionCard(byId.get(id),true)).join('')}</div></section>`+
  (!errors&&upcoming.length?`<section class="panel" style="margin-top:1rem"><h2>Próximas revisões</h2>${upcoming.slice(0,10).map(a=>`<div class="row"><div><strong>${dateFmt(a.due)}</strong><p>${esc(byId.get(a.questionId).prompt.slice(0,95))}</p></div></div>`).join('')}</section>`:'');
}
function timeLeft(end){
  const seconds=Math.max(0,Math.ceil((end-Date.now())/1000));
  return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
function exams(){
  const exam=state.active;
  if(!exam) return title('Simulados','Prova objetiva · Edital nº 5/2026 da Prefeitura de Curitiba')+
    `<div class="cols"><section class="panel"><h2>Simulado completo</h2><p>40 questões com cinco alternativas e uma resposta correta. As questões novas têm prioridade na seleção.</p>
    ${rules.parts.map(p=>`<div class="chartline"><span>${p.area}</span><strong>${p.count} questões</strong></div>`).join('')}
    <div class="toolbar"><label>Origem das questões<select id="exam-source"><option value="todas">Oficiais e autorais</option><option value="oficial" ${examSource==='oficial'?'selected':''}>Somente oficiais da FAFIPA</option><option value="ia" ${examSource==='ia'?'selected':''}>Somente autorais por IA</option></select></label></div>
    <p class="fine">Os itens oficiais abrem o caderno original e precisam de internet. Para estudar offline, selecione somente autorais.</p><div class="actions"><button class="primary" data-start-exam>Iniciar simulado</button></div></section>
    <section class="panel"><h2>Regras da objetiva</h2><p>O cronômetro de 4 horas inclui a marcação das respostas e continua enquanto o app estiver fechado.</p><p>Cada acerto vale 2 pontos. Questões em branco valem zero. O mínimo é 48 de 80 pontos (24 acertos).</p><p>A correção fica disponível ao entregar a prova ou esgotar o tempo. A prova de títulos é uma etapa separada, de até 20 pontos.</p><div class="source">${ext('./materiais/edital.pdf','Consultar edital · itens 10 e 11')}</div></section></div>`;
  const q=byId.get(exam.ids[exam.index]),sel=exam.answers[q.id];
  return title('Simulado em andamento','Suas marcações são salvas neste dispositivo.')+
    '<div class="actions"><a href="#painel" class="button">Sair e retomar depois</a><button data-ask-discard>Encerrar sem entregar</button></div><p class="fine exam-exit-note">Se sair para retomar depois, o cronômetro continua.</p>'+`<article class="card"><div class="panelhead"><strong>Questão ${exam.index+1} de ${exam.ids.length}</strong><strong class="countdown" id="timer" aria-label="Tempo restante">${timeLeft(exam.deadline)}</strong></div>
  <span class="chip">${originName(q)}</span><span class="meta">${esc(q.area)}</span>${q.referenceOnly?`<p class="meta">${esc(q.source)}</p>`:''}
  <p class="qtext">${esc(q.prompt)}</p>${booklet(q)}${answers(q,sel,null,true)}
  <div class="actions"><button data-exam-index="${exam.index-1}" ${exam.index===0?'disabled':''}>Anterior</button><button data-exam-index="${exam.index+1}" ${exam.index===exam.ids.length-1?'disabled':''}>Próxima</button><button data-clear-choice ${sel==null?'disabled':''}>Deixar em branco</button></div>
  <h3>Folha de respostas</h3><div class="pagination">${exam.ids.map((id,i)=>`<button class="${exam.answers[id]==null?'':'answered'}" data-exam-index="${i}" ${i===exam.index?'aria-current="step"':''} aria-label="Questão ${i+1}, ${choiceLabel(exam.answers[id])}">${i+1} · ${exam.answers[id]==null?'–':choiceLabel(exam.answers[id])}</button>`).join('')}</div>
  <button class="primary" data-ask-finish>Entregar simulado</button></article>`;
}
function history(){
  const a=state.attempts;
  return title('Histórico','Tentativas, correções e resultados salvos neste navegador.')+`<div class="cols"><section class="panel"><h2>Desempenho por origem</h2>
  ${['oficial','ia'].map(origin=>`<h3 style="margin:1rem 0 .5rem">${originName({origin})}</h3>${[true,false].map(f=>{
    const group=a.filter(x=>x.origin===origin&&x.fresh===f);
    return `<div class="chartline"><span>${f?'Questões novas':'Questões repetidas'}</span><strong>${accuracy(group)} <small>(${group.filter(x=>x.correct).length}/${group.length})</small></strong></div>`;
  }).join('')}`).join('')}</section><section class="panel"><h2>Resultados dos simulados</h2>${state.sessions.length?[...state.sessions].reverse().map(s=>`<div class="row"><div><strong>${dateFmt(s.at)} · ${s.score}/${s.total} pontos</strong><p>${s.score>=s.minimum?'Atingiu':'Abaixo de'} ${s.minimum} pontos na objetiva.</p><button data-exam-result="${s.id}">Ver correção</button></div></div>`).join(''):empty('Conclua um simulado para ver a pontuação e a correção.')}</section></div>
  <section class="panel" style="margin-top:1rem"><h2>Tentativas</h2>${a.length?`<div class="rows">${[...a].reverse().slice(0,historyLimit).map(x=>`<details class="row"><summary>${x.correct?'Acerto':'Erro'} · ${esc(byId.get(x.questionId).prompt.slice(0,80))}</summary>${correction(x)}</details>`).join('')}</div>${a.length>historyLimit?'<button data-more-history>Mostrar mais tentativas</button>':''}`:empty('Sua primeira resposta iniciará o histórico.')}</section>`;
}
function correction(x){
  const q=byId.get(x.questionId);
  const option=i=>i==null?'Em branco':choiceLabel(i)+' · '+q.options[i];
  return `<p class="meta">${dateFmt(x.at)} · ${esc(x.mode)} · ${x.fresh?'Nova':'Repetida'} · ${originName(q)}</p><p class="qtext">${esc(q.prompt)}</p><p>Sua resposta: ${esc(option(x.choice))}<br>Gabarito: ${esc(option(q.answer))}</p><p>${esc(q.explanation)}</p>${sourceLinks(q)}`;
}
let historyLimit=30;
const views={painel:dashboard,edital:syllabus,banco:bank,estudo:studyView,simulados:exams,erros:()=>review(true),revisao:()=>review(false),historico:history};
function render(){
  const r=route(),label=nav.find(item=>item[0]===r)[1];
  document.title=label+' · Caderno de estudos';
  document.getElementById('nav').innerHTML=nav.map(([key,name])=>`<a href="#${key}" ${key===r?'aria-current="page"':''}>${icon(key)}${name}</a>`).join('');
  const opened=[...main.querySelectorAll('[data-group][open]')].map(e=>e.dataset.group);
  main.innerHTML=views[r]();
  if(r==='edital')main.querySelectorAll('[data-group]').forEach(e=>{e.open=opened.includes(e.dataset.group);});
}
function showDialog(body){document.getElementById('dialog-body').innerHTML=body;if(!dialog.open)dialog.showModal();}
async function saveExamAction(fn){
  const id=state.active?.id, index=state.active?.index;
  await transact(s=>{
    if(!s.active||s.active.id!==id)return;
    if(Date.now()>=s.active.deadline)finishExam(s,questions);
    else if(s.active.index===index)fn(s.active);
  });
}
async function handleClick(e){
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if('page' in d){page+=Number(d.page);window.scrollTo(0,0);}
  else if('moreHistory' in d)historyLimit+=40;
  else if(d.open){beginStudy([d.open],'Modo estudo');return;}
  else if('startStudy' in d){
    const seen=latestAttempts(state);
    const ids=shuffled(pool()).map(q=>q.id).sort((a,b)=>Number(seen.has(a))-Number(seen.has(b)));
    beginStudy(ids,'Modo estudo');return;
  }
  else if(d.drill){const ids=[...latestAttempts(state).values()].filter(a=>d.drill==='erros'?!a.correct:a.due<=Date.now()).sort((a,b)=>a.due-b.due).map(a=>a.questionId);beginStudy(ids,d.drill==='erros'?'Caderno de erros':'Revisão espaçada');return;}
  else if('choice' in d && study&&!study.result)study.choice=+d.choice;
  else if('endStudy' in d)study=null;
  else if('nextStudy' in d&&study?.result){study.index++;study.choice=null;study.result=null;if(study.index>=study.ids.length)study=null;}
  else if('submitStudy' in d && study && !study.result && study.choice!==null){
    const q=byId.get(study.ids[study.index]);let result;
    await transact(s=>{result=addAttempt(s,q,study.choice,study.mode);});study.result=result;
  } else if('startExam' in d){await transact(s=>createExam(s,examSource==='todas'?questions:questions.filter(q=>q.origin===examSource),rules));}
  else if('examIndex' in d){await saveExamAction(ex=>{const i=+d.examIndex;if(i>=0&&i<ex.ids.length)ex.index=i;});}
  else if('examChoice' in d){await saveExamAction(ex=>{ex.answers[ex.ids[ex.index]]=+d.examChoice;});}
  else if('clearChoice' in d){await saveExamAction(ex=>{delete ex.answers[ex.ids[ex.index]];});}
  else if('askDiscard' in d&&state.active){
    showDialog(`<h2>Encerrar sem entregar?</h2><p>As marcações desta prova serão descartadas. Ela não gera nota, tentativas, erros ou revisões. Você poderá começar outro simulado.</p><div class="actions"><button class="primary" data-discard-exam="${esc(state.active.id)}">Encerrar e descartar</button></div>`);
    return;
  }
  else if('askFinish' in d&&state.active){
    showDialog(`<h2>Entregar simulado?</h2><p>${Object.keys(state.active.answers).length} de ${state.active.ids.length} respostas marcadas. A entrega encerra a prova e registra a correção.</p><div class="actions"><button class="primary" data-finish-exam="${esc(state.active.id)}">Confirmar entrega</button></div>`);return;
  } else if(d.examResult){
    const items=state.attempts.filter(a=>a.sessionId===d.examResult);
    showDialog('<h2>Correção do simulado</h2>'+items.map((a,i)=>`<details class="card"><summary>Questão ${i+1} · ${a.correct?'Acerto':'Erro'}</summary>${correction(a)}</details>`).join(''));return;
  } else return;
  render();
}
async function guarded(fn){if(busy)return;busy=true;try{await fn();}catch(e){notifyError(e);}finally{busy=false;}}
main.addEventListener('toggle',e=>{
  const slot=e.target.querySelector?.('[data-pdf]');
  if(e.target.open&&slot&&!slot.firstChild){
    const frame=document.createElement('iframe');
    frame.title='Caderno original da Fundação FAFIPA';frame.src=slot.dataset.pdf;
    frame.referrerPolicy='no-referrer';slot.append(frame);
  }
},true);
main.addEventListener('click',e=>guarded(()=>handleClick(e)));
main.addEventListener('change',e=>guarded(async()=>{
  const el=e.target;
  if(el.dataset.filter){filters[el.dataset.filter]=el.value;page=0;render();}
  if(el.id==='exam-source')examSource=el.value;
  if(el.dataset.topic){await transact(s=>{const selected=new Set(s.completed);if(el.checked)selected.add(el.dataset.topic);else selected.delete(el.dataset.topic);s.completed=[...selected];});render();}
}));
dialog.addEventListener('click',e=>{
  const button=e.target.closest('button');
  const discardId=button?.dataset.discardExam, finishId=button?.dataset.finishExam;
  if(!discardId && !finishId)return;
  guarded(async()=>{
    await transact(s=>{
      if(discardId)discardExam(s,discardId);
      else if(s.active?.id===finishId)finishExam(s,questions);
    });
    dialog.close();
    location.hash=discardId?'simulados':'historico';
    render();
  });
});
async function checkClock(){
  if(!state.active)return;
  if(Date.now()>=state.active.deadline){
    await guarded(async()=>{await transact(s=>{if(s.active&&Date.now()>=s.active.deadline)finishExam(s,questions);});if(dialog.open)dialog.close();location.hash='historico';render();});
  }else{const el=document.getElementById('timer');if(el)el.textContent=timeLeft(state.active.deadline);}
}
window.addEventListener('hashchange',()=>{if(db){render();main.focus({preventScroll:true});window.scrollTo(0,0);}});
if(channel)channel.onmessage=async()=>{try{if(db){await transact();render();}}catch(e){notifyError(e);}};
document.querySelector('.topdate').textContent=dateFmt(Date.now(),{day:'numeric',month:'long',year:'numeric'});
const installBtn=document.getElementById('install');let installPrompt;
installBtn.hidden=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('appinstalled',()=>{installBtn.hidden=true;});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installBtn.hidden=false;});
installBtn.addEventListener('click',async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else{showDialog('<h2>Instalar o Caderno</h2><p>No iPhone ou iPad, abra no Safari e escolha Compartilhar e Adicionar à Tela de Início. No Android ou computador, procure a opção de instalar o aplicativo no menu do navegador.</p>');}});
async function init(){
  try{db=await openDb();await transact();await checkClock();render();setInterval(checkClock,1000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkClock();});
  }catch(e){notifyError(Error('O armazenamento local está indisponível. Permita o uso de dados do site neste navegador para registrar suas respostas.'));}
  if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>notifyError(Error('O modo offline não pôde ser preparado neste navegador.')));}
}
init();
