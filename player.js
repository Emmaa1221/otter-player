// Otter English: Top badges + reminder + fixed words auto-load
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);
const fmt = (sec)=>{ sec=Math.max(0,Math.floor(sec||0)); const m=Math.floor(sec/60), s=sec%60; return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); };

// Top badges & reminder refs
const streakBadge=$('#streakBadge'), progressBadge=$('#progressBadge'), challengeBadge=$('#challengeBadge');
const remindTime=$('#remindTime'), enableNotify=$('#enableNotify'), saveReminder=$('#saveReminder');

// Player refs
const audio=$('#player'), video=$('#playerVideo'); let activeEl=audio;
const playPause=$('#playPause'), rateSel=$('#rate'), currentEl=$('#current'), durationEl=$('#duration'), statusEl=$('#status'), lessonTitle=$('#lessonTitle');
const setABtn=$('#setA'), setBBtn=$('#setB'), loopAB=$('#loopAB'), clearAB=$('#clearAB'), abInfo=$('#abInfo');
const mediaUrlInput=$('#mediaUrl'), loadBtn=$('#loadBtn'), filePicker=$('#filePicker');

// Tabs
$$('.tab').forEach(t=>t.addEventListener('click',()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); const name=t.dataset.tab; $$('.pane').forEach(p=>p.classList.remove('active')); $('#pane-'+name).classList.add('active'); if(name==='words'){ ensureTodayWords(); } }));

function chooseMedia(url){
  const s=(url||'').toLowerCase();
  const isVideo = s.endsWith('.mp4')||s.endsWith('.webm')||s.endsWith('.mov')||s.includes('video=');
  if(isVideo){ video.hidden=false; audio.hidden=true; activeEl=video; } else { video.hidden=true; audio.hidden=false; activeEl=audio; }
}

let lessonId=null, lastMediaTime=null;
async function loadMedia({src,title}){
  if(!src) return;
  chooseMedia(src); activeEl.src=src; await activeEl.load?.();
  lessonTitle.textContent= title || (new URL(src, location.href).pathname.split('/').pop()||'Lesson');
  lessonId = `lesson:${title||src}`;
  const last = JSON.parse(localStorage.getItem('progress:'+lessonId)||'{}');
  if(last.lastPos){ activeEl.currentTime=last.lastPos; }
  rateSel.value=String(last.rate||'1.0'); activeEl.playbackRate=parseFloat(rateSel.value);
  renderNotes(); renderBookmarks();
  statusEl.textContent='레슨 로딩 완료'; setTimeout(()=>statusEl.textContent='',1200);
}
document.querySelectorAll('button[data-skip]').forEach(btn=>btn.addEventListener('click',()=>{
  const d=parseFloat(btn.dataset.skip); activeEl.currentTime=Math.max(0, Math.min((activeEl.duration||Infinity), activeEl.currentTime+d));
}));
playPause.addEventListener('click',()=>{ if(activeEl.paused) activeEl.play(); else activeEl.pause(); });
rateSel.addEventListener('change',()=>{ activeEl.playbackRate=parseFloat(rateSel.value); saveProgress(); });

// Accurate playback time tracking for today's minutes
audio.addEventListener('play', ()=>{ lastMediaTime = audio.currentTime; });
video.addEventListener('play', ()=>{ lastMediaTime = video.currentTime; });
audio.addEventListener('seeked', ()=>{ lastMediaTime = audio.currentTime; });
video.addEventListener('seeked', ()=>{ lastMediaTime = video.currentTime; });

audio.addEventListener('timeupdate', onTimeUpdate);
video.addEventListener('timeupdate', onTimeUpdate);
function onTimeUpdate(){
  currentEl.textContent=fmt(activeEl.currentTime);
  durationEl.textContent=fmt(activeEl.duration||0);
  if(loopAB.checked && A!=null && B!=null && activeEl.currentTime>B){ activeEl.currentTime=A; }
  // accumulate listened seconds using delta of media time
  const cur = activeEl.currentTime;
  if(lastMediaTime!=null && cur>=lastMediaTime){
    const delta = cur - lastMediaTime;
    trackProgress(delta);
  }
  lastMediaTime = cur;
  saveProgressDebounced();
}

