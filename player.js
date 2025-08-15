// Hardened: DOMContentLoaded wiring + error surface + /api/ai checks (fix1)

function setStatus(msg){
  const el = document.getElementById('status');
  if(el) el.textContent = msg;
}

window.addEventListener('error', (e)=>{
  setStatus('⚠️ 스크립트 오류: ' + (e.message || 'unknown'));
  console.error(e);
});
window.addEventListener('unhandledrejection', (e)=>{
  setStatus('⚠️ 요청 오류: ' + (e.reason?.message || 'unknown'));
  console.error(e);
});

async function fetchAI(endpoint, payload){
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if(!res.ok){
    const text = await res.text();
    throw new Error('API error: ' + text);
  }
  return await res.json();
}

function wireUI(){
  const btnWords = document.getElementById('wordBtn');
  const btnFT = document.getElementById('freeTalkingBtn');
  const topic = document.getElementById('topic');
  const level = document.getElementById('level');
  const outWords = document.getElementById('wordDisplay');
  const outFT = document.getElementById('feedbackDisplay');

  if(!btnWords || !btnFT || !topic || !level || !outWords || !outFT){
    setStatus('필수 UI 요소를 찾지 못했습니다.');
    return;
  }

  btnWords.addEventListener('click', async () => {
    outWords.textContent = '⏳ 단어 생성 중...';
    btnWords.disabled = true;
    try{
      const data = await fetchAI('/api/ai', {
        mode: 'words',
        topic: topic.value.trim() || 'daily conversation',
        level: level.value || 'beginner',
        count: 3
      });
      const words = data.words || [];
      outWords.textContent = words.length ? '• ' + words.join('\n• ') : '단어를 가져오지 못했습니다.';
      setStatus('단어 생성 완료');
    }catch(e){
      outWords.textContent = '❌ ' + e.message + '\n(배포가 GitHub Pages라면 /api/ai가 없어서 실패합니다. Vercel에서 배포하세요.)';
      setStatus('단어 생성 실패');
    }finally{
      btnWords.disabled = false;
    }
  });

  btnFT.addEventListener('click', async () => {
    const txt = document.getElementById('speechResult').value.trim();
    if(!txt){ outFT.textContent='⚠️ 먼저 문장을 입력하세요.'; return; }
    outFT.textContent = '⏳ 피드백 생성 중...';
    btnFT.disabled = true;
    try{
      const data = await fetchAI('/api/ai', { mode:'feedback', text: txt });
      outFT.textContent = data.feedback || '피드백을 가져오지 못했습니다.';
      setStatus('피드백 완료');
    }catch(e){
      outFT.textContent = '❌ ' + e.message + '\n(배포가 GitHub Pages라면 /api/ai가 없어서 실패합니다. Vercel에서 배포하세요.)';
      setStatus('피드백 실패');
    }finally{
      btnFT.disabled = false;
    }
  });

  setStatus('버튼 연결 완료');
}

document.addEventListener('DOMContentLoaded', wireUI);
