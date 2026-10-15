'use strict';
let eventFx=null;
function showEventFx(kind,{title,subtitle,amount=0,player=turn,owner=-1,pos=players[player].pos,duration=2300}){
 const palette={purchase:'#ffd38b',rent:'#ff9e9b',chance:'#80e2d9',fate:'#c1a5ff',upgrade:'#ffd38b'};
 const labels={purchase:'PROPERTY ACQUIRED / 契約成立',rent:'RENT TRANSFER / 租金結算',chance:'CHANCE / 東京機會',fate:'DESTINY / 運命の一枚',upgrade:'CITY UPGRADE / 建築升級'};
 const icon={purchase:'契',rent:'¥',chance:'機',fate:'命',upgrade:'昇'};
 eventFx={kind,title,subtitle,amount,player,owner,pos,start:performance.now(),duration,color:palette[kind]};
 const card=$('eventCard');card.dataset.kind=kind;card.classList.remove('reveal');card.classList.toggle('still',!effects);$('eventKicker').textContent=labels[kind];$('eventIcon').textContent=icon[kind];$('eventTitle').textContent=title;$('eventSubtitle').textContent=subtitle;$('eventAmount').textContent=(amount>=0?'+':'−')+'¥'+Math.abs(amount).toLocaleString();$('eventActor').textContent=players[player].name;card.hidden=false;void card.offsetWidth;card.classList.add('reveal');
 if(effects){burst(point(pos),palette[kind],kind==='purchase'?65:35);tone(kind==='rent'?220:kind==='fate'?392:784,.15,'triangle');}
 status(title+' · '+(amount>=0?'+':'−')+'¥'+Math.abs(amount).toLocaleString());return duration;
}
function eventProgress(now){return eventFx?Math.max(0,(now-eventFx.start)/eventFx.duration):1}
function drawEventGeometry(now){if(!eventFx||!effects)return;const t=eventProgress(now);if(t>=1)return;const f=eventFx,p=point(f.pos),r=.6+((t*2)%1)*1.2;for(let j=0;j<28;j++){const a=j*Math.PI/14,b=(j+1)*Math.PI/14;poly([[p.x+Math.cos(a)*r,.3,p.z+Math.sin(a)*r],[p.x+Math.cos(b)*r,.3,p.z+Math.sin(b)*r],[p.x+Math.cos(b)*(r+.045),.3,p.z+Math.sin(b)*(r+.045)],[p.x+Math.cos(a)*(r+.045),.3,p.z+Math.sin(a)*(r+.045)]],f.color)}
 if(f.kind==='purchase'||f.kind==='upgrade'){const lift=Math.min(1,t*4);for(let a of [-1,1])for(let b of [-1,1])box(p.x+a*.7,.28,p.z+b*.7,.055,1.4*lift,.055,f.color)}
 if(f.kind==='fate'||f.kind==='chance'){for(let i=0;i<6;i++){let a=now*.001+i*Math.PI/3;box(p.x+Math.cos(a)*.7,1+Math.sin(a*2)*.25,p.z+Math.sin(a)*.7,.12,.24,.035,f.color)}}
}
function drawEventOverlay(now){if(!eventFx)return;const f=eventFx,t=eventProgress(now);if(t>=1){$('eventCard').hidden=true;eventFx=null;return}if(!effects)return;
 const p=point(f.pos),origin=project(p.x,1.2,p.z);ctx.save();
 if(f.kind==='rent'){let destination={x:W-145,y:190+f.owner*62};const rows=$('players').children;const rect=rows?.[f.owner]?.getBoundingClientRect?.();if(rect)destination={x:rect.right-35,y:rect.top+rect.height*.5};for(let i=0;i<9;i++){let a=Math.max(0,Math.min(1,t*1.7-i*.065));if(a<=0||a>=1)continue;const x=origin.x+(destination.x-origin.x)*a,y=origin.y+(destination.y-origin.y)*a-Math.sin(a*Math.PI)*100;ctx.fillStyle='#ffe5a0';ctx.shadowColor='#ffc767';ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(x,y,5,7,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#9a6e35';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText('¥',x,y+3)}}
 else{ctx.globalAlpha=Math.min(1,(1-t)*3);ctx.fillStyle=f.color;ctx.font='600 17px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.shadowColor='#121b30';ctx.shadowBlur=8;ctx.fillText((f.amount>=0?'+':'−')+'¥'+Math.abs(f.amount).toLocaleString(),origin.x,origin.y-28-t*40)}ctx.restore();
}