function saveProgress(){ if(!lessonId) return; localStorage.setItem('progress:'+lessonId, JSON.stringify({ lastPos: Math.floor(activeEl.currentTime||0), rate: parseFloat(rateSel.value)||1.0 })); }
let spTimer=null; function saveProgressDebounced(){ clearTimeout(spTimer); spTimer=setTimeout(saveProgress,500); }
let A=null,B=null; $('#setA').addEventListener('click',()=>{A=Math.floor(activeEl.currentTime); showAB();}); $('#setB').addEventListener('click',()=>{B=Math.floor(activeEl.currentTime); showAB();}); $('#clearAB').addEventListener('click',()=>{A=B=null; loopAB.checked=false; showAB();}); function showAB(){ $('#abInfo').textContent=`A: ${A!=null?fmt(A):'--:--'} / B: ${B!=null?fmt(B):'--:--'}`; }
loadBtn.addEventListener('click',()=>{ const u=mediaUrlInput.value.trim(); if(u) loadMedia({src:u}); });
filePicker.addEventListener('change',()=>{ const f=filePicker.files[0]; if(!f) return; const url=URL.createObjectURL(f); loadMedia({src:url, title:f.name}); });

// Bookmarks
const bookmarksEl=$('#bookmarks'); const bookmarkBtn=$('#bookmarkBtn');
bookmarkBtn && bookmarkBtn.addEventListener('click',()=>{ if(!lessonId) return; const arr=JSON.parse(localStorage.getItem('bookmarks:'+lessonId)||'[]'); arr.push({ts:Math.floor(activeEl.currentTime||0)}); localStorage.setItem('bookmarks:'+lessonId, JSON.stringify(arr)); renderBookmarks(); });
function renderBookmarks(){ if(!lessonId){ bookmarksEl.innerHTML=''; return; } const arr=JSON.parse(localStorage.getItem('bookmarks:'+lessonId)||'[]'); bookmarksEl.innerHTML=''; arr.forEach((b,i)=>{ const li=document.createElement('li'); const left=document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px'; const ts=document.createElement('span'); ts.className='ts'; ts.textContent=fmt(b.ts); const right=document.createElement('div'); right.style.display='flex'; right.style.gap='6px'; const go=document.createElement('button'); go.className='btn pill ghost'; go.textContent='이동'; go.onclick=()=>{ activeEl.currentTime=b.ts; activeEl.pause(); }; const del=document.createElement('button'); del.className='btn pill ghost'; del.textContent='삭제'; del.onclick=()=>{ arr.splice(i,1); localStorage.setItem('bookmarks:'+lessonId, JSON.stringify(arr)); renderBookmarks(); }; left.appendChild(ts); li.appendChild(left); right.appendChild(go); right.appendChild(del); li.appendChild(right); bookmarksEl.appendChild(li); }); }

// Notes with Save + Review
const noteText=$('#noteText'), notesEl=$('#notes'), saveNoteBtn=$('#saveNoteBtn'), memoReviewBtn=$('#memoReviewBtn'), memoReviewEl=$('#memoReview');
saveNoteBtn && saveNoteBtn.addEventListener('click', saveNote);
document.addEventListener('keydown',(e)=>{ if(e.ctrlKey && e.key==='Enter' && document.activeElement===noteText){ saveNote(); } });
function saveNote(){ if(!lessonId) return; const text=noteText.value.trim(); if(!text) return; const arr=JSON.parse(localStorage.getItem('notes:'+lessonId)||'[]'); arr.push({ts:Math.floor(activeEl.currentTime||0), text, at:Date.now()}); localStorage.setItem('notes:'+lessonId, JSON.stringify(arr)); noteText.value=''; renderNotes(); }
function renderNotes(){ if(!lessonId){ notesEl.innerHTML=''; return; } const arr=(JSON.parse(localStorage.getItem('notes:'+lessonId)||'[]')).sort((a,b)=>a.ts-b.ts); notesEl.innerHTML=''; arr.forEach((n,i)=>{ const li=document.createElement('li'); const left=document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px'; const ts=document.createElement('span'); ts.className='ts'; ts.textContent=fmt(n.ts); const text=document.createElement('span'); text.textContent=n.text; const right=document.createElement('div'); right.style.display='flex'; right.style.gap='6px'; const go=document.createElement('button'); go.className='btn pill ghost'; go.textContent='이동'; go.onclick=()=>{ activeEl.currentTime=n.ts; activeEl.pause(); }; const del=document.createElement('button'); del.className='btn pill ghost'; del.textContent='삭제'; del.onclick=()=>{ arr.splice(i,1); arr.length?localStorage.setItem('notes:'+lessonId, JSON.stringify(arr)):localStorage.removeItem('notes:'+lessonId); renderNotes(); }; left.appendChild(ts); left.appendChild(text); li.appendChild(left); right.appendChild(go); right.appendChild(del); li.appendChild(right); notesEl.appendChild(li); }); }
memoReviewBtn && memoReviewBtn.addEventListener('click', ()=>{
  if(!lessonId){ memoReviewEl.innerHTML='레슨이 없습니다.'; memoReviewEl.classList.remove('hidden'); return; }
  const arr=(JSON.parse(localStorage.getItem('notes:'+lessonId)||'[]')).sort((a,b)=>a.ts-b.ts);
  memoReviewEl.innerHTML = '<h4>메모 리뷰</h4>' + (arr.length? '':'<p class="hint">아직 메모가 없어요.</p>');
  arr.forEach(n=>{ const p=document.createElement('p'); p.innerHTML=`<span class="ts">${fmt(n.ts)}</span> ${n.text}`; memoReviewEl.appendChild(p); });
  memoReviewEl.classList.toggle('hidden');
});

// Words daily-3 with auto-load
const todayWordsBtn=$('#todayWordsBtn'), wordsWrap=$('#todayWords'), wordReviewBtn=$('#wordReviewBtn'), wordReviewEl=$('#wordReview'), recycleChk=$('#wordRecycle');
let WORDS=[];
async function loadWords(){
  if(WORDS.length) return;
  const res = await fetch('assets/words_3000.json'); WORDS = await res.json();
  // apply overrides
  const overrides = JSON.parse(localStorage.getItem('otter:words:overrides')||'{}');
  Object.keys(overrides).forEach(k=>{ const i=parseInt(k,10); if(WORDS[i]) WORDS[i].meaning = overrides[k]; });
}
function dayKey(){ return new Date().toISOString().slice(0,10); }
function getWProg(){ return JSON.parse(localStorage.getItem('otter:words:progress')||'{}'); }
function setWProg(p){ localStorage.setItem('otter:words:progress', JSON.stringify(p)); }
function pickToday(force=false){
  const p = getWProg(); const today = dayKey(); p.days = p.days||{};
  if(!force && p.days[today] && Array.isArray(p.days[today].items)){ setWProg(p); return p.days[today].items; }
  const learned = new Set(p.learned||[]);
  let pool = WORDS.map((w,i)=>({...w, idx:i})).filter(w=> !learned.has(w.idx));
  if(recycleChk?.checked && pool.length<3){ pool = WORDS.map((w,i)=>({...w, idx:i})); }
  const chosen=[];
  for(let i=0;i<3 && pool.length;i++){ const j=Math.floor(Math.random()*pool.length); chosen.push(pool.splice(j,1)[0].idx); }
  p.days[today] = {items: chosen, done: []}; setWProg(p); return chosen;
}
function renderToday(){
  const p = getWProg(); const today = dayKey(); const set = (p.days && p.days[today]) ? p.days[today] : {items:[], done:[]};
  wordsWrap.innerHTML = '';
  set.items.forEach(idx=>{
    const w = WORDS[idx]||{word:'(없음)', meaning:''}; const done = (set.done||[]).includes(idx);
    const card = document.createElement('div'); card.className='wordcard';
    card.innerHTML = `<div class="top"><strong>${w.word}</strong><label class="switch"><input type="checkbox" ${done?'checked':''}><span>완료</span></label></div>
      <div class="mean">${w.meaning||'(의미 추가 가능)'}</div>
      <div class="actions"><button class="btn pill ghost edit">뜻 편집</button></div>`;
    const chk = card.querySelector('input[type=checkbox]');
    chk.addEventListener('change',()=>{
      const p2=getWProg(); const d=(p2.days[today].done||[]);
      if(chk.checked){ if(!d.includes(idx)) d.push(idx); } else { const k=d.indexOf(idx); if(k>=0) d.splice(k,1); }
      p2.days[today].done = d;
      if(d.length>=3){ const L=new Set(p2.learned||[]); set.items.forEach(i=>L.add(i)); p2.learned=[...L]; }
      setWProg(p2);
    });
    card.querySelector('.edit').addEventListener('click',()=>{
      const nv = prompt('뜻을 입력하세요', w.meaning||'');
      if(nv!=null){
        WORDS[idx].meaning = nv; card.querySelector('.mean').textContent = nv || '(의미 추가 가능)';
        const overrides = JSON.parse(localStorage.getItem('otter:words:overrides')||'{}'); overrides[idx]=nv; localStorage.setItem('otter:words:overrides', JSON.stringify(overrides));
      }
    });
    wordsWrap.appendChild(card);
  });
}
async function ensureTodayWords(){
  await loadWords();
  pickToday(false);
  renderToday();
}
todayWordsBtn && todayWordsBtn.addEventListener('click', ()=>{ pickToday(true); renderToday(); });
wordReviewBtn && wordReviewBtn.addEventListener('click', ()=>{
  const p=getWProg(); const L=(p.learned||[]);
  wordReviewEl.innerHTML = '<h4>배운 단어 리뷰</h4>' + (L.length? '':'<p class="hint">아직 완료한 단어가 없어요.</p>');
  const overrides = JSON.parse(localStorage.getItem('otter:words:overrides')||'{}');
  L.slice().reverse().forEach(idx=>{
    const w=WORDS[idx]||{word:'',meaning:''}; const meaning = overrides[idx] ?? w.meaning;
    const p=document.createElement('p'); p.innerHTML=`<strong>${w.word}</strong> — ${meaning||'(의미 없음)'}`; wordReviewEl.appendChild(p);
  });
  wordReviewEl.classList.toggle('hidden');
});

// Auto-load today's words at startup
ensureTodayWords();

// Free Talking (same as before)
const startRec=$('#startRec'), stopRec=$('#stopRec'), transcriptEl=$('#transcript'), feedbackEl=$('#talkFeedback');
let recognition=null, recOn=false;
function getTodayWordTexts(){
  const p=getWProg(); const today=dayKey();
  const items = (p.days && p.days[today] && p.days[today].items) ? p.days[today].items : [];
  return items.map(i=> (WORDS[i]?.word||'')).filter(Boolean);
}
function supportsSpeech(){ return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window; }
startRec && startRec.addEventListener('click',()=>{
  if(!supportsSpeech()){ alert('브라우저가 음성 인식을 지원하지 않아요. 크롬을 권장합니다.'); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR(); recognition.lang='en-US'; recognition.continuous=true; recognition.interimResults=true;
  transcriptEl.textContent='';
  recognition.onresult = (e)=>{ let txt=''; for(let i=e.resultIndex;i<e.results.length;i++){ txt += e.results[i][0].transcript; } transcriptEl.textContent = txt.trim(); };
  recognition.onend = ()=>{ recOn=false; giveFeedback(); };
  recOn=true; recognition.start();
});
stopRec && stopRec.addEventListener('click',()=>{ if(recognition && recOn){ recognition.stop(); } });
function giveFeedback(){
  const text = (transcriptEl.textContent||'').toLowerCase();
  const targets = getTodayWordTexts().map(w=>w.toLowerCase());
  const used = targets.filter(w=> text.includes(w));
  const missing = targets.filter(w=> !text.includes(w));
  const score = Math.round((used.length/(targets.length||1))*100);
  feedbackEl.innerHTML = `<p><strong>점수:</strong> ${score}점</p>
  <p><strong>사용한 단어:</strong> ${used.join(', ')||'없음'}</p>
  <p><strong>다음에 시도할 단어:</strong> ${missing.join(', ')||'없음'}</p>`;
}

// Challenge data
function tKey(){ return new Date().toISOString().slice(0,10); }
function getC(){ return JSON.parse(localStorage.getItem('otter:challenge')||'{}'); }
function setC(v){ localStorage.setItem('otter:challenge', JSON.stringify(v)); }
function updateBadges(){
  const d=getC();
  const streak = d.streak||0, secs=d.todaySecs||0;
  streakBadge.textContent = `🔥 ${streak}일 연속`;
  progressBadge.textContent = `🎯 오늘 ${Math.floor(secs/60)}분`;
  const left = Math.max(0, 7 - streak);
  challengeBadge.textContent = `🏁 D-${left}`;
}
function rollDay(d){
  const today=tKey();
  if(d.lastDay!==today){
    if(d.lastDay){
      const prev=new Date(d.lastDay), cur=new Date(today);
      const diff=Math.round((cur - prev)/(1000*60*60*24));
      d.streak = (diff===1) ? (d.streak||0)+1 : 1;
    } else d.streak=1;
    d.lastDay=today; d.todaySecs=0;
  }
}
function trackProgress(addSec){
  const d=getC(); rollDay(d);
  d.todaySecs = (d.todaySecs||0) + (addSec||0);
  setC(d); updateBadges();
}
updateBadges();

// Reminder
enableNotify && enableNotify.addEventListener('click', async ()=>{
  if(!('Notification' in window)) return alert('브라우저가 알림을 지원하지 않아요.');
  const p = await Notification.requestPermission();
  alert(p==='granted' ? '알림 허용됨' : '알림 거부됨');
});
saveReminder && saveReminder.addEventListener('click', ()=>{
  const t = remindTime.value; if(!t) return alert('시간을 선택하세요');
  localStorage.setItem('otter:remindTime', t); alert('리마인더 저장 완료');
});
setInterval(()=>{
  const t = localStorage.getItem('otter:remindTime'); if(!t) return;
  const now = new Date(); const hh=String(now.getHours()).padStart(2,'0'); const mm=String(now.getMinutes()).padStart(2,'0');
  if(`${hh}:${mm}`===t){
    if(Notification && Notification.permission==='granted'){
      new Notification('Otter English', { body:'학습 시간이에요! 오늘 10분 채워볼까요?' });
    } else { statusEl.textContent='학습 시간 알림!'; setTimeout(()=>statusEl.textContent='',3000); }
  }
}, 60000);

// PWA install
let beforeInstallPrompt=null;
window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); beforeInstallPrompt=e; const btn=$('#installBtn'); btn.hidden=false; btn.onclick=async()=>{ beforeInstallPrompt.prompt(); await beforeInstallPrompt.userChoice; btn.hidden=true; beforeInstallPrompt=null; }; });

// URL param (?src & ?title)
(function initFromQuery(){
  const u=new URL(location.href);
  const src=u.searchParams.get('src'); const title=u.searchParams.get('title')||undefined;
  if(src){ $('#mediaUrl').value=src; loadMedia({src, title}); }
})();
