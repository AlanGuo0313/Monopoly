'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Reuse the same isolated DOM/timer harness as the core game regression checks.
const setup=fs.readFileSync(path.join(__dirname,'verify-tokyo.cjs'),'utf8').split('(async()=>')[0];
const boot=new Function('require','__dirname',setup+'\nreturn boot;')(require,__dirname);
async function pump(b,decide=()=>{},until=()=>false){
 for(let i=0;i<120;i++){
  await Promise.resolve();await Promise.resolve();
  if(until())return;
  if(b.run('pending'))decide();
  else if(b.queue.length)b.queue.shift()();
 }
 throw Error('turn did not settle');
}
(async()=>{
 let b=boot();b.run(`
 for(let i=5;i<=9;i++){tiles[i].owner=1;tiles[i].level=1}
 if(estateRun(5)!==5||estateRun(7)!==5||estateMultiplier(9)!==2)throw Error('five-run endpoints');
 tiles[8].owner=2;if(estateRun(5)!==3||estateMultiplier(7)!==1.5||estateMultiplier(9)!==1)throw Error('split run');
 tiles[4].owner=1;if(estateRun(5)!==3)throw Error('special tile must break run');
 effects=false;geometryCapture=[];drawEstateEffects(1000);if(!geometryCapture.length)throw Error('persistent estate marker');geometryCapture=null;
 `);
 b=boot();b.run(`players[0].pos=1;tiles[1].owner=1;tiles[1].level=2;land();`);
 assert.equal(b.run('players[0].money'),28992);b.queue.shift()();
 b.run(`if(!pending||!pendingDeal||!$('roll').disabled)throw Error('takeover choice lock');buy();buy();skipPurchase();if(tiles[1].owner!==0||tiles[1].level!==2||players[0].money!==21792||players[1].money!==38208||!busy||pending)throw Error('takeover transfer / double click');`);
 assert.equal(b.queue.length,1);b.queue.shift()();assert.equal(b.run('turn'),1);
 b=boot();b.run(`players[0].pos=1;players[0].money=4000;tiles[1].owner=1;tiles[1].level=2;land();`);b.queue.shift()();
 assert.equal(b.run('pendingDeal===null&&turn===1'),true);
 // Two visited chain properties each charge once. The final property does not charge twice.
 b=boot();b.run(`for(let i=1;i<=3;i++){tiles[i].owner=1;tiles[i].level=1}`);
 let rolling=b.run('roll()');await pump(b,()=>b.run('skipPurchase()'),()=>b.run('turn===1'));await rolling;
 assert.equal(b.run('players[0].pos'),2);assert.equal(b.run('players[0].money'),28488);assert.equal(b.run('players[1].money'),31512);
 const restored=boot(b.store());assert.equal(restored.run('estateRun(1)===3&&estateMultiplier(2)===1.5&&players[0].money===28488'),true);
 b=boot();b.run(`players[0].pos=4;for(let i=5;i<=9;i++){tiles[i].owner=1;tiles[i].level=2}`);
 rolling=b.run('roll()');await pump(b,()=>b.run('skipPurchase()'),()=>b.run('turn===1'));await rolling;
 assert.equal(b.run('players[0].money===25968&&players[1].money===34032'),true);
 // Only the final destination offers takeover; intermediate properties keep their owners.
 b=boot();b.run(`for(let i=1;i<=3;i++){tiles[i].owner=1;tiles[i].level=1}`);
 rolling=b.run('roll()');await pump(b,()=>b.run("if(players[0].pos!==2)throw Error('mid-route takeover');buy()"),()=>b.run('turn===1'));await rolling;
 assert.equal(b.run('tiles[1].owner===1&&tiles[2].owner===0&&estateRun(1)===1'),true);
 assert.equal(b.run('players[0].money'),24888);assert.equal(b.run('players[1].money'),35112);
 // Own-property arrival requires a choice: skipping leaves money and level untouched.
 b=boot();b.run(`tiles[1].owner=0;tiles[1].level=1;players[0].pos=1;land();if(!pending||busy||pendingDeal.kind!=='upgrade'||tiles[1].level!==1||players[0].money!==30000)throw Error('upgrade must wait');skipPurchase();if(tiles[1].level!==1||players[0].money!==30000||turn!==1)throw Error('upgrade skip');`);
 // Confirmation charges exactly once, retains the turn until the event completes.
 b=boot();b.run(`tiles[1].owner=0;tiles[1].level=2;players[0].pos=1;land();buy();buy();skipPurchase();if(tiles[1].level!==3||players[0].money!==29100||!busy||pending||turn!==0)throw Error('upgrade confirmation');`);
 assert.equal(b.queue.length,1);b.queue.shift()();assert.equal(b.run('turn'),1);
 for(const [level,money] of [[3,30000],[1,1800]]){b=boot();b.run(`tiles[1].owner=0;tiles[1].level=${level};players[0].money=${money};players[0].pos=1;land();if(pending||pendingDeal||tiles[1].level!==${level}||players[0].money!==${money})throw Error('ineligible upgrade');`)}
 // Passing one's property does not prompt an upgrade; only the final own-property landing does.
 b=boot();b.run(`for(let i=1;i<=2;i++){tiles[i].owner=0;tiles[i].level=1}`);
 rolling=b.run('roll()');await pump(b,()=>b.run("if(players[0].pos!==2||pendingDeal.kind!=='upgrade')throw Error('intermediate upgrade');skipPurchase()"),()=>b.run('turn===1'));await rolling;
 assert.equal(b.run('players[0].money===30000&&tiles[1].level===1&&tiles[2].level===1'),true);
 // Cash exhaustion stops movement before the second step and credits only the actual cash.
 b=boot();b.run(`players[0].money=100;for(let i=1;i<=3;i++){tiles[i].owner=1;tiles[i].level=1}`);
 rolling=b.run('roll()');await pump(b,()=>{},()=>b.run('turn===1'));await rolling;
 assert.equal(b.run('players[0].pos===1&&players[0].out&&players[1].money===30100'),true);
 // AI takeover schedules one continuation, never advances the turn before its purchase event.
 b=boot();b.run(`turn=1;players[1].pos=1;tiles[1].owner=2;tiles[1].level=1;let called=0;if(!offerTakeover(()=>called++))throw Error('AI offer');if(called||tiles[1].owner!==1)throw Error('AI early advance');`);
 assert.equal(b.queue.length,1);b.queue.shift()();assert.equal(b.run('called'),1);
 console.log('PASS: 3/5 estate tiers, arrival-only takeover, optional upgrade confirm/skip/locks/limits, transfer conservation, per-step taxes without double rent, saved estates, bankruptcy stop and AI timing');
})().catch(error=>{console.error(error);process.exitCode=1});
