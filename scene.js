'use strict';
let night=true,effects=!matchMedia('(prefers-reduced-motion: reduce)').matches,sound=false,audio=null,particles=[],texts=[],lastFrame=0;
const depthRenderer=typeof createDepthRenderer==='function'?createDepthRenderer():null;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function initAudio(){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)()}catch{}}if(audio?.state==='suspended')audio.resume()}
function tone(hz,duration=.06,type='sine',volume=.035){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}
const pipMap=[[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9]];
for(let i=0;i<2;i++)$('cube'+i).innerHTML=pipMap.map(pips=>'<div class="face">'+pips.map(n=>`<i class="pip" style="grid-area:${Math.ceil(n/3)}/${(n-1)%3+1}"></i>`).join('')+'</div>').join('');
async function animateDice(a,b){$('diceStage').hidden=false;$('diceResult').textContent='';status('骰子轉動中…');for(let i=0;i<2;i++){$('cube'+i).style.transition='none';$('cube'+i).classList.add('rolling')}
for(let j=0;j<12;j++){tone(180+j*27,.05,'triangle');$('dice').textContent=String.fromCodePoint(0x2680+Math.floor(Math.random()*6))+' '+String.fromCodePoint(0x2680+Math.floor(Math.random()*6));await wait(85)}
const rotations=['rotateX(0deg) rotateY(0deg)','rotateY(-90deg)','rotateX(-90deg)','rotateX(90deg)','rotateY(90deg)','rotateY(180deg)'];[a,b].forEach((n,i)=>{let c=$('cube'+i);c.classList.remove('rolling');c.style.transition='transform .48s cubic-bezier(.2,.8,.3,1)';c.style.transform=rotations[n-1]});tone(105,.14,'triangle',.08);await wait(480);$('dice').textContent=String.fromCodePoint(0x267f+a)+' '+String.fromCodePoint(0x267f+b);$('diceResult').textContent=`${a} + ${b} = ${a+b}  ·  前進 ${a+b} 站`;tone(523,.14);await wait(800);$('diceStage').hidden=true}
function burst(p,color,count=25){if(!effects)return;for(let i=0;i<count;i++)particles.push({x:p.x,y:.4,z:p.z,vx:(Math.random()-.5)*.08,vy:.04+Math.random()*.09,vz:(Math.random()-.5)*.08,life:1,color})}
$('night').onclick=()=>{night=!night;document.body.dataset.night=night;$('night').textContent=night?'☀ 日景':'☾ 夜景'};
$('effects').onclick=()=>{effects=!effects;$('effects').textContent=effects?'✿ 特效開':'✿ 特效關';$('effects').setAttribute('aria-pressed',String(effects));if(!effects){particles=[];$('eventCard').classList.add('still')}};
$('effects').textContent=effects?'✿ 特效開':'✿ 特效關';$('effects').setAttribute('aria-pressed',String(effects));
$('sound').onclick=()=>{initAudio();sound=!sound;$('sound').textContent=sound?'♪ 音效開':'♪ 音效關';$('sound').setAttribute('aria-pressed',String(sound));tone(660,.12)};
$('home').onclick=()=>{angle=.75;pitch=.84;zoom=1;follow=cameraMode!=='overview'};
window.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body&&$('welcome').hidden){e.preventDefault();if(turn===0&&!busy&&!pending&&!finished){initAudio();roll()}}});
pitch=.84;
// Camera and model share this pose, including per-player spacing and jump animation.
let cameraMagnification=1.65,worldStaticFaces=[],worldDynamicFaces=[];
let renderRatio=devicePixelRatio||1,fpsSampleStart=0,fpsFrames=0;
function sampleFrame(now){if(!fpsSampleStart){fpsSampleStart=now;fpsFrames=0;return}fpsFrames++;const elapsed=now-fpsSampleStart;if(elapsed>=1000){$('fps').textContent='FPS '+Math.round(fpsFrames*1000/elapsed);fpsSampleStart=now;fpsFrames=0}}
const cameraTrack={ready:false,follow:null,player:-1,offset:{x:0,y:0,z:0}};
function playerPose(i,now){let p=players[i],pt=point(p.pos),jump=0;if(moving?.player===i){const t=Math.max(0,Math.min(1,(now-moving.start)/moving.duration));pt={x:moving.from.x+(moving.to.x-moving.from.x)*t,z:moving.from.z+(moving.to.z-moving.from.z)*t};jump=Math.sin(t*Math.PI)*.55}return{x:pt.x+(i%2?.38:-.38),y:.65+jump,z:pt.z+(i<2?.28:-.28),jump}}
function updateCamera(now,dt){const tracked=cameraMode==='player'?0:turn,pose=playerPose(tracked,now),target=follow?pose:{x:0,y:0,z:0};const changed=cameraTrack.follow!==follow||cameraTrack.player!==(follow?tracked:-1);
if(!cameraTrack.ready){focus.x=target.x;focus.y=target.y;focus.z=target.z;cameraTrack.ready=true}
else if(changed){cameraTrack.offset.x=focus.x-target.x;cameraTrack.offset.y=(focus.y||0)-target.y;cameraTrack.offset.z=focus.z-target.z}
const decay=Math.exp(-Math.min(dt,6)*16.667/160);for(const axis of ['x','y','z']){cameraTrack.offset[axis]*=decay;if(Math.abs(cameraTrack.offset[axis])<.00001)cameraTrack.offset[axis]=0;focus[axis]=target[axis]+cameraTrack.offset[axis]}
cameraMagnification+=((follow?1.65:1)-cameraMagnification)*(1-decay);cameraTrack.follow=follow;cameraTrack.player=follow?tracked:-1}
function project(x,y,z){x-=focus.x;y-=focus.y||0;z-=focus.z;const xx=x*Math.cos(angle)-z*Math.sin(angle),zz=x*Math.sin(angle)+z*Math.cos(angle),yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch);const scale=Math.min(W/(W>1050?52:47),H/37)*zoom*cameraMagnification*80/(80-depth);return{x:W*(W>1050?.48:.47)+xx*scale,y:H*.54-yy*scale,depth}}
function poly(pts,color,stroke='#ffffff09',tile=-1,vertexColors=null){if(geometryCapture){geometryCapture.push({pts,color,stroke,tile,vertexColors});return}if(depthRenderer?.supportsWorld){const face={pts,color,stroke,tile,vertexColors};worldDynamicFaces.push(face);if(tile>=0){const pp=pts.map(p=>project(...p));polys.push({pp,color,stroke,tile,depth:pp.reduce((a,p)=>a+p.depth,0)/pp.length})}return}if(!depthRenderer&&tile<0&&pts.length===4){const a=pts[0],b=pts[1],c=pts[2],d=pts[3],u=Math.ceil(Math.hypot(...b.map((v,i)=>v-a[i]))/2),v=Math.ceil(Math.hypot(...d.map((v,i)=>v-a[i]))/2);if(u>1||v>1){const at=(s,t)=>a.map((x,i)=>x*(1-s)*(1-t)+b[i]*s*(1-t)+c[i]*s*t+d[i]*(1-s)*t);for(let i=0;i<u;i++)for(let j=0;j<v;j++){const pp=[at(i/u,j/v),at((i+1)/u,j/v),at((i+1)/u,(j+1)/v),at(i/u,(j+1)/v)].map(p=>project(...p));polys.push({pp,color,stroke:'#00000000',depth:pp.reduce((sum,p)=>sum+p.depth,0)/pp.length,tile})}return}}let pp=pts.map(p=>project(...p));polys.push({pp,color,stroke,depth:pp.reduce((a,p)=>a+p.depth,0)/pp.length,tile,vertexColors})}
function shade(hex,n){return '#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+n)).toString(16).padStart(2,'0')).join('')}
function box(x,y,z,w,h,d,color,tile=-1){let l=x-w/2,r=x+w/2,f=z-d/2,b=z+d/2,t=y+h;poly([[l,y,f],[r,y,f],[r,t,f],[l,t,f]],shade(color,-24));poly([[r,y,f],[r,y,b],[r,t,b],[r,t,f]],shade(color,-15));poly([[r,y,b],[l,y,b],[l,t,b],[r,t,b]],shade(color,-7));poly([[l,y,b],[l,y,f],[l,t,f],[l,t,b]],shade(color,-18));poly([[l,t,f],[r,t,f],[r,t,b],[l,t,b]],color,'#ffffff12',tile)}
function beam(a,b,w,color){let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dz)||1,ox=dz/len*w/2,oz=-dx/len*w/2;poly([[a[0]+ox,a[1],a[2]+oz],[a[0]-ox,a[1],a[2]-oz],[b[0]-ox,b[1],b[2]-oz],[b[0]+ox,b[1],b[2]+oz]],color);poly([[a[0],a[1]+w/2,a[2]],[a[0],a[1]-w/2,a[2]],[b[0],b[1]-w/2,b[2]],[b[0],b[1]+w/2,b[2]]],color)}
function ring(x,y,z,r,color){let pts=[];for(let i=0;i<12;i++){let a=i*Math.PI/6;pts.push([x+Math.cos(a)*r,y,z+Math.sin(a)*r])}poly(pts,color)}
function roof(x,y,z,w,d,color){curvedRoof(x,y,z,w,d,color)}
function sakura(x,z,s=1){fineSakura(x,z,s)}
function building(x,z,w,d,h,seed=0){fineBuilding(x,z,w,d,h,seed)}
function tokyoTower(){let x=-4,z=0;box(x,.14,z,3,.22,3,night?'#44455b':'#c7c4b8');for(let side of [-1,1])for(let side2 of [-1,1]){beam([x+side*1.2,.3,z+side2*1.2],[x+side*.32,4.8,z+side2*.32],.14,'#ea876d');beam([x+side*.32,4.9,z+side2*.32],[x,7,z],.09,'#f7bd9e')}
for(let j=0;j<5;j++){let y=.5+j*.85,r=1.2-j*.17,nr=r-.17;let col=j%2?'#f4cfb9':'#df785e';for(let sign of [-1,1]){beam([x-r,y,z+sign*r],[x+nr,y+.85,z+sign*nr],.07,col);beam([x+r,y,z+sign*r],[x-nr,y+.85,z+sign*nr],.07,col);beam([x+sign*r,y,z-r],[x+sign*nr,y+.85,z+nr],.07,col);beam([x+sign*r,y,z+r],[x+sign*nr,y+.85,z-nr],.07,col)}}roundedBox(x,3.7,z,1.6,.32,1.6,'#f6d3b4',.1);roundedBox(x,4.02,z,1.35,.32,1.35,night?'#dbad81':'#a6c3c9',.08);for(let side of [-1,1])for(let i=-3;i<=3;i++)box(x+i*.16,4.04,z+side*.685,.035,.27,.025,'#f3dfc5');box(x,5.7,z,.65,.22,.65,'#f0d2bc');beam([x,6.7,z],[x,8,z],.08,'#f5cfb5');ring(x,8,z,.09,'#ff8da8')}
function skytree(){let x=6.3,z=-6.5;box(x,.13,z,2,.2,2,night?'#4f5d72':'#ccd0cd');for(let a=0;a<3;a++){let t=a*Math.PI*2/3;beam([x+Math.cos(t)*.65,.3,z+Math.sin(t)*.65],[x,7.2,z],.18,night?'#b3b9d6':'#acbcc6')}for(let j=0;j<7;j++)ring(x,j*.9+.5,z,.65-j*.055,night?'#a6b6cc':'#c5d6de');cylinder(x,5.2,z,.68,.35,night?'#a2c8e7':'#b2ced8',20,.55);cylinder(x,5.55,z,.55,.25,night?'#dfb4e8':'#cfb5d0',20,.4);cylinder(x,6.7,z,.34,.35,'#abc9da',16,.28);for(let i=0;i<16;i++){const a=i*Math.PI/8;beam([x+Math.cos(a)*.6,5.2,z+Math.sin(a)*.6],[x+Math.cos(a)*.48,5.55,z+Math.sin(a)*.48],.025,'#dbe5e5')}beam([x,7,z],[x,9.1,z],.1,'#d2d6e6')}
function temple(){let x=7,z=5;box(x,.12,z,4,.32,3.3,night?'#64596b':'#bdb3a1');box(x,.44,z,2.8,1.2,2,'#b55d67');for(let a=-1;a<=1;a++){cylinder(x+a*.9,.5,z+1.03,.065,1.15,'#e4b6a0',10);for(let j=0;j<4;j++)box(x+a*.9,.65+j*.19,z+1.045,.065,.065,.025,'#b47c71')}for(let i=0;i<3;i++)box(x,.15+i*.09,z+1.7-i*.15,2.4,.09,.4,'#a99c94');roof(x,1.65,z,3.8,3.2,night?'#474f67':'#5e6b6f');box(x,2.18,z,2.1,.3,1.2,'#e6c7a4');roof(x,2.5,z,2.8,2,'#526075');for(let a of [-1,1]){box(x+a*1.2,.15,z+3,.17,1.8,.17,'#cf6575');box(x+a*1.2,.7,z+3,.28,.6,.28,'#f1b4a4')}box(x,1.55,z+3,3,.17,.2,'#cb6777');box(x,1.95,z+3,3.35,.16,.3,'#785468');box(x,.85,z+3,.4,.65,.38,night?'#f6b09c':'#e0887b');for(let level=0;level<4;level++){box(10,.2+level*.75,3,.75,.5,.75,'#ac5c67');roof(10,.7+level*.75,3,1.5,1.5,'#53586e')}beam([10,3.5,3],[10,4.2,3],.05,'#d7b18b')}
function streetlamp(x,z){cylinder(x,.13,z,.035,1.3,night?'#687b91':'#8d9da2',8,.025);roundedBox(x,1.43,z,.32,.09,.2,night?'#ffdb9c':'#e8c9a5',.025);cylinder(x,.13,z,.12,.065,'#85909c',10)}
function label(txt,x,y,z,size,color,weight='500'){let p=project(x,y,z);ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI","Microsoft JhengHei",sans-serif`;ctx.textAlign='center';ctx.fillText(txt,p.x,p.y)}
const cityBlocks=[];for(let a=0;a<7;a++)for(let b=0;b<3;b++){let x=-9+a*2.45,z=-9+b*2.25;if(x>3&&z<-4)continue;cityBlocks.push({x,z,w:1.2+(a%2)*.35,d:1.25,h:.8+((a*7+b*3)%6)*.55,seed:a*3+b})}
// Cache full-resolution scenery by theme so the backdrop adds no per-frame geometry work.
const fujiBackdrops=new Map();
function background(now){const ratio=renderRatio,key=night?'night':'day';let cached=fujiBackdrops.get(key);if(!cached||cached.width!==W||cached.height!==H||cached.ratio!==ratio){const image=document.createElement('canvas');image.width=Math.max(1,Math.round(W*ratio));image.height=Math.max(1,Math.round(H*ratio));const g=image.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);paintFuji(g,W,H,night);cached={width:W,height:H,ratio,image};fujiBackdrops.set(key,cached)}ctx.drawImage(cached.image,0,0,W,H)}
function paintFuji(g,w,h,dark){
 const horizon=h*.59,peakX=w*.43,peakY=h*.145,baseLeft=-w*.1,baseRight=w*.96;
 const sky=g.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,dark?'#111d39':'#89b8d0');sky.addColorStop(.6,dark?'#344263':'#cbd9df');sky.addColorStop(1,dark?'#b18c9e':'#f3d9c9');g.fillStyle=sky;g.fillRect(0,0,w,h);
 const halo=g.createRadialGradient(w*.76,h*.18,3,w*.76,h*.18,h*.2);halo.addColorStop(0,dark?'#d8dfed25':'#ffe4b899');halo.addColorStop(1,'#ffffff00');g.fillStyle=halo;g.fillRect(w*.76-h*.2,0,h*.4,h*.4);g.fillStyle=dark?'#e5e6df':'#ffe8c5';g.beginPath();g.arc(w*.76,h*.18,dark?15:24,0,Math.PI*2);g.fill();
 if(dark){g.fillStyle='#e1e7f7';for(let i=0;i<55;i++){g.globalAlpha=.2+(i%5)*.1;g.beginPath();g.arc(((i*173.37)%w),h*.025+((i*37.83)%(h*.25)),i%7===0?1.2:.65,0,Math.PI*2);g.fill()}g.globalAlpha=1}
 // Layered foothills extend across the entire viewport.
 const ridge=(base,amplitude,color,phase)=>{g.beginPath();g.moveTo(0,horizon+20);for(let i=0;i<=32;i++){const x=i*w/32,y=base-Math.sin(i*.48+phase)*amplitude-Math.cos(i*.93+phase)*amplitude*.3;g.lineTo(x,y)}g.lineTo(w,horizon+20);g.closePath();g.fillStyle=color;g.fill()};ridge(h*.47,h*.055,dark?'#596a8c':'#afc2cf',.3);ridge(h*.53,h*.045,dark?'#435b7b':'#95b1c1',1.6);
 const outline=()=>{g.beginPath();g.moveTo(baseLeft,horizon);g.bezierCurveTo(w*.12,h*.55,w*.24,h*.37,peakX-w*.026,peakY+.008*h);g.lineTo(peakX-w*.012,peakY);g.lineTo(peakX+w*.02,peakY+.006*h);g.bezierCurveTo(w*.62,h*.37,w*.71,h*.52,baseRight,horizon);g.closePath()};
 const mountain=()=>{g.save();outline();g.clip();const rock=g.createLinearGradient(w*.22,peakY,w*.6,horizon);rock.addColorStop(0,dark?'#657da4':'#829cb7');rock.addColorStop(.5,dark?'#415a84':'#65839f');rock.addColorStop(1,dark?'#314c6c':'#52738d');g.fillStyle=rock;g.fillRect(baseLeft,peakY,w*1.2,horizon);g.fillStyle=dark?'#95a6c327':'#d1dce248';g.beginPath();g.moveTo(peakX-w*.018,peakY);g.lineTo(w*.18,horizon);g.lineTo(w*.46,horizon);g.lineTo(peakX+w*.005,peakY);g.closePath();g.fill();
 // Snow cap with an irregular melt line and descending snow gullies.
 const snow=g.createLinearGradient(0,peakY,0,h*.35);snow.addColorStop(0,dark?'#e0e5ed':'#fff8eb');snow.addColorStop(1,dark?'#a6b8ce':'#d7e5eb');g.fillStyle=snow;g.beginPath();g.moveTo(w*.26,peakY-8);g.lineTo(w*.58,peakY-8);g.lineTo(w*.58,h*.275);for(let i=14;i>=0;i--){const x=w*(.3+i*.018),y=h*(.267+.024*Math.sin(i*2.1)+.012*Math.cos(i*.8));g.lineTo(x,y);if(i%3===0){g.lineTo(x-w*.009,y+h*.06);g.lineTo(x-w*.016,y+h*.014)}}g.lineTo(w*.26,peakY-8);g.closePath();g.fill();
 g.lineCap='round';for(let i=0;i<17;i++){const t=(i-8)/8,x=peakX+t*w*.016,endX=peakX+t*w*.33;g.beginPath();g.moveTo(x,peakY+h*.028);g.quadraticCurveTo(peakX+t*w*.12,h*.36,endX,horizon);g.strokeStyle=i%2?(dark?'#c1cfdf25':'#eaf0eb38'):(dark?'#243f6729':'#395f8630');g.lineWidth=1+(i%3)*1.2;g.stroke()}g.restore()};mountain();
 ridge(horizon-h*.009,h*.018,dark?'#2c4966':'#6c939f',.8);
 const lake=g.createLinearGradient(0,horizon,0,h);lake.addColorStop(0,dark?'#526580':'#92b7bf');lake.addColorStop(.45,dark?'#243f5c':'#719eae');lake.addColorStop(1,dark?'#152b44':'#527c93');g.fillStyle=lake;g.fillRect(0,horizon,w,h-horizon);
 g.save();g.beginPath();g.rect(0,horizon,w,h-horizon);g.clip();g.globalAlpha=dark?.16:.22;g.translate(0,horizon*1.52);g.scale(1,-.52);mountain();g.restore();
 // Horizontal water highlights soften the reflected mountain.
 for(let i=0;i<75;i++){const y=horizon+(h-horizon)*(i/75),x=((i*139.7)%w),length=12+(i%7)*17;g.strokeStyle=dark?'#b5c7dd16':'#e3f0ed38';g.lineWidth=.6+(i%3)*.3;g.beginPath();g.moveTo(x,y);g.lineTo(x+length,y);g.stroke()}
 const mist=g.createLinearGradient(0,h*.51,0,h*.68);mist.addColorStop(0,'#ffffff00');mist.addColorStop(.5,dark?'#a4b2ca15':'#eceddf3b');mist.addColorStop(1,'#ffffff00');g.fillStyle=mist;g.fillRect(0,h*.51,w,h*.17);
 // Dark shoreline vegetation anchors the lower edge, leaving the board unobstructed.
 g.fillStyle=dark?'#102a3c':'#416c76';g.beginPath();g.moveTo(0,h);for(let i=0;i<=40;i++){const x=i*w/40,y=h*.94+Math.sin(i*.73)*h*.025;g.lineTo(x,y)}g.lineTo(w,h);g.closePath();g.fill();
}
function buildCity(now){let base=night?'#35445b':'#c9c6bd',paving=night?'#576173':'#e1d8c7';box(0,-1,0,31,.75,31,night?'#333b52':'#8d9c9b');box(0,-.25,0,30.5,.2,30.5,base);box(0,-.05,0,26,.12,26,night?'#3e5361':'#c7d2c1');
// Edge illumination and recessed city streets.
for(let s of [-1,1]){box(0,-.4,s*15.51,30,.06,.035,night?'#bfa6d6':'#d9aca9');box(s*15.51,-.4,0,.035,.06,30,night?'#9dbcd7':'#d9aca9');box(0,.08,s*11.8,24,.03,.65,night?'#313d51':'#a7aead');box(s*11.8,.08,0,.65,.03,24,night?'#313d51':'#a7aead')}
for(let z of [-3,1.8])box(-1,.08,z,21,.025,.6,night?'#303c51':'#a7aead');box(-.2,.08,-2,.65,.03,19,night?'#303c51':'#a7aead');for(let j=-10;j<=10;j+=2){box(j,.12,-3,.55,.012,.035,'#c1bbad');box(-.2,.12,j,.035,.012,.55,'#c1bbad')}
box(-6,.1,6,9.2,.04,7.4,night?'#4a665e':'#a2ba99');box(-3,.16,6,1,.02,6,night?'#9b8f8f':'#d8c7b3');box(-6,.16,8.3,8,.02,.8,night?'#9b8f8f':'#d8c7b3');
// Sumida river with animated reflective bands.
box(3.4,.08,-1.7,1.8,.05,18.9,night?'#3b718b':'#81b7bf');
for(let z of [-3,1.8,8]){box(3.4,.25,z,2.5,.17,.8,paving);for(let edge of [-1,1])box(3.4,.43,z+edge*.4,2.5,.15,.06,night?'#be9f9c':'#c4aca0')}
cityBlocks.forEach(b=>building(b.x,b.z,b.w,b.d,b.h,b.seed));building(-9,0,1.6,2,3.4,2);building(-8,3,1.9,1.3,1.7,5);building(8,-1.4,1.8,1.5,3.7,1);building(10,-2,1.4,1.3,2.7,3);building(5.9,-1,1.3,1.4,2.5,4);
// Animated neon strips and billboards.
box(-9,1.3,1.02,1.25,1,.03,night?'#d69db9':'#b27f99');box(-9,2.5,1.03,1.1,.4,.03,night?'#91cbd3':'#80a7ad');box(8,1.8,-.64,1.3,.5,.03,night?'#b5a3d9':'#a38cb4');
tokyoTower();skytree();temple();
for(let [x,z,s] of [[-10,5,.9],[-8.5,6,.8],[-6.9,5,1],[-4.8,5,.8],[-1.8,5,.85],[-9.7,9.5,.8],[-7.7,9.7,1],[-5.6,9.8,.8],[-3.5,9.5,.9],[-1.8,9.7,.8],[5,9.6,.85],[7,10,.8],[10,9,.8],[10,7,.8]])sakura(x,z,s);
for(let x=-9;x<11;x+=4)for(let z of [-11.3,11.3])streetlamp(x,z);streetlamp(-1.5,3.2);streetlamp(5,3.2);
// Yamanote-inspired elevated railway, looping continuously.
for(let s of [-1,1]){box(0,.4,s*10.5,21,.1,.54,night?'#69747a':'#a4aaa0');box(s*10.5,.4,0,.54,.1,21,night?'#69747a':'#a4aaa0');for(let k=-8;k<10;k+=3){box(k,.1,s*10.5,.18,.3,.25,base);box(s*10.5,.1,k,.25,.3,.18,base)}}
// Lit stations, taxi and a pedestrian crossing.
box(-5,.12,11.8,2.4,.45,.7,night?'#7d807c':'#e4d6be');roof(-5,.57,11.8,2.8,1.2,'#8d6473');for(let k=0;k<6;k++)box(-.85+k*.24,.14,1.8,.12,.02,.65,'#d4d5cf');}
function dynamicCity(now){for(let i=0;i<12;i++){let z=-10+((i*1.6+now*.00045)%18.5);box(3.4+Math.sin(i*4)*.38,.15,z,.45+(i%3)*.16,.008,.04,night?'#709bac':'#b8dcdd')}
for(let i=0;i<3;i++){let v=((now*.00125-i*.82)%84+84)%84,tx,tz,horizontal;if(v<21){tx=-10.5+v;tz=10.5;horizontal=true}else if(v<42){tx=10.5;tz=10.5-(v-21);horizontal=false}else if(v<63){tx=10.5-(v-42);tz=-10.5;horizontal=true}else{tx=-10.5;tz=-10.5+(v-63);horizontal=false}vehicleModel(tx,tz,horizontal,true)}

vehicleModel(-10+(now*.0008)%20,-3,true,false);for(let side of [-1,1])box(-.2+side*.65,1.17,1.275,.08,.07,.018,(Math.floor(now/8000)%2)?'#d39a8e':'#9dd7b8')}
// Rounded procedural Nailoong model; no downloaded assets or runtime dependencies.
function drawNailong(pose,now){
 const index=players[0].pos,from=moving?.player===0?moving.from:point((index+55)%56),to=moving?.player===0?moving.to:point(index),yaw=Math.atan2(to.x-from.x,to.z-from.z),cs=Math.cos(yaw),sn=Math.sin(yaw),step=moving?.player===0?Math.sin(Math.max(0,Math.min(1,(now-moving.start)/moving.duration))*Math.PI*2):0;
 const sway=effects?(moving?.player===0?step*.04:Math.sin(now*.002)*.012):0;
 const transform=(x,y,z)=>[pose.x+x*cs+z*sn,.28+pose.jump+y,pose.z-x*sn+z*cs];
 const mesh=(x,y,z,rx,ry,rz,color,segments=12,bands=8)=>sphereMesh(x,y,z,rx,ry,rz,color,segments,bands,transform);
 const yellow='#ffd34b',cream='#fff0b0',toe='#a7804d';
 // Tapered tail first, plus rounded feet and a pear-shaped body.
 mesh(0,.34,-.37,.19,.18,.29,yellow);mesh(0,.35,-.62,.1,.1,.16,yellow,10,6);
 for(const side of [-1,1]){mesh(side*.19,.095+Math.max(0,side*step)*.025,.12,.17,.1,.21,yellow);for(let j=0;j<3;j++)mesh(side*.19+(j-1)*.065,.055,.29,.025,.028,.035,toe,8,4)}
 mesh(0,.48+sway,.015,.4,.44,.31,yellow,16,10);mesh(0,.45+sway,.284,.255,.3,.047,cream,14,8);
 for(const side of [-1,1]){mesh(side*.39,.52+sway+side*step*.035,.07,.13,.18,.12,yellow);mesh(side*.425,.4+sway+side*step*.035,.13,.1,.09,.1,yellow,10,6)}
 // Broad head and muzzle; large green eyes give the miniature a readable face.
 mesh(0,.94+sway,.025,.36,.33,.31,yellow,16,10);mesh(0,.82+sway,.26,.305,.145,.17,yellow,14,8);
 for(const side of [-1,1]){mesh(side*.135,1.055+sway,.27,.107,.123,.055,'#fffdf0',12,8);mesh(side*.135,1.06+sway,.319,.064,.077,.024,'#77a74a',10,8);mesh(side*.135,1.06+sway,.34,.033,.053,.012,'#25352a',10,6);mesh(side*.135-.017,1.088+sway,.352,.014,.019,.007,'#fffdf7',8,4);mesh(side*.09,.875+sway,.412,.015,.011,.008,'#a88439',8,4)}
 // Small curved smile and subtle back ridges, visible from either orbit side.
 const smile=[];for(let i=0;i<=10;i++){const x=-.14+i*.028;smile.push(transform(x,.755+sway+.037*(x/.14)**2,.402-.025*(x/.14)**2))}for(let i=0;i<smile.length-1;i++)beam(smile[i],smile[i+1],.012,'#9d7734');
 for(const [y,z,r] of [[.88,-.275,.075],[.66,-.295,.07],[.43,-.32,.065],[.38,-.51,.05]])mesh(0,y+sway,z,r,r*.85,r,'#e8ad37',8,5);
}
function render(now){const dt=Math.min(2,(now-lastFrame)/16.667||1);lastFrame=now;W=innerWidth;H=innerHeight;sampleFrame(now);renderRatio=devicePixelRatio||1;let dpr=renderRatio;const pixelWidth=Math.max(1,Math.round(W*dpr)),pixelHeight=Math.max(1,Math.round(H*dpr));if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight}ctx.setTransform(dpr,0,0,dpr,0,0);background(now);updateCamera(now,dt);
// Soft ambient contact shadow under the whole diorama.
let center=project(0,-1.2,0);ctx.save();ctx.translate(center.x,center.y+25);ctx.scale(1,.42);let sh=ctx.createRadialGradient(0,0,15,0,0,Math.min(W*.38,H*.6)*zoom);sh.addColorStop(0,'#00081866');sh.addColorStop(1,'#00081800');ctx.fillStyle=sh;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();polys=[];worldDynamicFaces=[];replayStaticCity();dynamicCity(effects?now:0);drawEventGeometry(now);
for(let i=0;i<tiles.length;i++){let t=tiles[i],pt=point(i),selected=players[turn].pos===i;let c=night?(t.type==='land'?'#c6c4c2':'#b8bbc5'):(t.type==='land'?'#f4e9d8':'#d8dde0');roundedBox(pt.x,0,pt.z,1.89,.22,1.89,c,.07,i);const horizontal=pt.z===14||pt.z===-14,side=pt.z===14?-1:pt.z===-14?1:pt.x===14?-1:1;if(t.type==='land'){box(pt.x+(horizontal?0:side*.72),.23,pt.z+(horizontal?side*.72:0),horizontal?1.85:.35,.025,horizontal?.35:1.85,t.color);if(t.owner>=0){drawPropertyModel(t,pt)}}
if(selected){let r=effects?1+Math.sin(now*.003)*.08:1.02;for(let v of [-1,1]){box(pt.x,.27,pt.z+v*r,1.95,.025,.04,players[turn].color);box(pt.x+v*r,.27,pt.z,.04,.025,1.95,players[turn].color)}}}
players.forEach((p,i)=>{if(p.out)return;const pose=playerPose(i,now),x=pose.x,z=pose.z,jump=pose.jump;ring(x,.28,z,i===0?.42:.25,shade(p.color,-30));if(i===0){drawNailong(pose,now)}else{drawHuman(pose,i,now)} if(i===turn){let bob=effects?Math.sin(now*.004)*.08:0;const height=i===0?.38:0;poly([[x-.15,1.55+height+bob+jump,z],[x+.15,1.55+height+bob+jump,z],[x,1.3+height+bob+jump,z]],'#f4c7d5')}});
if(!depthRenderer)polys.sort((a,b)=>a.depth-b.depth);hits=polys.filter(p=>p.tile>=0).sort((a,b)=>a.depth-b.depth);
if(depthRenderer){if(depthRenderer.supportsWorld){depthRenderer.drawWorld(worldStaticFaces,worldDynamicFaces,{x:focus.x,y:focus.y||0,z:focus.z,angle,pitch,zoom,magnification:cameraMagnification},canvas.width,canvas.height,W,H)}else depthRenderer.draw(polys,canvas.width,canvas.height,W,H);ctx.drawImage(depthRenderer.canvas,0,0,W,H)}else{for(let p of polys){ctx.beginPath();p.pp.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=p.color;ctx.fill();ctx.strokeStyle=p.stroke;ctx.lineWidth=.45;ctx.stroke()}}
for(let i=0;i<tiles.length;i++){let pt=point(i),t=tiles[i];let near=project(pt.x,.28,pt.z),textSize=Math.max(7,Math.min(10,Math.min(W/52,H/37)*zoom*.36));label(t.name,pt.x,.3,pt.z+(t.owner>=0?.7:.42),textSize,night?'#34435c':'#536274','600');if(t.type==='land'&&t.owner<0&&zoom>.82)label('¥'+t.price,pt.x,.3,pt.z-.05,textSize-1,'#7a7a80');if(t.type!=='land')label({start:'出発',event:'御',tax:'税',park:'休',chance:'機',fate:'命'}[t.type],pt.x,.28,pt.z-.28,textSize+4,'#925c75','600')}
label('TOKYO',-.1,.2,5.6,Math.min(23,W/70)*zoom,night?'#9da4b3':'#7d8c89','700');
for(let [txt,x,y,z] of [['東京タワー',-4,.3,2.2],['浅草',7,.3,8.8],['SKYTREE',6.3,.2,-4.9]])label(txt,x,y,z,8,night?'#b6acba':'#8d7b85');
if(night){ctx.save();ctx.globalCompositeOperation='screen';for(let [x,y,z,c] of [[-4,7,0,'#ffad74'],[6.3,7,-6.5,'#b6c3ff'],[7,1.2,8,'#ffc0a4'],[-9,2,1,'#ff8ec2']]){let p=project(x,y,z),r=22*zoom,g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,c+'44');g.addColorStop(1,c+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2)}ctx.restore()}
if(effects){for(let i=0;i<55;i++){let t=now*.00008,xx=((i*7.113+t*4)%33)-16,zz=((i*4.71+t*2)%33)-16,yy=6-((i*.43+t*3)%7);let p=project(xx,yy,zz);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(now*.001+i);ctx.fillStyle=night?'#f4bed080':'#d886a59c';ctx.beginPath();ctx.ellipse(0,0,1.7*zoom,3*zoom,0,0,Math.PI*2);ctx.fill();ctx.restore()}
particles=particles.filter(p=>p.life>0);for(let p of particles){p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=.003*dt;p.life-=.017*dt;let q=project(p.x,p.y,p.z);ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(q.x,q.y,3*zoom,3*zoom)}ctx.globalAlpha=1}
detailOverlays(now);drawEventOverlay(now);requestAnimationFrame(render)}
// Track each contact independently: one pointer orbits, two pointers zoom.
const activePointers=new Map();let pinch=null,gestureUsedPinch=false,inspectTimer;
function setBoardZoom(value){zoom=Math.max(.55,Math.min(2.2,value))}
function pinchDistance(){const p=[...activePointers.values()];return p.length<2?0:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)}
function beginPinch(){pinch={distance:Math.max(1,pinchDistance()),zoom};gestureUsedPinch=true;drag=null}
function inspectTileAt(x,y){let hit=[...hits].reverse().find(p=>{ctx.beginPath();p.pp.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();let d=renderRatio;return ctx.isPointInPath(x*d,y*d)});if(hit){let t=tiles[hit.tile];$('inspect').hidden=false;$('inspect').innerHTML=`<strong>${t.name}</strong> <span style="font-size:9px;opacity:.5">TOKYO · ${hit.tile+1}/56</span><br>${t.type==='land'?`地價 ¥${t.price.toLocaleString()} · 租金 ¥${Math.round(t.price*.28*Math.max(1,t.level)).toLocaleString()}<br>${t.owner<0?'可購入土地':players[t.owner].name+'持有 · '+t.level+' 級'}<br><small>再次停留自己的土地，資金充足時自動升級</small>`:'特殊站點 · 停留後觸發事件'}`;clearTimeout(inspectTimer);inspectTimer=setTimeout(()=>$('inspect').hidden=true,6500)}else $('inspect').hidden=true}
canvas.onpointerdown=e=>{activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(activePointers.size===1){gestureUsedPinch=false;drag={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY}}else beginPinch()};
canvas.onpointermove=e=>{if(!activePointers.has(e.pointerId))return;activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(activePointers.size>=2){if(!pinch)beginPinch();setBoardZoom(pinch.zoom*pinchDistance()/pinch.distance);return}if(!drag)return;angle+=(e.clientX-drag.x)*.006;pitch=Math.max(.42,Math.min(1.25,pitch+(e.clientY-drag.y)*.003));drag.x=e.clientX;drag.y=e.clientY};
function finishBoardPointer(e,cancelled=false){if(!activePointers.has(e.pointerId))return;if(!cancelled&&!gestureUsedPinch&&activePointers.size===1&&drag&&Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)<6)inspectTileAt(e.clientX,e.clientY);activePointers.delete(e.pointerId);if(activePointers.size>=2){beginPinch()}else if(activePointers.size===1){pinch=null;const p=activePointers.values().next().value;drag={x:p.x,y:p.y,ox:p.x,oy:p.y}}else{drag=null;pinch=null;gestureUsedPinch=false}}
canvas.onpointerup=e=>finishBoardPointer(e);canvas.onpointercancel=e=>finishBoardPointer(e,true);canvas.onlostpointercapture=e=>finishBoardPointer(e,true);
canvas.addEventListener('wheel',e=>{e.preventDefault();setBoardZoom(zoom-e.deltaY*.0007)},{passive:false});
$('zoomIn').onclick=()=>setBoardZoom(zoom*1.2);$('zoomOut').onclick=()=>setBoardZoom(zoom/1.2);
requestAnimationFrame(render);

