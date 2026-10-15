const fs=require('fs');let s=fs.readFileSync('scene.js','utf8');const a=s.indexOf('function background(now)'),b=s.indexOf('function buildCity(',a);if(a<0||b<0)throw Error('background missing');const replacement=`// Cache full-resolution scenery by theme so the backdrop adds no per-frame geometry work.
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
`;
s=s.slice(0,a)+replacement+s.slice(b);fs.writeFileSync('scene.js',s);
