// app.js - 完全版フルコード

// DOM参照
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

const venueTableBody   = document.getElementById('venueTableBody');
const raceTableBody    = document.getElementById('raceTableBody');
const entryTableBody   = document.getElementById('entryTableBody');
const predictTableBody = document.getElementById('predictTableBody');
const commentTableBody = document.getElementById('commentTableBody');

let raceData = {};
let todayStr = '';
let selectedVenue = null;
let selectedRace  = null;

// 日付処理
function formatDate(d){
  const y = d.getFullYear();
  const m = ('0'+(d.getMonth()+1)).slice(-2);
  const day = ('0'+d.getDate()).slice(-2);
  return `${y}${m}${day}`;
}
function getToday(){
  const now = new Date();
  return formatDate(now);
}

// データロード
async function loadData(){
  todayStr = getToday();
  todayLabel.textContent = todayStr;
  try{
    const res = await fetch('https://ta01da27o-arch.github.io/boat/data.json');
    raceData = await res.json();
    renderVenues();
  }catch(e){
    console.error('データ取得エラー', e);
  }
}

// 会場一覧
function renderVenues(){
  SCREEN_VENUES.style.display = 'block';
  SCREEN_RACES.style.display  = 'none';
  SCREEN_RACE.style.display   = 'none';
  venueTableBody.innerHTML = '';
  if(!raceData[todayStr]) return;
  Object.keys(raceData[todayStr]).forEach(venue=>{
    const races = Object.keys(raceData[todayStr][venue]).length;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${venue}</td><td>${races}R</td>`;
    tr.addEventListener('click', ()=>{
      selectedVenue = venue;
      renderRaces();
    });
    venueTableBody.appendChild(tr);
  });
}

// レース一覧
function renderRaces(){
  SCREEN_VENUES.style.display = 'none';
  SCREEN_RACES.style.display  = 'block';
  SCREEN_RACE.style.display   = 'none';
  raceTableBody.innerHTML = '';
  const races = raceData[todayStr][selectedVenue];
  Object.keys(races).forEach(rno=>{
    const r = races[rno];
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rno}R</td><td>${r.title||''}</td>`;
    tr.addEventListener('click', ()=>{
      selectedRace = rno;
      renderRaceDetail();
    });
    raceTableBody.appendChild(tr);
  });
}

// コメントテンプレート
const COMMENT_TEMPLATES = {
  "◎": [
    "イン速攻で展開有利。機力も十分で主導権を握れる一戦。",
    "スタート決めて押し切り濃厚。信頼度高い本命候補。",
    "当地実績もあり安定感抜群。中心視できる存在だ。"
  ],
  "○": [
    "差し鋭く逆転十分。展開ひとつで首位も狙える。",
    "好位確保で連対圏濃厚。侮れない存在だ。",
    "展開に恵まれれば本命を脅かす一番手。"
  ],
  "△": [
    "道中の展開次第で台頭も。穴として一考。",
    "序盤不安は残るが、展開絡めば見せ場あり。",
    "展開がハマれば波乱演出の可能性。"
  ],
  "✕": [
    "機力劣勢で苦戦気配も、大波乱なら一発あるか。",
    "不利な状況も侮れない。展開次第で一矢報いるか。",
    "上位は厳しいが、思い切りの良さで一発狙う。"
  ],
  "ー": [
    "データ不足で評価保留。直前気配に注目したい。"
  ]
};

// 評価記号生成
function getMark(value){
  if(value>=50) return "◎";
  if(value>=30) return "○";
  if(value>=20) return "△";
  return "✕";
}

// コメント生成
function generateCommentByEval(lane, b, mark){
  const templates = COMMENT_TEMPLATES[mark] || COMMENT_TEMPLATES["ー"];
  let base = templates[Math.floor(Math.random() * templates.length)];
  const st  = b.racer_average_start_timing!=null ? b.racer_average_start_timing.toFixed(2) : "-";
  const mt  = b.racer_assigned_motor_top_2_percent ?? b.racer_motor_win_rate ?? "-";
  const loc = b.racer_local_top_1_percent ?? b.racer_local_win_rate ?? "-";
  return `${lane}コース ${base} ST:${st} MT:${mt} 当地:${loc}`;
}

// 出走表
function renderRaceDetail(){
  SCREEN_VENUES.style.display = 'none';
  SCREEN_RACES.style.display  = 'none';
  SCREEN_RACE.style.display   = 'block';
  entryTableBody.innerHTML = '';
  predictTableBody.innerHTML = '';
  commentTableBody.innerHTML = '';

  const race = raceData[todayStr][selectedVenue][selectedRace];
  const boats = race.entries || [];
  const evalList = [];

  boats.forEach((b,i)=>{
    const lane = i+1;
    const local = b.racer_local_win_rate||0;
    const mt    = b.racer_motor_win_rate||0;
    const cwin  = b.racer_course_win_rate||0;
    const evalv = (local*mt*cwin/10000).toFixed(1);
    evalList.push({lane,value:evalv});

    const mark = getMark(evalv);

    const tr = document.createElement('tr');
    tr.classList.add(`row-${lane}`);
    tr.innerHTML = `
      <td>${lane}</td>
      <td>
        <div>${b.racer_rank||'-'}</div>
        <div>${b.racer_name||'-'}</div>
        <div>ST:${b.racer_average_start_timing?.toFixed(2)||'-'}</div>
      </td>
      <td>${b.racer_f_count||0}</td>
      <td>${local}</td>
      <td>${mt}</td>
      <td>${cwin}</td>
      <td><div style="color:${mark==='◎'?'red':'black'}">${mark}</div></td>
    `;
    entryTableBody.appendChild(tr);
  });

  // 買い目（例としてランダム）
  const lanes = [1,2,3,4,5,6];
  const picks = [];
  while(picks.length<10){
    const a = lanes[Math.floor(Math.random()*lanes.length)];
    const b = lanes[Math.floor(Math.random()*lanes.length)];
    if(a!==b){
      picks.push(`${a}-${b}`);
    }
  }
  const honmei = picks.slice(0,5);
  const ana    = picks.slice(5,10);

  predictTableBody.innerHTML = `
    <tr><td>本命</td><td>${honmei.join(', ')}</td></tr>
    <tr><td>穴</td><td>${ana.join(', ')}</td></tr>
  `;

  // コメント
  for(let lane=1; lane<=6; lane++){
    const b = boats[lane-1];
    if(!b) continue;
    const row = entryTableBody.querySelector(`.row-${lane} td:last-child div`);
    const mark = row ? row.textContent : 'ー';
    const text = generateCommentByEval(lane,b,mark);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${lane}コース</td><td style="text-align:left">${text}</td>`;
    commentTableBody.appendChild(tr);
  }
}

// イベント
refreshBtn.addEventListener('click', loadData);

// 初期化
loadData();