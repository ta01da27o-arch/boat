// script.js - 完全版（データ構造に合わせて描画）
// 期待される data.json 構造を下に合わせています。
// fetch に cachebust を付けて常に最新取得を試みます。

const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const STATE = { data: null, screen: 'venues', venueId: null, raceId: null };

// date
function fmtDate(dstr){
  if(!dstr) return new Date().toLocaleDateString('ja-JP');
  const d = new Date(dstr + 'T00:00:00+09:00');
  return d.toLocaleDateString('ja-JP', {year:'numeric', month:'2-digit', day:'2-digit', weekday:'short'});
}

// load data
async function loadData(force=false){
  try{
    const url = `./data.json${force ? '?t=' + Date.now(): ''}`;
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error('fetch failed ' + res.status);
    const json = await res.json();
    STATE.data = json;
    // header
    todayLabel.textContent = fmtDate(json.date || '');
    globalHit.textContent = `${json.ai_accuracy ?? json.globalHit ?? 0}%`;
  }catch(e){
    console.error(e);
    VIEW.innerHTML = `<section class="card">データ取得エラー。data.json を確認してください。</section>`;
  }
}

// render venues grid (4x6)
function renderVenues(){
  STATE.screen = 'venues';
  STATE.venueId = null;
  STATE.raceId = null;
  const venues = (STATE.data && STATE.data.venues) ? STATE.data.venues : [];
  const html = document.createElement('div');
  html.className = 'venue-grid';
  venues.forEach(v=>{
    const div = document.createElement('div');
    div.className = 'venue';
    div.innerHTML = `
      <div class="venue-name">${v.name}</div>
      <button class="state-btn ${v.hasRacesToday? 'on':'off'}" data-vid="${v.id}" ${v.hasRacesToday? '':'disabled'}>${v.hasRacesToday? '開催中':'本日開催なし'}</button>
      <div style="margin-top:6px;font-size:13px;color:#6b7280;">的中率: ${v.aiRate ?? '-'}%</div>
    `;
    html.appendChild(div);
  });
  VIEW.innerHTML = '';
  const card = document.createElement('section'); card.className='card'; card.appendChild(html);
  VIEW.appendChild(card);

  // bind
  document.querySelectorAll('.state-btn.on').forEach(b=>{
    b.addEventListener('click', (ev)=>{
      const vid = b.getAttribute('data-vid');
      STATE.venueId = Number(vid);
      renderRaces();
    });
  });
}

// mount/unmount back button
function mountBack(){
  if(document.getElementById('backBtn')) return;
  const tpl = document.getElementById('tpl-back-btn');
  const node = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(node);
  node.addEventListener('click', ()=>{
    if(STATE.screen === 'race'){ renderRaces(); return; }
    if(STATE.screen === 'races'){ renderVenues(); return; }
  });
}
function unmountBack(){ const b = document.getElementById('backBtn'); if(b) b.remove(); }

// render races (1..12)
function renderRaces(){
  STATE.screen = 'races';
  mountBack();
  const venue = STATE.data.venues.find(x=> x.id === Number(STATE.venueId));
  const races = (STATE.data.races && STATE.data.races[String(venue.id)]) ? STATE.data.races[String(venue.id)] : [];
  const container = document.createElement('section'); container.className='card';
  const title = document.createElement('div'); title.className='h2'; title.textContent = `${venue.name}（1〜12R）`;
  container.appendChild(title);

  const grid = document.createElement('div'); grid.className='race-grid';
  for(let i=1;i<=12;i++){
    const r = races.find(x=> x.number === i);
    const btn = document.createElement('button');
    btn.className = 'race-btn ' + (r? '':'off');
    btn.textContent = `${i}R`;
    if(r){
      btn.addEventListener('click', ()=>{ STATE.raceId = r.raceId; renderRace(); });
    }
    grid.appendChild(btn);
  }
  container.appendChild(grid);
  VIEW.innerHTML = '';
  VIEW.appendChild(container);
}

// helper: highlight highest percent among fields: accepts array {el, pct}
function highlightHighest(elems){
  let max = -Infinity, maxEl = null;
  elems.forEach(o=>{
    const p = Number(String(o.pct).replace('%','').trim()) || 0;
    if(p>max){ max = p; maxEl = o.el; }
  });
  if(maxEl) maxEl.classList.add('high');
}

