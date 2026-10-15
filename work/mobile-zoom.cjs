const fs=require('node:fs');let s=fs.readFileSync('scene.js','utf8');const a=s.indexOf('canvas.onpointerdown='),b=s.indexOf('requestAnimationFrame(render);',a);if(a<0||b<0)throw Error('pointer handlers missing');const old=s.slice(a,b),hitStart=old.indexOf('let hit='),hitEnd=old.indexOf('}drag=null};',hitStart);if(hitStart<0||hitEnd<0)throw Error('inspect block missing');let inspect=old.slice(hitStart,hitEnd).replaceAll('e.clientX','x').replaceAll('e.clientY','y');
const pointerCode=`// Track each contact independently: one pointer orbits, two pointers zoom.
const activePointers=new Map();let pinch=null,gestureUsedPinch=false,inspectTimer;
function setBoardZoom(value){zoom=Math.max(.55,Math.min(2.2,value))}
function pinchDistance(){const p=[...activePointers.values()];return p.length<2?0:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)}
function beginPinch(){pinch={distance:Math.max(1,pinchDistance()),zoom};gestureUsedPinch=true;drag=null}
function inspectTileAt(x,y){${inspect}}
canvas.onpointerdown=e=>{activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(activePointers.size===1){gestureUsedPinch=false;drag={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY}}else beginPinch()};
canvas.onpointermove=e=>{if(!activePointers.has(e.pointerId))return;activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(activePointers.size>=2){if(!pinch)beginPinch();setBoardZoom(pinch.zoom*pinchDistance()/pinch.distance);return}if(!drag)return;angle+=(e.clientX-drag.x)*.006;pitch=Math.max(.42,Math.min(1.25,pitch+(e.clientY-drag.y)*.003));drag.x=e.clientX;drag.y=e.clientY};
function finishBoardPointer(e,cancelled=false){if(!activePointers.has(e.pointerId))return;if(!cancelled&&!gestureUsedPinch&&activePointers.size===1&&drag&&Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)<6)inspectTileAt(e.clientX,e.clientY);activePointers.delete(e.pointerId);if(activePointers.size>=2){beginPinch()}else if(activePointers.size===1){pinch=null;const p=activePointers.values().next().value;drag={x:p.x,y:p.y,ox:p.x,oy:p.y}}else{drag=null;pinch=null;gestureUsedPinch=false}}
canvas.onpointerup=e=>finishBoardPointer(e);canvas.onpointercancel=e=>finishBoardPointer(e,true);canvas.onlostpointercapture=e=>finishBoardPointer(e,true);
canvas.addEventListener('wheel',e=>{e.preventDefault();setBoardZoom(zoom-e.deltaY*.0007)},{passive:false});
$('zoomIn').onclick=()=>setBoardZoom(zoom*1.2);$('zoomOut').onclick=()=>setBoardZoom(zoom/1.2);
`;
s=s.slice(0,a)+pointerCode+s.slice(b);fs.writeFileSync('scene.js',s);
let h=fs.readFileSync('index.html','utf8');h=h.replace('<div class="hint">拖曳環繞 · 滾輪縮放 · 點選土地','<div id="zoomControls" role="group" aria-label="棋盤縮放"><button id="zoomIn" aria-label="放大棋盤">＋</button><button id="zoomOut" aria-label="縮小棋盤">−</button></div><div class="hint"><span class="desktopHint">拖曳環繞 · 滾輪縮放 · 點選土地</span><span class="mobileHint">單指旋轉 · 雙指縮放 · 點選土地</span>');fs.writeFileSync('index.html',h);
