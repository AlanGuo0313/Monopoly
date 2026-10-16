'use strict';
// Sculpt once in character space. Reuse the surfaces for both the turntable and game.
const sculptedSkinCache=new Map();
const pochitaShape={body:[0,.475,-.025,.365,.38,.445]};
function pochitaFrontSurface(x,y){
 const [cx,cy,cz,rx,ry,rz]=pochitaShape.body,inside=1-((x-cx)/rx)**2-((y-cy)/ry)**2;
 const cheeks=[-1,1].reduce((sum,s)=>sum+.023*Math.max(0,1-((x-s*.064)/.084)**2-((y-.482)/.078)**2)**2,0);
 return cz+rz*Math.sqrt(Math.max(0,inside))+cheeks;
}
function pochitaMouthPoint(t){
 const side=t<.5?-1:1,u=t<.5?t*2:(1-t)*2,v=1-u;
 const x=side*(.12*v*v*v+.162*3*v*v*u+.054*3*v*u*u),y=.519*v*v*v+.432*3*v*v*u+.407*3*v*u*u+.479*u*u*u;
 return[x,y,pochitaFrontSurface(x,y)+.002];
}
function sculptSkin(id){
 if(sculptedSkinCache.has(id))return sculptedSkinCache.get(id);
 const previous=geometryCapture,faces=[];geometryCapture=faces;
 const fur=skinInfo(id).coat,white=id==='white-fox',dog=id==='shiba',dragon=id==='nailong',saw=id==='pochita',cream=white?'#fffaf2':dragon?'#fff0b0':'#fff0dc';
 let part='body';
 const tag=fn=>{const start=faces.length;fn();for(let i=start;i<faces.length;i++)faces[i].part=part};
 const ball=(x,y,z,rx,ry,rz,c,n=20,m=12)=>tag(()=>sphereMesh(x,y,z,rx,ry,rz,c,n,m));
 const face=(pts,c)=>tag(()=>poly(pts,c,'#00000000'));
 // A smooth closed sweep for curved tails, eyelids, mouths, cords and handles.
 const tube=(points,radii,c,sides=10)=>{
  const rings=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],t=b.map((v,k)=>v-a[k]),l=Math.hypot(...t)||1;t.forEach((v,k)=>t[k]=v/l);const ref=Math.abs(t[1])>.92?[1,0,0]:[0,1,0],u=[t[1]*ref[2]-t[2]*ref[1],t[2]*ref[0]-t[0]*ref[2],t[0]*ref[1]-t[1]*ref[0]],ul=Math.hypot(...u);u.forEach((v,k)=>u[k]=v/ul);const v=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]],r=Array.isArray(radii)?radii[i]:radii;return Array.from({length:sides},(_,j)=>p.map((q,k)=>q+r*(Math.cos(j*Math.PI*2/sides)*u[k]+Math.sin(j*Math.PI*2/sides)*v[k]))) });
  const colorAt=i=>Array.isArray(c)?c[Math.min(i,c.length-1)]:c;
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides,col=shade(colorAt(i),Math.round(Math.cos(j*Math.PI*2/sides)*12)),next=shade(colorAt(i),Math.round(Math.cos(k*Math.PI*2/sides)*12));tag(()=>poly([rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]],col,'#00000000',-1,[col,next,next,col]))}
  face([...rings[0]].reverse(),shade(colorAt(0),-9));face(rings.at(-1),colorAt(rings.length-1));
 };
 const curve=(fn,n,r,c,sides=8)=>tube(Array.from({length:n+1},(_,i)=>fn(i/n)),r,c,sides);
 const eye=(x,y,z,rx,ry,iris)=>{
  ball(x,y,z,rx,ry,.038,'#fffdf7',24,16);ball(x,y+.002,z+.034,rx*.58,ry*.72,.018,iris,24,14);ball(x,y+.002,z+.05,rx*.31,ry*.55,.011,'#192c2d',18,12);
  ball(x-rx*.2,y+ry*.32,z+.062,rx*.21,ry*.19,.007,'#ffffff',12,8);ball(x+rx*.23,y-ry*.3,z+.061,rx*.075,ry*.08,.004,'#deefed',10,6);
  curve(t=>[x+Math.cos(Math.PI*t)*rx*1.04,y+Math.sin(Math.PI*t)*ry,z-.003],12,.009,shade(fur,-20));
 };
 const paw=(side,z,y=.09)=>{
  part=(z>0?'front':'rear')+(side<0?'L':'R');ball(side*(dragon?.19:.19),y,z,dragon?.165:.115,.09,dragon?.2:.145,fur,20,12);
  for(let j=0;j<3;j++){const x=side*.19+(j-1)*(dragon?.067:.045),front=z+(dragon?.19:.13);ball(x,y-.025,front,.022,.024,.033,dragon?'#bd9452':cream,12,8);curve(t=>[x+.022,y-.015+t*.045,front+.013-t*.008],4,.0035,shade(fur,-25),6)}
  ball(side*.19,y-.071,z,.065,.018,.075,dragon?'#d5a34b':'#bd8c83',12,8);part='body';
 };
 try{
 if(dragon){
  part='tail';tube([[0,.34,-.19],[0,.32,-.38],[.02,.34,-.55],[.045,.38,-.7],[.06,.42,-.79]],[.19,.17,.12,.065,.004],fur,18);part='body';
  ball(0,.52,.015,.445,.49,.345,fur,36,24);ball(0,.48,.333,.29,.35,.043,cream,32,20);
  for(const s of [-1,1]){paw(s,.13);part=s<0?'armL':'armR';ball(s*.365,.51,.035,.125,.19,.12,fur,24,14);ball(s*.415,.365,.115,.099,.085,.1,fur,20,12);for(let j=0;j<3;j++)ball(s*.415+(j-1)*.037,.35,.197,.024,.035,.018,'#ffdd64',12,8)}part='body';
  ball(0,1.025,.025,.308,.29,.28,fur,36,24);ball(0,.916,.254,.275,.13,.151,fur,32,20);
  for(const s of [-1,1]){eye(s*.119,1.126,.272,.082,.095,'#719a3b');ball(s*.078,.965,.396,.018,.012,.006,'#ac843c',14,8);ball(s*.082,.971,.396,.009,.005,.007,'#89662e',10,6);ball(s*.233,.924,.32,.036,.018,.009,'#f1bc48',14,8)}
  curve(t=>{const x=(t-.5)*.29;return[x,.862+.026*(x/.145)**2,.389-.026*(x/.145)**2]},24,.007,'#9b783b');
  for(const [y,z,r] of [[.91,-.27,.065],[.74,-.3,.063],[.56,-.315,.06],[.39,-.38,.05],[.38,-.55,.037]])ball(0,y,z,r,r*.85,r,'#e9b340',16,10);
 }else if(saw){
  // Reference proportions: the broad body sits low between four tapered short legs.
  // Smooth baked studio lighting is cached with the mesh, so it adds no per-frame work.
  const resin=(x,y,z,rx,ry,rz,color,n=40,m=28,warp=null)=>{
   const first=faces.length;ball(x,y,z,rx,ry,rz,color,n,m);
   for(const f of faces.slice(first)){
    f.vertexColors=f.pts.map(p=>{let nx=(p[0]-x)/(rx*rx),ny=(p[1]-y)/(ry*ry),nz=(p[2]-z)/(rz*rz),len=Math.hypot(nx,ny,nz);nx/=len;ny/=len;nz/=len;
     const diffuse=Math.max(0,-.46*nx+.75*ny+.47*nz),shine=Math.pow(Math.max(0,-.42*nx+.82*ny+.39*nz),20)*.26;
     return '#'+[1,3,5].map(k=>{const base=parseInt(color.slice(k,k+2),16),lit=base*(.86+.14*diffuse);return Math.round(lit+(255-lit)*shine).toString(16).padStart(2,'0')}).join('');
    });if(warp)f.pts=f.pts.map(warp);
   }
  };
  resin(...pochitaShape.body,fur,64,40,([x,y,z])=>[x,y,z>pochitaShape.body[2]?pochitaFrontSurface(x,y):z]);
  for(const s of [-1,1])for(const z of [-.24,.235]){
   part=(z>0?'front':'rear')+(s<0?'L':'R');
   // A single continuous pear-shaped leg avoids seams between thigh and shin.
   resin(s*.267,.209,z,.122,.177,.124,fur,32,24,([x,y,zz])=>{
    const t=(y-.032)/.354,scale=.63+.5*t;
    return[s*.267+(x-s*.267)*scale,y, z+(zz-z)*scale+.046*(1-t)];
   });
   resin(s*.267,.039,z+.06,.060,.037,.076,fur,28,16);
  }part='body';
  for(const side of [-1,1]){
   // White rim and black eye lie flush against the spherical side of the reference model.
   const x=side*.238,y=.628,z=.282,a=side*.83,ca=Math.cos(a),sa=Math.sin(a),eyeAt=(u,v,w)=>[x+u*ca+w*sa,y+v,z-u*sa+w*ca];
   tag(()=>sphereMesh(0,0,0,.080,.088,.021,'#fff9ee',40,24,eyeAt));
   tag(()=>sphereMesh(0,0,.020,.063,.071,.012,'#090b0b',36,24,eyeAt));
  }
  // Paired rounded muzzle lobes meet below the chainsaw, following the anime reference.
  part='mouth';curve(pochitaMouthPoint,64,.0038,'#a45330',10);part='body';
  // Bevelled steel guide bar, full thickness, continuous chain and alternating cutters.
  const outline=[[.795,.31],[.795,.77],[.787,.818],[.762,.852],[.724,.87],[.633,.87],[.598,.85],[.578,.815],[.575,.77],[.575,.31]];
  for(const s of [-1,1]){
   face(outline.map(([y,z])=>[s*.031,y,z]),'#292b2a');
   face(outline.map(([y,z])=>[s*.034,.685+(y-.685)*.79,.59+(z-.59)*.95]),'#a9a9a7');
  }
  const loop=outline.concat([outline[0]]);for(let i=0;i<loop.length-1;i++){let a=loop[i],b=loop[i+1];face([[-.031,...a],[.031,...a],[.031,...b],[-.031,...b]],'#242725');const count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.065);if(i===loop.length-2)continue;for(let j=0;j<count;j++){const t=(j+.5)/count,y=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,dy=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dy,dz),ny=dz/len,nz=-dy/len;for(const s of [-1,1]){face([[s*.035,y-.021*dy/len,z-.021*dz/len],[s*.035,y+.021*dy/len,z+.021*dz/len],[s*.041,y+ny*.047+dy/len*.016,z+nz*.047+dz/len*.016]],j%2?'#3e3e39':'#292c2a')}}}
  // Rubber handle has an oval section and small grip ribs.
  const grip=[[0,.785,.205],[0,.934,.155],[0,1.005,.12],[0,1.022,.09],[0,1.026,.045],[0,1.026,-.19],[0,1.019,-.222],[0,.998,-.241],[0,.958,-.252],[0,.796,-.28]];
  const roundedGrip=[];for(let i=0;i<grip.length-1;i++)for(let j=0;j<6;j++){const t=j/6,a=grip[Math.max(0,i-1)],b=grip[i],c=grip[i+1],d=grip[Math.min(grip.length-1,i+2)];roundedGrip.push(b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*t+(2*a[k]-5*v+4*c[k]-d[k])*t*t+(-a[k]+3*v-3*c[k]+d[k])*t*t*t)))}roundedGrip.push(grip.at(-1));
  tube(roundedGrip,.037,'#101314',20);
  curve(t=>[.016,1.052,.065-t*.25],20,.003,'#515658',8);
  part='tail';tube([[0,.23,-.34],[0,.17,-.46],[0,.12,-.52]],[.048,.031,.005],fur,16);
  curve(t=>[0,.104,-.5-t*.15],12,.012,'#262a29');
  tube([[-.063,.075,-.6],[-.078,.075,-.63],[-.078,.075,-.81],[-.062,.075,-.84],[.062,.075,-.84],[.078,.075,-.81],[.078,.075,-.63],[.063,.075,-.6],[-.063,.075,-.6]],.027,'#151a1b',20);part='body';
 }else{
  // Anatomical quadrupeds: horizontal ribcage, shoulder/hip joints, hocks and muzzle.
  const arctic=white,back=white?'#e5e9e5':dog?'#b9793c':'#b45c2c',leg=white?'#e7ece9':dog?'#d6a16b':'#39352f';
  const bodyX=dog?.23:arctic?.225:.18,bodyY=dog?.245:arctic?.22:.19;
  const coatStart=faces.length;
  ball(0,.62,-.12,bodyX,bodyY,.435,fur,36,24);
  const blend=(a,b,t)=>'#'+[1,3,5].map(k=>Math.round(parseInt(a.slice(k,k+2),16)*(1-t)+parseInt(b.slice(k,k+2),16)*t).toString(16).padStart(2,'0')).join('');
  for(const f of faces.slice(coatStart))f.vertexColors=f.pts.map((p,i)=>{const n=(p[1]-.62)/bodyY,t=Math.max(0,Math.min(1,(n-.25)*.8)),v=Math.max(0,Math.min(1,(-n-.35)*1.5));return blend(blend(f.vertexColors[i],back,t*.6),cream,v*.85)});
  ball(0,.705,.23,dog?.21:.17,.26,.2,fur,28,18);
  ball(0,.72,.35,.135,.21,.1,cream,24,16);
  for(const s of [-1,1]){
   // Forelegs run under the shoulders; the hind leg bends through a visible hock.
   part=s<0?'frontL':'frontR';
   ball(s*.145,.495,.23,.07,.205,.09,fur,20,14);
   tube([[s*.145,.42,.24],[s*.145,.26,.25],[s*.145,.105,.28]],[.05,.035,.03],leg,14);
   ball(s*.145,.066,.31,.048,.05,.082,dog?cream:leg,20,12);
   part=s<0?'rearL':'rearR';
   ball(s*.15,.54,-.41,.095,.17,.125,fur,24,16);
   tube([[s*.15,.45,-.37],[s*.155,.275,-.5],[s*.155,.12,-.46]],[.07,.042,.028],fur,16);
   tube([[s*.155,.22,-.49],[s*.155,.08,-.45]],[.033,.028],leg,14);
   ball(s*.155,.061,-.414,.048,.047,.08,dog?cream:leg,18,12);
   for(const z of [.36,-.36])for(const j of [-1,0,1])ball(s*.15+j*.023,.045,z,.009,.012,.022,white?'#969d99':'#54504a',10,6);
  }part='body';
  // Head is much smaller than the ribcage, with a projecting wedge-shaped snout.
  const hy=dog?.94:.92,hz=.43,hx=dog?.195:arctic?.17:.145;
  ball(0,hy,hz,hx,dog?.205:.175,dog?.20:.185,fur,32,22);
  ball(0,hy-.067,hz+.085,hx*.92,.115,.145,cream,26,16);
  tube([[0,hy-.035,hz+.09],[0,hy-.067,hz+.21],[0,hy-.084,hz+(dog?.31:.37)]],[dog?.115:.085,dog?.08:.055,dog?.05:.032],cream,20);
  const noseZ=hz+(dog?.327:.384);
  ball(0,hy-.076,noseZ,dog?.048:.033,.025,.025,'#292c2b',20,12);
  ball(-.01,hy-.068,noseZ+.021,.01,.005,.004,'#848e8c',10,6);
  for(const s of [-1,1]){
   // Narrow almond eye sockets, dark iris and a small catchlight; no white doll eyes.
   const ex=s*hx*.83,ey=hy+.025,ez=hz+.14;
   ball(ex,ey,ez,.035,.023,.019,white?'#b3b6b2':'#6b4931',18,12);
   ball(ex,ey,ez+.013,.027,.018,.012,white?'#776d45':'#44331e',20,12);
   ball(ex,ey+.001,ez+.023,.016,.016,.005,'#151f20',14,10);
   ball(ex-.007,ey+.007,ez+.028,.005,.004,.003,'#e9f1ed',8,6);
   if(dog)ball(s*.132,hy+.085,hz+.132,.041,.019,.013,'#f3e5cc',16,10);
   const earY=hy+.12,earX=s*hx*.75,earZ=hz-.03,eh=dog?.17:arctic?.145:.235;
   // Closed ear volume; fur on the rim, a darker recessed interior.
   for(let i=0;i<12;i++)for(let j=0;j<14;j++){
    const ep=(row,col)=>{const t=row/12,a=col/14*Math.PI*2,r=(1-t)**.8;return[earX+s*t*.035+Math.cos(a)*(.073*r+.002),earY+t*eh,earZ+Math.sin(a)*(.047*r+.002)]};
    face([ep(i,j),ep(i,j+1),ep(i+1,j+1),ep(i+1,j)],shade(fur,Math.round(Math.sin(j/14*Math.PI*2)*12)));
   }
   face([[earX-.045,earY+.025,earZ+.045],[earX+.045,earY+.025,earZ+.045],[earX+s*.031,earY+eh-.038,earZ+.014]],white?'#c6bbba':dog?'#9c7460':'#694d44');
   // Fine ruff follows the neck rather than protruding as round cheeks.
   for(let k=0;k<5;k++){let y=.735-k*.033,z=.31-k*.022;face([[s*.105,y+.05,z+.04],[s*.17,y+.025,z-.02],[s*(.145+k*.003),y-.04,z+.015]],cream)}
   curve(t=>[s*(.02+t*.055),hy-.118-.005*Math.sin(t*Math.PI),noseZ-.015-t*.15],12,.0035,'#645e54',6);
  }
  // Breed-specific tail shapes. Red fox is long and low; arctic fox is fuller.
  part='tail';
  if(dog){const pts=Array.from({length:33},(_,i)=>{const t=i/32,a=-1.45+t*Math.PI*1.75;return[.065+Math.cos(a)*.16,.79+Math.sin(a)*.18,-.49-t*.035]});tube(pts,pts.map((_,i)=>i<25?.073:Math.max(.003,.073*(32-i)/7)),pts.map((_,i)=>i<25?fur:cream),18)}
  else tube([[0,.65,-.48],[.04,.51,-.68],[.09,.34,-.88],[.12,.21,-1.06],[.13,.19,-1.19],[.13,.22,-1.28]],[.09,arctic?.17:.14,arctic?.18:.145,.115,.065,.003],[fur,fur,fur,cream,cream,cream],24);
  part='body';
  // Fit the natural full-length silhouette inside a single board station.
  for(const f of faces)f.pts=f.pts.map(p=>p.map(v=>v*.8));
 }
 }finally{geometryCapture=previous}
 sculptedSkinCache.set(id,faces);return faces;
}
function drawDetailedSkin(pose,now,id,heading=null){
 const p=players[0],walking=heading===null&&moving?.player===0,from=walking?moving.from:point((p.pos+55)%56),to=walking?moving.to:point(p.pos),yaw=heading??Math.atan2(to.x-from.x,to.z-from.z),cs=Math.cos(yaw),sn=Math.sin(yaw),phase=walking?Math.sin(Math.max(0,Math.min(1,(now-moving.start)/moving.duration))*Math.PI*2):0;
 const sway=effects&&heading===null?Math.sin(now*.002)*.008:0;
 const transforms=new Map();
 for(const f of sculptSkin(id)){
  let transform=transforms.get(f.part);if(!transform){const limb=f.part?.match(/^(front|rear|arm)(L|R)$/),natural=!['nailong','pochita'].includes(id),rear=limb?.[1]==='rear',a=limb?phase*.22*(limb[2]==='L'?1:-1)*(rear?-1:1):f.part==='tail'&&effects&&heading===null?Math.sin(now*.002)*.06:0,ca=Math.cos(a),sa=Math.sin(a),py=natural?.44:limb?.[1]==='arm'?.49:.18,pz=natural?(rear?-.328:.184):id==='pochita'?(rear?-.23:.23):0;
   transform=([x,y,z])=>{if(limb){const yy=y-py,zz=z-pz;y=py+yy*ca-zz*sa;z=pz+yy*sa+zz*ca}else if(f.part==='tail'){const xx=x,tz=natural?-.384:0;x=xx*ca+(z-tz)*sa;z=tz+(z-tz)*ca-xx*sa}return[pose.x+x*cs+z*sn,.28+pose.jump+y+sway,pose.z-x*sn+z*cs]};transforms.set(f.part,transform)}
  poly(f.pts.map(transform),f.color,f.stroke,-1,f.vertexColors);
 }
}
