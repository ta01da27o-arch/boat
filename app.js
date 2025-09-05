const app = document.getElementById("app");

// モックデータ（3場）
const data = {
  venues: [
    {
      id: "fukuoka",
      name: "福岡",
      races: [
        {
          no: 1,
          entries: [
            {waku:1, class:"A1", name:"山田太郎", st:0.15, f:"F1", local:[45,40,30,20,5,7], motor:[50,40,30,20,10,5], course:[60,40,20,10,5,2]},
            {waku:2, class:"A2", name:"田中一郎", st:0.18, f:"", local:[30,25,20,15,5,3], motor:[40,35,30,15,10,5], course:[45,35,25,15,5,2]},
            {waku:3, class:"B1", name:"佐藤次郎", st:0.20, f:"", local:[20,18,15,10,5,2], motor:[30,25,20,15,10,5], course:[35,28,20,10,5,2]},
            {waku:4, class:"B1", name:"鈴木三郎", st:0.21, f:"F2", local:[15,12,10,8,5,1], motor:[25,20,15,10,5,2], course:[30,22,15,10,5,1]},
            {waku:5, class:"B2", name:"高橋四郎", st:0.23, f:"", local:[10,8,6,5,3,1], motor:[20,15,10,8,5,2], course:[25,18,12,8,5,2]},
            {waku:6, class:"B2", name:"伊藤五郎", st:0.25, f:"", local:[8,6,5,3,2,1], motor:[18,12,8,5,3,1], course:[20,15,10,5,3,1]}
          ],
          ai: {
            main:[{bet:"1-2-3",rate:56},{bet:"1-3-2",rate:20},{bet:"2-1-3",rate:10},{bet:"1-4-2",rate:8},{bet:"3-1-4",rate:6}],
            sub:[{bet:"3-1-4",rate:18},{bet:"4-1-2",rate:15},{bet:"2-3-1",rate:12},{bet:"5-1-2",rate:10},{bet:"6-1-2",rate:8}]
          },
          comments:[
            {no:1,text:"インから強力。地元水面も得意。"},
            {no:2,text:"差しが決まれば上位。"},
            {no:3,text:"スタートにムラあり。"},
            {no:4,text:"モーター力不足。"},
            {no:5,text:"展開待ち。"},
            {no:6,text:"-"}
          ]
        }
      ]
    },
    {
      id: "toda",
      name: "戸田",
      races: [
        {
          no: 1,
          entries: [
            {waku:1, class:"A1", name:"川口誠", st:0.16, f:"", local:[40,35,25,20,10,5], motor:[45,38,28,18,8,3], course:[55,32,22,12,6,2]},
            {waku:2, class:"A2", name:"村上翔", st:0.17, f:"", local:[32,28,20,15,8,4], motor:[38,33,25,15,10,5], course:[42,30,20,15,8,3]}
          ],
          ai: {
            main:[{bet:"1-2-3",rate:55},{bet:"1-3-2",rate:25}],
            sub:[{bet:"3-1-2",rate:15},{bet:"2-3-1",rate:10}]
          },
          comments:[
            {no:1,text:"地元巧者で安定感。"},
            {no:2,text:"展開次第で浮上。"}
          ]
        }
      ]
    },
    {
      id: "biwako",
      name: "琵琶湖",
      races: [
        {
          no: 1,
          entries: [
            {waku:1, class:"A1", name:"吉田健", st:0.14, f:"", local:[50,42,35,28,20,10], motor:[52,40,32,20,15,8], course:[60,38,25,15,10,5]}
          ],
          ai: {
            main:[{bet:"1-2-3",rate:52}],
            sub:[{bet:"2-3-1",rate:14}]
          },
          comments:[
            {no:1,text:"スピード戦に期待。"}
          ]
        }
      ]
    }
  ]
};

// 勝率記号を付ける関数
function getSymbols(values) {
  const ranked = [...values].map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v);
  const symbols = ["◎","○","△","✕","ー","ー"];
  const result = Array(values.length).fill("ー");
  ranked.forEach((r,idx)=>{
    result[r.i] = symbols[idx];
  });
  return result;
}

// 競艇場一覧
function showVenues() {
  app.innerHTML = `<h2>競艇場一覧</h2>
    <div class="grid venues">
      ${data.venues.map(v=>`<div class="card" onclick="showRaces('${v.id}')">${v.name}</div>`).join("")}
    </div>`;
}

// レース番号一覧
function showRaces(venueId) {
  const venue = data.venues.find(v=>v.id===venueId);
  app.innerHTML = `<h2>${venue.name} レース選択</h2>
    <div class="back-btn" onclick="showVenues()">戻る</div>
    <div class="grid races">
      ${venue.races.map(r=>`<div class="card" onclick="showEntries('${venueId}',${r.no})">${r.no}R</div>`).join("")}
    </div>`;
}

// 出走表
function showEntries(venueId, raceNo) {
  const venue = data.venues.find(v=>v.id===venueId);
  const race = venue.races.find(r=>r.no===raceNo);

  // 勝率記号を計算
  const localSymbols = getSymbols(race.entries.map(e=>e.local[0]));
  const motorSymbols = getSymbols(race.entries.map(e=>e.motor[0]));
  const courseSymbols = getSymbols(race.entries.map(e=>e.course[0]));

  app.innerHTML = `<h2>${venue.name} ${raceNo}R 出走表</h2>
    <div class="back-btn" onclick="showRaces('${venueId}')">戻る</div>

    <table class="table">
      <tr><th>枠</th><th>級</th><th>選手名</th><th>ST</th><th>F</th><th>当地</th><th>モーター</th><th>コース</th></tr>
      ${race.entries.map((e,i)=>`
        <tr>
          <td>${e.waku}</td>
          <td>${e.class}</td>
          <td>${e.name}</td>
          <td>${e.st}</td>
          <td>${e.f}</td>
          <td><span class="${localSymbols[i]==="◎"?"symbol-red":""}">${localSymbols[i]}</span>${e.local[0]}%</td>
          <td><span class="${motorSymbols[i]==="◎"?"symbol-red":""}">${motorSymbols[i]}</span>${e.motor[0]}%</td>
          <td><span class="${courseSymbols[i]==="◎"?"symbol-red":""}">${courseSymbols[i]}</span>${e.course[0]}%</td>
        </tr>
      `).join("")}
    </table>

    <h3>AI予想</h3>
    <p>本命: ${race.ai.main.map(a=>`${a.bet}(${a.rate}%)`).join(", ")}</p>
    <p>穴: ${race.ai.sub.map(a=>`${a.bet}(${a.rate}%)`).join(", ")}</p>

    <h3>コメント</h3>
    <ul>
      ${race.comments.map(c=>`<li>${c.no}号艇: ${c.text}</li>`).join("")}
    </ul>
  `;
}

showVenues();