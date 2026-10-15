'use strict';
// Street-scale details remain in world space and share the depth-tested renderer.
function lantern(x,y,z){fineLantern(x,y,z)}
function bench(x,z,rotation=false){fineBench(x,z,rotation)}
function shop(x,z,color){roundedBox(x,.15,z,1.2,.8,.9,night?'#8f7b83':'#dbc9b6',.045);roof(x,.95,z,1.4,1.2,'#657086');box(x,.55,z+.48,1.2,.12,.42,color);for(let i=0;i<6;i++)box(x-.5+i*.2,.42,z+.67,.16,.15,.035,i%2?'#e9d8bd':color);box(x-.2,.25,z+.46,.34,.35,.02,night?'#e8bb8c':'#92afb7');box(x+.3,.18,z+.46,.23,.5,.025,'#736c72');box(x,1.1,z+.48,.65,.19,.03,night?'#f0cf9e':'#dec4a2');lantern(x-.65,.7,z+.5)}
function detailedCity(now){
 // Temple approach: red lanterns, stone pavers, incense bowl and side stalls.
 for(let j=0;j<7;j++){box(7,.14,6.3+j*.4,1.25,.025,.32,night?'#858087':'#c3b8ad');for(let s of [-1,1]){box(7+s*1.4,.15,5+j*.58,.05,1.35,.05,'#90677a');lantern(7+s*1.4,1.1,5+j*.58)}}
 box(7,.48,6.5,.45,.18,.45,'#9a9298');ring(7,.68,6.5,.28,'#bfb3a2');shop(5,6.2,'#bd727e');shop(9.3,6.5,'#698b93');
 // Pocket garden: stepped pond, stone island, arched footbridge and bamboo.
 box(-7.2,.15,6.7,2.6,.08,2.1,night?'#75817e':'#b4bbab');box(-7.2,.24,6.7,2.3,.025,1.8,night?'#3b7c86':'#7cb6b7');ring(-7.5,.3,6.4,.38,night?'#82978c':'#b7c2aa');sphereMesh(-7.5,.4,6.4,.22,.17,.18,'#b0aaa0',10,6);
 for(let j=0;j<8;j++){let x=-8.4+j*.34,h=.22+Math.sin(j/7*Math.PI)*.25;box(x,.26+h,7.1,.3,.08,.65,'#ab787b');for(let s of [-1,1])box(x,.34+h,7.1+s*.35,.05,.24,.05,'#bf9390')}
 for(let i=0;i<5;i++){let x=-10+i*.2;cylinder(x,.16,7.5,.035,.9+(i%3)*.22,night?'#7d9d83':'#7ca578',8,.025);beam([x,.7,7.5],[x+.18,.95,7.5],.035,'#91ac8a')}
 for(const [x,z] of [[-9.2,8.2],[-5,8.9],[-2,7.7]])bench(x,z);bench(1,6,true);
 // River embankment, railings, moored boat and bridge lanterns.
 for(let side of [-1,1]){box(3.4+side*1.05,.14,-1.3,.18,.15,17.8,night?'#829297':'#c9c4b6');for(let j=-9;j<8;j+=1.1)box(3.4+side*1.08,.28,j,.045,.38,.045,'#8797a0');box(3.4+side*1.08,.62,-1.3,.04,.04,17.8,'#9ea8a9')}
 sphereMesh(3.4,.26,4.9,.34,.14,.67,'#d4c8b6',12,7);roundedBox(3.4,.35,4.8,.5,.18,.5,'#a67c7b',.04);roundedBox(3.4,.55,4.8,.62,.045,.65,'#e2c9ab',.012);box(3.4,.39,5.06,.38,.1,.015,'#8daab7');
 // Cafés and vending machines beside the station.
 shop(-8.6,1.8,'#a590b5');shop(-6.7,1.8,'#6e9d91');
 for(let i=0;i<2;i++){roundedBox(-3.1+i*.4,.14,10.8,.32,.75,.35,i?'#9da7bc':'#b86678',.035);box(-3.1+i*.4,.38,10.985,.25,.36,.015,night?'#bce0e3':'#9cb8c5');for(let j=0;j<3;j++)box(-3.18+i*.4+j*.065,.41,11,.04,.06,.015,['#e4b981','#d28b95','#9bc4b4'][j])}
 // Rooftop equipment, terraces, street planters and illuminated shop signs.
 for(const b of cityBlocks){box(b.x-.25,b.h+.26,b.z+.2,.3,.16,.3,night?'#6c798d':'#9aa9af');if(b.seed%3===0){box(b.x,.2,b.z+b.d/2+.15,b.w*.8,.18,.18,night?'#54756b':'#8da884');box(b.x,.38,b.z+b.d/2+.15,b.w*.75,.15,.2,night?'#7b9d88':'#9cbd91')}}
 // Crosswalk signal poles and compact street furniture.
 for(let side of [-1,1]){box(-.2+side*.65,.14,1.2,.055,1.1,.055,'#697b8c');box(-.2+side*.65,1.12,1.2,.23,.18,.13,'#394557');}
 for(let i=0;i<6;i++){box(-10+i*.45,.14,-1.7,.07,.16,.07,'#a8a2a0');beam([-10+i*.45,.28,-1.7],[-10+i*.45+.25,.28,-1.7],.025,'#b5b2ae')}
}
function detailOverlays(now){
 // Small-scale names make the miniature storefronts readable at close range.
 for(const [name,x,y,z] of [['珈琲',-8.6,1.32,2.3],['茶屋',-6.7,1.32,2.3],['おみやげ',5,1.32,6.7],['参道',7,.35,9.3],['TOKYO STATION',-5,.85,12.2]])label(name,x,y,z,7,night?'#e8c9ad':'#786d72');
 if(!effects)return;
 // Lantern glow, a gently pulsing pond and rising incense.
 ctx.save();ctx.globalCompositeOperation='screen';for(const [x,y,z] of [[5.6,1.3,6],[8.4,1.3,6],[7,.9,8]]){const p=project(x,y,z),g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,12*zoom);g.addColorStop(0,night?'#ffc29155':'#ffc29111');g.addColorStop(1,'#ffc29100');ctx.fillStyle=g;ctx.fillRect(p.x-12*zoom,p.y-12*zoom,24*zoom,24*zoom)}ctx.restore();
 ctx.save();for(let i=0;i<5;i++){const t=(now*.0003+i*.2)%1,p=project(7+Math.sin(now*.001+i)*.06,.7+t*.7,6.5);ctx.globalAlpha=(1-t)*.3;ctx.fillStyle='#e7dee3';ctx.beginPath();ctx.ellipse(p.x,p.y,2+t*3,2+t*2,0,0,Math.PI*2);ctx.fill()}ctx.restore();
}
