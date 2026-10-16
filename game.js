'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d');
const colors=['#d67b53','#629d9a','#a29bc3','#d5ad55'];
const names=['東京車站','丸之內','日本橋','神田','御神籤','秋葉原','御徒町','上野','鶯谷','日暮里','千駄木','根津','本鄉','文京稅務所','淺草寺','雷門','藏前','兩國','錦糸町','御神籤','押上','晴空塔','龜戶','清澄白河','門前仲町','豐洲','月島','築地','台場海濱','有明','新橋','汐留','濱松町','御神籤','芝公園','東京鐵塔','麻布十番','六本木','青山','表參道','原宿','澀谷','新宿御苑','代代木','新宿','高田馬場','目白','御神籤','池袋','大塚','巢鴨','駒込','田端','赤羽','王子','都民稅'];
const special={0:'start',4:'chance',13:'tax',14:'park',19:'fate',28:'park',33:'chance',42:'park',47:'fate',55:'tax'};
names[4]=names[33]='機會';names[19]=names[47]='命運';
const tiles=names.map((name,i)=>({name,type:special[i]||'land',price:1800+Math.floor(i/7)*450,owner:-1,level:0,color:['#f2a7bd','#a5a1ed','#65c8d2','#e9bd72','#82bd9e','#ed937c','#9facdf','#c595b5'][Math.floor(i/7)]}));
const players=['你','小夏','阿哲','米娜'].map((name,i)=>({name,money:30000,pos:0,out:false,color:colors[i]}));
let turn=0,round=1,busy=false,pending=false,finished=false,logs=[],startScreenActive=false,cameraMode='turn',follow=true,angle=.75,pitch=.78,zoom=1,spin=0,drag=null,polys=[],hits=[],W=0,H=0,focus={x:0,z:0},moving=null;
let pendingDeal=null;
function estateRun(index){
 const t=tiles[index];if(!t||t.type!=='land'||t.owner<0)return 0;
 let count=1;for(const direction of [-1,1])for(let step=1;step<tiles.length;step++){
  const other=tiles[(index+direction*step+tiles.length)%tiles.length];
  if(other.type!=='land'||other.owner!==t.owner)break;
  count++;if(count>=tiles.length)return tiles.length;
 }return count;
}
function estateMultiplier(index){const count=estateRun(index);return count>=5?2:count>=3?1.5:1}
function tileRent(index){const t=tiles[index];return Math.round(t.price*.28*Math.max(1,t.level)*estateMultiplier(index))}
function takeoverPrice(index){const t=tiles[index];return t.price*Math.max(1,t.level)*2}
const waitTurn=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function offerTakeover(resume){
 const p=players[turn],t=tiles[p.pos];if(p.out||t.type!=='land'||t.owner<0||t.owner===turn)return false;
 const price=takeoverPrice(p.pos);if(p.money<=price)return false;
 pendingDeal={kind:'takeover',pos:p.pos,owner:t.owner,price,resume};
 if(turn!==0){if(p.money>price+10000&&Math.random()<.3){completeTakeover();return true}pendingDeal=null;return false}
 pending=true;busy=false;status(`${t.name} · ${players[t.owner].name}持有 · 收購 ¥${price.toLocaleString()}（支付屋主，保留 ${t.level} 級）`);
 $('buy').textContent=`收購 ¥${price.toLocaleString()}`;$('skip').textContent='不收購，結束回合';ui();return true;
}
function completeTakeover(){
 const deal=pendingDeal,p=players[turn];if(!deal||deal.kind!=='takeover'||p.out)return;const t=tiles[deal.pos];
 if(t.owner!==deal.owner||p.pos!==deal.pos||p.money<=deal.price)return;
 pendingDeal=null;pending=false;busy=true;p.money-=deal.price;players[deal.owner].money+=deal.price;t.owner=turn;
 log(`${p.name}以 ¥${deal.price} 向${players[deal.owner].name}收購${t.name}，保留 ${t.level} 級。`);
 showEventFx('purchase',{title:t.name+' · 收購成功',subtitle:`¥${deal.price.toLocaleString()} 已付給${players[deal.owner].name}；連續持地加成已重新計算。`,amount:-deal.price,duration:1800});ui();setTimeout(deal.resume,1800);
}
function offerUpgrade(){
 const p=players[turn],t=tiles[p.pos];if(p.out||t.type!=='land'||t.owner!==turn||t.level>=3||p.money<=t.price)return false;
 const cost=Math.round(t.price*.5);pendingDeal={kind:'upgrade',pos:p.pos,owner:turn,level:t.level,cost,resume:next};
 if(turn!==0){if(p.money>t.price+1800&&Math.random()<.75){completeUpgrade();return true}pendingDeal=null;return false}
 pending=true;busy=false;status(`${t.name} · 目前 ${t.level} 級 · 升至 ${t.level+1} 級需 ¥${cost.toLocaleString()}`);
 $('buy').textContent=`升級 ¥${cost.toLocaleString()}`;$('skip').textContent='不升級，結束回合';ui();return true;
}
function completeUpgrade(){
 const deal=pendingDeal,p=players[turn];if(!deal||deal.kind!=='upgrade'||p.out)return;const t=tiles[deal.pos];
 if(p.pos!==deal.pos||t.owner!==turn||t.level!==deal.level||t.level>=3||p.money<=t.price)return;
 pendingDeal=null;pending=false;busy=true;p.money-=deal.cost;t.level++;
 log(`${t.name}升級至 ${t.level} 級，花費 ¥${deal.cost}。`);
 showEventFx('upgrade',{title:t.name+' · 升級 '+t.level+' 級',subtitle:'土地等級與租金已更新。',amount:-deal.cost,duration:1800});ui();setTimeout(deal.resume,1800);
}
function skipPurchase(){if(!pending||busy)return;const deal=pendingDeal;pendingDeal=null;pending=false;busy=true;ui();if(deal)deal.resume();else next()}
function point(i){if(i<=14)return{x:-14+i*2,z:14};if(i<=28)return{x:14,z:14-(i-14)*2};if(i<=42)return{x:14-(i-28)*2,z:-14};return{x:-14,z:-14+(i-42)*2}}
function log(t){logs.unshift(t);logs=logs.slice(0,15);$('log').replaceChildren(...logs.slice(0,7).map(t=>{let d=document.createElement('div');d.textContent=t;return d}));}
function save(){if(busy||pending)return;try{localStorage.setItem('tokyo-monopoly-v2',JSON.stringify({tiles,players,turn,round,logs,finished}));}catch{}}
function ui(){ document.body.dataset.decision=String(pending);$('players').replaceChildren(...players.map((p,i)=>{let d=document.createElement('div');d.className='player'+(i===turn?' active':'');d.innerHTML=`<span class="avatar" style="background:${p.color}">${i===0?skinAvatar():p.name[0]}</span><div><strong>${p.name}${p.out?' · 破產':''}</strong><small>${tiles.filter(t=>t.owner===i).length} 塊土地</small></div><span class="money">¥${p.money.toLocaleString()}</span>`;return d}));$('round').textContent=`第 ${round} 回合`;$('turnLabel').textContent=finished?'遊戲結束':`輪到${turn===0?'你':players[turn].name}了`;$('roll').disabled=busy||pending||turn!==0||finished;$('roll').hidden=pending;$('decision').hidden=!pending;$('mainMenu').disabled=busy||pending||turn!==0;}
function status(t){$('status').textContent=t;}
function next(){pending=false;busy=false;if(players.filter(p=>!p.out).length<=1){finished=true;let winner=players.find(p=>!p.out);status(`${winner.name}成為東京大亨！`);log(`${winner.name}贏得本局！`);ui();save();return}do{turn=(turn+1)%4;if(turn===0)round++}while(players[turn].out);status(turn===0?'請擲骰。':`${players[turn].name}準備擲骰…`);ui();save();if(turn!==0)setTimeout(roll,1100)}
function pay(p,amount,owner=-1){let paid=Math.min(p.money,amount);p.money-=paid;if(owner>=0)players[owner].money+=paid;if(p.money===0){p.out=true;tiles.forEach(t=>{if(t.owner===turn){t.owner=-1;t.level=0}});log(`${p.name}資金耗盡，退出本局。`)}ui();return paid}
function buy(){if(pendingDeal){if(pending&&!busy){if(pendingDeal.kind==='upgrade')completeUpgrade();else completeTakeover()}return}let p=players[turn],t=tiles[p.pos];if(t.type!=='land'||t.owner!==-1||p.money<t.price||p.out)return;p.money-=t.price;t.owner=turn;t.level=1;pending=false;busy=true;ui();log(`${p.name}以 ¥${t.price} 買下${t.name}。`);showEventFx('purchase',{title:t.name+' · 購入成功',subtitle:'土地已登記，連續持地可啟用通行稅加成。',amount:-t.price,duration:1800});setTimeout(next,1800)}
const chanceCards=[{title:'商店街集點回饋',text:'你支持在地商店，收到購物回饋金。',value:1000},{title:'東京祭典臨時攤位',text:'限定商品大受歡迎，獲得祭典收入。',value:1500},{title:'電車誤點，改搭計程車',text:'為了準時赴約，支付額外交通費。',value:-600}];
const fateCards=[{title:'投資分紅',text:'長期投資帶來好消息，獲得分紅。',value:2000},{title:'修繕通知 · 梅雨季防水',text:'東京梅雨將至，支付建物維護費。',value:-1200},{title:'緣結 · 社區合作計畫',text:'社區合作案順利完成，收到酬勞。',value:800}];
function land({passTaxPaid=false}={}){const p=players[turn],t=tiles[p.pos];busy=true;let delay=900,allowTakeover=false;log(`${p.name}抵達${t.name}。`);
if(t.type==='land'){
 if(t.owner===-1&&p.money>=t.price){if(turn===0){pending=true;busy=false;status(`${t.name} · 售價 ¥${t.price}`);$('buy').textContent=`購買 ¥${t.price}`;$('skip').textContent='略過';ui();return}if(p.money>t.price+1800){buy();return}}
 else if(t.owner>=0&&t.owner!==turn){allowTakeover=true;if(!passTaxPaid){const owner=t.owner,rent=tileRent(p.pos),paid=pay(p,rent,owner);log(`${p.name}向${players[owner].name}支付${estateRun(p.pos)>=3?'通行稅':'租金'} ¥${paid}。`);showEventFx('rent',{title:t.name+' · 租稅結算',subtitle:p.name+' → '+players[owner].name+(paid<rent?' · 資金不足，結清現金後破產':' · 金額已轉入屋主帳戶'),amount:-paid,owner,duration:2300});delay=2300}else delay=0}
 else if(t.owner===turn&&offerUpgrade())return;
}else if(t.type==='chance'||t.type==='fate'){const deck=t.type==='chance'?chanceCards:fateCards,card=deck[Math.floor(Math.random()*deck.length)];let actual=card.value;if(card.value>0)p.money+=card.value;else actual=-pay(p,-card.value);log(p.name+'抽到「'+card.title+'」：'+(actual>=0?'+':'−')+'¥'+Math.abs(actual));showEventFx(t.type,{title:card.title,subtitle:card.text,amount:actual,duration:2800});delay=2800}
else if(t.type==='tax'){pay(p,800);log(p.name+'繳納稅金 ¥800。')}
else if(t.type==='park'){p.money+=300;log(p.name+'享受假期，獲得 ¥300。')}
ui();setTimeout(()=>{if(!allowTakeover||!offerTakeover(next))next()},delay)}
async function roll(){if(startScreenActive||busy||pending||finished||players[turn].out)return;busy=true;ui();let a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);await animateDice(a,b);log(`${players[turn].name}擲出 ${a} + ${b}，前進 ${a+b} 格。`);status(`前進 ${a+b} 格`);let p=players[turn],passTaxPaid=false;for(let n=0;n<a+b;n++){
 let from=point(p.pos);p.pos=(p.pos+1)%56;moving={player:turn,from,to:point(p.pos),start:performance.now(),duration:190};
 if(p.pos===0){p.money+=5000;log(`${p.name}經過起點，領取 ¥5,000。`)}await waitTurn(200);moving=null;passTaxPaid=false;
 const t=tiles[p.pos];if(t.type==='land'&&t.owner>=0&&t.owner!==turn){
  if(estateRun(p.pos)>=3){const owner=t.owner,tax=tileRent(p.pos),paid=pay(p,tax,owner);passTaxPaid=true;
   log(`${p.name}經過${t.name}，向${players[owner].name}支付通行稅 ¥${paid}（${estateRun(p.pos)} 連地 ×${estateMultiplier(p.pos)}）。`);
   showEventFx('rent',{title:t.name+' · 通行稅',subtitle:`${p.name} → ${players[owner].name}；${estateRun(p.pos)} 連地，停留不重複扣款。`,amount:-paid,owner,duration:1800});await waitTurn(1800);
  }
  if(p.out){next();return}
 }
 if(p.out){next();return}busy=true;ui();status(`前進 ${a+b} 格 · 剩餘 ${a+b-n-1} 格`);
 }burst(point(p.pos),p.color,18);land({passTaxPaid})}
