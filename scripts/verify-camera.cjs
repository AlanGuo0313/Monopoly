// Portable regression checks; optional first argument is the project directory.
const projectRoot=require('node:path').resolve(process.argv[2]||require('node:path').join(__dirname,'..'));
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function boot(saved=null){let queue=[],els={},frames=[],store=saved;let gradient={addColorStop(){}};let cx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,isPointInPath:()=>false},{get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>{t[k]=v;return true}});function el(){return {hidden:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},replaceChildren(){},getContext:()=>cx,addEventListener(){},setPointerCapture(){}}}let math=Object.create(Math);math.random=()=>0;let sandbox={document:{body:{dataset:{}},getElementById:id=>els[id]??=el(),createElement:el},localStorage:{getItem:()=>store,setItem:(k,v)=>{store=v},removeItem:()=>{store=null}},window:{addEventListener(){}},matchMedia:()=>({matches:false}),setTimeout:f=>{queue.push(f);return queue.length},clearTimeout(){},performance:{now:()=>1000},requestAnimationFrame:f=>frames.push(f),innerWidth:1440,innerHeight:900,devicePixelRatio:1,Math:math,console,confirm:()=>false};vm.createContext(sandbox);for(let file of ['game.js','events.js','details.js','models.js','scene.js'])vm.runInContext(fs.readFileSync(require('node:path').join(projectRoot,file),'utf8'),sandbox,{filename:file});return {run:s=>vm.runInContext(s,sandbox),queue,els,store:()=>store}}

const b=boot();b.run(`
W=innerWidth;H=innerHeight;let previousCameraTime=0;function cameraFrame(now){const dt=Math.min(2,(now-previousCameraTime)/16.667||1);previousCameraTime=now;updateCamera(now,dt)}

cameraFrame(1000);
function pinned(now){const p=playerPose(turn,now),q=project(p.x,p.y,p.z);if(Math.abs(q.x-innerWidth*.48)>.001||Math.abs(q.y-innerHeight*.54)>.001)throw Error('character not pinned: '+JSON.stringify(q))}
for(let pos of [0,13,14,27,28,41,42,55]){players[0].pos=(pos+1)%56;moving={player:0,from:point(pos),to:point(players[0].pos),start:1000,duration:190};for(let t of [0,16,48,95,140,190]){cameraFrame(1000+t);pinned(1000+t)}}
moving=null;cameraFrame(1400);pinned(1400);
const originalAngle=angle;angle+=.8;cameraFrame(1416);pinned(1416);if(angle!==originalAngle+.8)throw Error('orbit lost');
players[1].pos=20;turn=1;cameraFrame(1432);if(Math.hypot(focus.x-playerPose(1,1432).x,focus.z-playerPose(1,1432).z)<1)throw Error('turn handoff snapped');for(let i=0;i<160;i++)cameraFrame(1448+i*16.667);pinned(4200);
follow=false;for(let i=0;i<160;i++)cameraFrame(4300+i*16.667);if(Math.hypot(focus.x,focus.y,focus.z)>.001||Math.abs(cameraMagnification-1)>.001)throw Error('overview not centered');
follow=true;for(let i=0;i<160;i++)cameraFrame(7100+i*16.667);pinned(10000);if(Math.abs(cameraMagnification-1.65)>.001)throw Error('follow magnification');
`);console.log('PASS: exact tracking on straights, all corners, wrap and jump; orbit preserved; smooth player handoff; overview and follow transitions');


const main=boot();main.run(`W=innerWidth;H=innerHeight;cameraMode='player';follow=true;players[0].pos=5;players[1].pos=30;turn=0;updateCamera(1000,1);const initial={...focus};turn=1;moving={player:1,from:point(30),to:point(31),start:1000,duration:190};for(let i=0;i<120;i++)updateCamera(1000+i*16.667,1);if(Math.hypot(focus.x-initial.x,focus.y-initial.y,focus.z-initial.z)>.00001)throw Error('main-player camera followed AI');moving={player:0,from:point(5),to:point(6),start:3000,duration:190};for(const now of [3000,3048,3095,3190]){updateCamera(now,1);const p=playerPose(0,now);if(Math.hypot(focus.x-p.x,focus.y-p.y,focus.z-p.z)>.00001)throw Error('main camera not locked to moving player')}`);console.log('PASS: main-player camera remains locked during AI turns and follows main-player motion');
