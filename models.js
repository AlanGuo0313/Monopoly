'use strict';
// Shared geometry stays in world space; camera and depth rendering remain unchanged.
let geometryCapture=null;
const staticGeometry=new Map();
function roundedBox(x,y,z,w,h,d,color,r=.06,tile=-1){
 r=Math.max(.001,Math.min(r,w/3,d/3,h/3));
 const outline=(inset=0)=>{const a=w/2-inset,b=d/2-inset,c=Math.max(.001,r-inset*.5);return [[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]]};
 const lower=outline(),upper=outline(r*.45),edge=y+h-r*.5;
 for(let i=0;i<8;i++){const j=(i+1)%8,a=lower[i],b=lower[j],c=upper[j],e=upper[i];const col=shade(color,[-20,-12,-9,-3,-7,-14,-22,-25][i]);poly([[x+a[0],y,z+a[1]],[x+b[0],y,z+b[1]],[x+b[0],edge,z+b[1]],[x+a[0],edge,z+a[1]]],col);poly([[x+a[0],edge,z+a[1]],[x+b[0],edge,z+b[1]],[x+c[0],y+h,z+c[1]],[x+e[0],y+h,z+e[1]]],shade(color,4))}
 poly(upper.map(p=>[x+p[0],y+h,z+p[1]]),color,'#ffffff10',tile);
}
function sphereMesh(x,y,z,rx,ry,rz,color,segments=12,bands=7,transform=null){
 const vertex=(a,b)=>[x+Math.sin(b)*Math.cos(a)*rx,y+Math.cos(b)*ry,z+Math.sin(b)*Math.sin(a)*rz];
 const lit=(a,b)=>{let nx=Math.sin(b)*Math.cos(a)/rx,ny=Math.cos(b)/ry,nz=Math.sin(b)*Math.sin(a)/rz,n=Math.hypot(nx,ny,nz);return shade(color,Math.round((-.35*nx+.75*ny+.4*nz)/n*27)-10)};
 for(let j=0;j<bands;j++)for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments,c=j*Math.PI/bands,d=(j+1)*Math.PI/bands;let pts=[vertex(a,c),vertex(b,c),vertex(b,d),vertex(a,d)];if(transform)pts=pts.map(p=>transform(...p));poly(pts,lit((a+b)/2,(c+d)/2),'#00000000',-1,[lit(a,c),lit(b,c),lit(b,d),lit(a,d)])}
}
function cylinder(x,y,z,r,h,color,segments=12,topRadius=r){
 for(let i=0;i<segments;i++){let a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;poly([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x+Math.cos(b)*topRadius,y+h,z+Math.sin(b)*topRadius],[x+Math.cos(a)*topRadius,y+h,z+Math.sin(a)*topRadius]],shade(color,Math.round(Math.cos(a+.5)*13)-10))}
 poly(Array.from({length:segments},(_,i)=>[x+Math.cos(i*Math.PI*2/segments)*topRadius,y+h,z+Math.sin(i*Math.PI*2/segments)*topRadius]),shade(color,9));
}
function curvedRoof(x,y,z,w,d,color){
 const height=t=>.65*(1-Math.abs(t))+.115*Math.abs(t)**6;
 for(let i=0;i<8;i++){const a=-1+i*.25,b=a+.25,wa=w/2*(.83+.17*Math.abs(a)),wb=w/2*(.83+.17*Math.abs(b));poly([[x-wa,y+height(a),z+a*d/2],[x+wa,y+height(a),z+a*d/2],[x+wb,y+height(b),z+b*d/2],[x-wb,y+height(b),z+b*d/2]],shade(color,Math.round((1-Math.abs(a))*17)));for(let side of [-1,1])poly([[x+side*wa,y+height(a),z+a*d/2],[x+side*wb,y+height(b),z+b*d/2],[x+side*wb,y+height(b)-.09,z+b*d/2],[x+side*wa,y+height(a)-.09,z+a*d/2]],shade(color,-18))}
 const rows=Math.min(12,Math.max(4,Math.round(w/.28)));for(let k=1;k<rows;k++){const q=-1+2*k/rows;for(let j=0;j<6;j++){const a=-1+j/3,b=a+1/3;poly([[x+q*w/2*(.83+.17*Math.abs(a)),y+height(a)+.009,z+a*d/2],[x+q*w/2*(.83+.17*Math.abs(a))+.018,y+height(a)+.009,z+a*d/2],[x+q*w/2*(.83+.17*Math.abs(b))+.018,y+height(b)+.009,z+b*d/2],[x+q*w/2*(.83+.17*Math.abs(b)),y+height(b)+.009,z+b*d/2]],shade(color,24))}}
 roundedBox(x,y+.62,z,w*.85,.075,.1,shade(color,24),.02);for(let side of [-1,1])beam([x-w/2,y+.115,z+side*d/2],[x+w/2,y+.115,z+side*d/2],.045,shade(color,13));
}
function fineSakura(x,z,s=1){
 ring(x,.105,z,.5*s,night?'#344b4c':'#91a68b');cylinder(x,.14,z,.075*s,.95*s,night?'#846c7b':'#9f847a',9,.04*s);
 for(const side of [-1,1])beam([x,.65*s,z],[x+side*.36*s,1.25*s,z+side*.12*s],.06*s,'#9a7d85');
 const petals=night?['#cc96b1','#d8a4bb','#ba8ca8']:['#eeb6ca','#f8cbd9','#e3a8c3'];
 for(const [dx,dy,dz,r] of [[0,1.3,0,.55],[-.36,1.18,.1,.4],[.35,1.23,-.08,.42],[.08,1.59,.08,.37]])sphereMesh(x+dx*s,dy*s,z+dz*s,r*s,r*.72*s,r*.92*s,petals[Math.abs(Math.round(dx*10))%3],10,6);
 for(let i=0;i<5;i++)poly([[x+(i-2)*.12,.113,z+.36],[x+(i-2)*.12+.04,.113,z+.39],[x+(i-2)*.12+.02,.113,z+.43]],shade(petals[0],10));
}
function fineBuilding(x,z,w,d,h,seed=0){
 const wall=night?['#485872','#5a6074','#4d6377','#5a596e'][seed%4]:['#c7cbd0','#e0d0bc','#bed0d4','#ddd8d0'][seed%4];
 roundedBox(x,.13,z,w+.12,.16,d+.12,shade(wall,-18),.04);roundedBox(x,.29,z,w,h-.16,d,wall,.055);
 for(let y=.56;y<h;y+=.53){box(x,y-.025,z,w+.025,.045,d+.025,shade(wall,14));for(let side of [-1,1]){
 for(let k=-w/2+.18;k<w/2-.05;k+=.34){let lit=(Math.round(k*10)+Math.round(y*10)+seed)%4!==0;const c=night?(lit?'#e9c990':'#556e85'):'#8faebb';box(x+k,y,z+side*(d/2+.012),.22,.28,.025,'#5b6d81');poly([[x+k-.085,y+.025,z+side*(d/2+.028)],[x+k+.085,y+.025,z+side*(d/2+.028)],[x+k+.085,y+.23,z+side*(d/2+.028)],[x+k-.085,y+.23,z+side*(d/2+.028)]],c)}
 for(let k=-d/2+.18;k<d/2-.05;k+=.34){const c=night?((seed+Math.round(y*10))%3?'#e6c58f':'#587086'):'#92afbb';poly([[x+side*(w/2+.014),y,z+k],[x+side*(w/2+.014),y,z+k+.18],[x+side*(w/2+.014),y+.25,z+k+.18],[x+side*(w/2+.014),y+.25,z+k]],c)}}}
 roundedBox(x,h+.13,z,w+.11,.11,d+.11,shade(wall,17),.035);for(let side of [-1,1]){box(x+side*w/2,h+.24,z,.04,.15,d,'#8a94a3');box(x,h+.24,z+side*d/2,w,.15,.04,'#8a94a3')}
 box(x+.2,h+.24,z,.3,.18,.35,'#7d8b9c');for(let j=0;j<3;j++)box(x+.2,h+.425,z-.1+j*.09,.24,.012,.025,'#bcc4c8');
 roundedBox(x,.29,z+d/2+.05,.3,.48,.06,'#a6c3c8',.015);box(x,.74,z+d/2+.18,w*.7,.065,.35,seed%2?'#9f889e':'#7d9f9a');
}
function fineLantern(x,y,z){cylinder(x,y-.025,z,.07,.025,'#675063',10);sphereMesh(x,y+.13,z,.115,.15,.115,night?'#f2b18f':'#df8f82',10,6);cylinder(x,y+.27,z,.07,.035,'#675063',10);beam([x,y+.3,z],[x,y+.5,z],.018,'#aa9296');for(let side of [-1,1])beam([x+side*.08,y+.03,z],[x+side*.08,y+.23,z],.009,'#c78179')}
function fineBench(x,z,rotation=false){
 const at=(a,b)=>rotation?[x+b,z+a]:[x+a,z+b],wood=night?'#b29b8c':'#bb967b';for(let j=0;j<3;j++){const [a,b]=at(0,-.12+j*.11);roundedBox(a,.35,b,rotation?.08:.85,.06,rotation?.85:.08,wood,.018)}for(let j=0;j<2;j++){const [a,b]=at(0,-.19);box(a,.47+j*.12,b,rotation?.04:.85,.08,rotation?.85:.04,wood)}for(let s of [-1,1]){const [a,b]=at(s*.28,0);box(a,.15,b,rotation?.26:.055,.2,rotation?.055:.26,'#5d6a7a')}
}
function drawPropertyModel(t,p){const c=players[t.owner].color,h=.42*t.level;roundedBox(p.x,.235,p.z,.94,.075,.86,'#d4cbbd',.06);roundedBox(p.x,.31,p.z,.76,h,.66,shade(c,13),.045);if(t.level===1)curvedRoof(p.x,.31+h,p.z,1,.95,night?'#7d6d86':'#aa7c7f');else{roundedBox(p.x,.31+h,p.z,.86,.08,.76,'#d9d0bf',.03);box(p.x+.18,.4+h,p.z-.12,.19,.18,.22,'#8197a0')}
 for(let level=0;level<t.level;level++)for(let side of [-1,1])for(let k of [-.21,.21]){box(p.x+k,.42+level*.4,p.z+side*.342,.19,.23,.025,'#586879');box(p.x+k,.45+level*.4,p.z+side*.36,.145,.17,.012,night?'#ffe1a4':'#a6c8d1')}
 roundedBox(p.x,.31,p.z+.35,.16,.3,.035,'#6b6a76',.015);box(p.x,.27,p.z+.46,.38,.035,.16,'#c5b7a9');
}
function vehicleModel(x,z,horizontal,train=false){
 const length=train?.78:.78,width=train?.42:.38,base=train?.53:.16,paint=train?'#d3e0db':'#d9b876';
 roundedBox(x,base,z,horizontal?length:width,.26,horizontal?width:length,paint,.065);roundedBox(x,base+.26,z,horizontal?.56:.33,.17,horizontal?.33:.56,train?'#8cabb9':'#a7c1c8',.055);
 if(train)box(x,base+.12,z,horizontal?length+.01:width+.01,.065,horizontal?width+.01:length+.01,'#78aa93');else box(x,base+.44,z,.12,.055,.1,'#f0dfac');
 for(let end of [-1,1])for(let side of [-1,1]){const wx=x+(horizontal?end*.23:side*.205),wz=z+(horizontal?side*.205:end*.23);sphereMesh(wx,base+.025,wz,horizontal?.09:.035,.085,horizontal?.035:.09,'#354455',8,5);sphereMesh(wx,base+.025,wz,horizontal?.045:.038,.043,horizontal?.038:.045,'#a5adb3',8,4)}
 for(let side of [-1,1]){if(horizontal){box(x+length/2+.008,base+.12,z+side*.12,.016,.065,.075,night?'#ffe6aa':'#e5d8ba');box(x,base+.29,z+side*.17,.38,.11,.012,'#5a7e91')}else{box(x+side*.12,base+.12,z+length/2+.008,.075,.065,.016,night?'#ffe6aa':'#e5d8ba');box(x+side*.17,base+.29,z,.012,.11,.38,'#5a7e91')}}
}
function drawHuman(pose,i,now){const p=players[i],pos=p.pos,a=moving?.player===i?moving.from:point((pos+55)%56),b=moving?.player===i?moving.to:point(pos),yaw=Math.atan2(b.x-a.x,b.z-a.z),cs=Math.cos(yaw),sn=Math.sin(yaw),step=moving?.player===i?Math.sin((now-moving.start)/190*Math.PI*2)*.05:0;
 const at=(x,y,z)=>[pose.x+x*cs+z*sn,.28+pose.jump+y,pose.z-x*sn+z*cs];const mesh=(x,y,z,rx,ry,rz,col)=>sphereMesh(x,y,z,rx,ry,rz,col,10,7,at);
 for(let side of [-1,1]){mesh(side*.085,.13+side*step,.04,.07,.15,.08,'#40516b');mesh(side*.085,.04+side*step,.1,.08,.045,.12,'#526275');mesh(side*.2,.41-side*step,.015,.065,.16,.065,p.color);mesh(side*.2,.27-side*step,.04,.06,.065,.06,'#efcfb6')}
 mesh(0,.4,0,.17,.22,.13,p.color);mesh(0,.73,0,.145,.165,.14,'#efcfb6');mesh(0,.84,-.025,.15,.075,.145,i%2?'#6d5661':'#4f4f5b');for(let side of [-1,1])mesh(side*.05,.75,.135,.017,.022,.01,'#364552');
}
function replayStaticCity(){const key=night?'night':'day';let faces=staticGeometry.get(key);if(!faces){geometryCapture=[];buildCity(0);detailedCity(0);faces=geometryCapture;geometryCapture=null;staticGeometry.set(key,faces)}if(depthRenderer?.supportsWorld){worldStaticFaces=faces}else for(const p of faces)poly(p.pts,p.color,p.stroke,p.tile,p.vertexColors)}