$('roll').onclick=()=>{initAudio();roll()};$('buy').onclick=buy;$('skip').onclick=skipPurchase;$('view').onchange=()=>{cameraMode=$('view').value;follow=cameraMode!=='overview'};
$('start').onclick=()=>{initAudio();$('welcome').hidden=true;if(turn!==0&&!finished)setTimeout(roll,900)};
$('reset').onclick=()=>{if(confirm('重新開始會清除本局進度，確定嗎？')){localStorage.removeItem('tokyo-monopoly-v2');location.reload()}};
try{let s=JSON.parse(localStorage.getItem('tokyo-monopoly-v2'));if(s&&s.players?.length===4&&s.tiles?.length===56){s.tiles.forEach((t,i)=>Object.assign(tiles[i],t));s.players.forEach((p,i)=>Object.assign(players[i],p));turn=s.turn;round=s.round;finished=s.finished;logs=s.logs||[];$('start').textContent='繼續遊戲';log('已載入上次的東京進度。');status(finished?'本局已結束，可重新開始。':'歡迎回到東京。')}}catch{}ui();

// Upgrade original Tokyo saves without changing ownership or player balances.
for(const i of [4,19,33,47]){tiles[i].type=special[i];tiles[i].name=names[i]}

// Cosmetic update applies to existing saves without changing progress or balances.
players[0].color=skinInfo(selectedSkin).color;ui();
function nailongAvatar(){return '<svg viewBox="0 0 40 44" role="img" aria-label="奶龍"><ellipse cx="20" cy="30" rx="14" ry="13" fill="#ffd34b"/><ellipse cx="20" cy="32" rx="8" ry="9" fill="#fff0b0"/><ellipse cx="20" cy="16" rx="14" ry="13" fill="#ffd34b"/><ellipse cx="20" cy="22" rx="12" ry="6" fill="#ffda63"/><ellipse cx="15" cy="14" rx="4" ry="5" fill="#fffdf0"/><ellipse cx="25" cy="14" rx="4" ry="5" fill="#fffdf0"/><ellipse cx="15" cy="14" rx="2.5" ry="3.5" fill="#77a74a"/><ellipse cx="25" cy="14" rx="2.5" ry="3.5" fill="#77a74a"/><ellipse cx="15" cy="14" rx="1" ry="2.5" fill="#25352a"/><ellipse cx="25" cy="14" rx="1" ry="2.5" fill="#25352a"/><path d="M15 24 Q20 28 25 24" fill="none" stroke="#9d7734" stroke-width="1.3" stroke-linecap="round"/></svg>'}