// render single race detail
function renderRace(){
  STATE.screen = 'race';
  mountBack();
  const venue = STATE.data.venues.find(x=> x.id === Number(STATE.venueId));
  const races = (STATE.data.races && STATE.data.races[String(venue.id)]) ? STATE.data.races[String(venue.id)] : [];
  const race = races.find(x=> x.raceId === STATE.raceId);
  if(!race){ VIEW.innerHTML = `<section class="card">レースデータなし</section>`; return; }

  // header pills (env)
  const sec = document.createElement('section'); sec.className='card';
  const h2 = document.createElement('div'); h2.className='h2';
  h2.textContent = `${venue.name} ${race.number}R　発走 ${race.startTime || '-'}`;
  sec.appendChild(h2);

  const envWrap = document.createElement('div');
  envWrap.style.display='flex'; envWrap.style.gap='8px'; envWrap.style.marginTop='8px';
  envWrap.innerHTML = `
    <div class="pill">天気: ${race.env?.weather ?? '-'}</div>
    <div class="pill">風向: ${race.env?.windDir ?? '-'}</div>
    <div class="pill">風速: ${race.env?.windSpeed ?? '-'} m/s</div>
    <div class="pill">波高: ${race.env?.wave ?? '-'} cm</div>
  `;
  sec.appendChild(envWrap);

  // entry table
  const table = document.createElement('table'); table.className='entry-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>枠</th><th>級</th><th>選手</th><th>平均ST</th>
        <th>当地（2連/3連）</th><th>モーター（No / 2連/3連）</th><th>コース勝率</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  // collect percentages to highlight
  const pctCandidates = [];

  (race.entries || []).forEach(e=>{
    const tr = document.createElement('tr');

    const nameWithF = `${e.name}${e.f ? ' / ' + e.f : ''}`;
    tr.innerHTML = `
      <td class="mono">${e.lane}</td>
      <td>${e.class}</td>
      <td style="text-align:left;padding-left:8px;">${nameWithF}</td>
      <td class="mono">${(e.avgST ?? '-').toFixed ? e.avgST.toFixed(2) : (e.avgST ?? '-')}</td>
      <td class="mono">${(e.local2 ?? '-') + ' / ' + (e.local3 ?? '-')}</td>
      <td class="mono">#${e.motor.no} (${e.motor.rate2 ?? '-'} / ${e.motor.rate3 ?? '-'})</td>
      <td class="mono">${e.courseRate ?? '-'}</td>
    `;
    tbody.appendChild(tr);

    // push candidates for highlight: local2, motor.rate2, courseRate (convert to number)
    if(e.local2) pctCandidates.push({ el: tr.children[4], pct: Number(String(e.local2).replace('%','')) });
    if(e.motor && e.motor.rate2) pctCandidates.push({ el: tr.children[5], pct: Number(String(e.motor.rate2).replace('%','')) });
    if(e.courseRate) pctCandidates.push({ el: tr.children[6], pct: Number(String(String(e.courseRate).replace(/[^0-9.]/g,''))) });
  });

  sec.appendChild(table);

  // AI boxes: main picks (5) and穴予想 (5)
  const aiWrap = document.createElement('div'); aiWrap.className='ai-area';
  const mainBox = document.createElement('div'); mainBox.className='ai-box';
  mainBox.innerHTML = `<h3>AI買い目（3連単 5点）</h3>`;
  const mainTable = document.createElement('table'); mainTable.className='picks-table';
  (race.predictions?.main || []).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.buy}</td><td class="pct">${p.probability}%</td><td style="text-align:right">${p.odds ? p.odds+'倍':''}</td>`;
    mainTable.appendChild(tr);
  });
  mainBox.appendChild(mainTable);

  const anaBox = document.createElement('div'); anaBox.className='ai-box';
  anaBox.innerHTML = `<h3>AI穴予想（5点）</h3>`;
  const anaTable = document.createElement('table'); anaTable.className='picks-table';
  (race.predictions?.ana || []).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.buy}</td><td class="pct">${p.probability}%</td><td style="text-align:right">${p.odds ? p.odds+'倍':''}</td>`;
    anaTable.appendChild(tr);
  });
  anaBox.appendChild(anaTable);

  aiWrap.appendChild(mainBox); aiWrap.appendChild(anaBox);
  sec.appendChild(aiWrap);

  // AI comments (per course)
  const comTitle = document.createElement('div'); comTitle.className='h2'; comTitle.style.marginTop='12px'; comTitle.textContent='展開予想 AIコメント（コース別）';
  sec.appendChild(comTitle);

  const comGrid = document.createElement('div'); comGrid.className='comment-grid';
  for(let lane=1; lane<=6; lane++){
    const box = document.createElement('div'); box.className='comment-box';
    const heading = document.createElement('div'); heading.className='comment-lane'; heading.textContent = `${lane}コース`;
    const text = document.createElement('div'); text.style.minHeight = '46px';
    const txt = (race.comments && race.comments[String(lane)]) ? race.comments[String(lane)] : '-';
    text.textContent = txt;
    box.appendChild(heading); box.appendChild(text);
    comGrid.appendChild(box);
  }
  sec.appendChild(comGrid);

  VIEW.innerHTML=''; VIEW.appendChild(sec);

  // highlight highest pct
  if(pctCandidates.length) highlightHighest(pctCandidates);
}

// initial boot
refreshBtn.addEventListener('click', async ()=>{
  await loadData(true); renderVenues();
});
(async ()=>{
  await loadData(false);
  renderVenues();
})();