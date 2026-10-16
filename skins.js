'use strict';
const skinCatalog=[
 {id:'nailong',name:'奶龍',color:'#e8b933',coat:'#ffd34b'},
 {id:'fox',name:'狐狸',color:'#d47b42',coat:'#e78948'},
 {id:'pochita',name:'波奇塔',color:'#ef8b42',coat:'#f47720'},
 {id:'white-fox',name:'白狐狸',color:'#a9c7d3',coat:'#eef4f3'},
 {id:'shiba',name:'柴犬',color:'#bb8a51',coat:'#cb9659'}
];
function skinInfo(id){return skinCatalog.find(s=>s.id===id)||skinCatalog[0]}
let selectedSkin='nailong';try{const s=localStorage.getItem('tokyo-monopoly-skin');if(skinCatalog.some(v=>v.id===s))selectedSkin=s}catch{}
function applyPlayerSkin(id){if(!skinCatalog.some(s=>s.id===id))return false;selectedSkin=id;try{localStorage.setItem('tokyo-monopoly-skin',id)}catch{}players[0].color=skinInfo(id).color;ui();return true}
function skinAvatar(id=selectedSkin){const s=skinInfo(id);if(s.id==='nailong'&&typeof nailongAvatar==='function')return nailongAvatar();const dog=s.id==='shiba',saw=s.id==='pochita',fur=s.coat,cream='#fff0d8';if(!saw)return `<svg viewBox="0 0 44 46" role="img" aria-label="${s.name}"><path d="M14 26Q6 25 3 17Q1 32 13 33" fill="${fur}"/><ellipse cx="23" cy="27" rx="12" ry="7" fill="${fur}"/><path d="M15 29V39H18L20 30M29 29V39H32V28" fill="${fur}"/><path d="M29 22L30 12 34 17 38 13 38 22 42 25 37 28 31 26" fill="${fur}"/><path d="M31 23L41 25 36 28 30 25" fill="#f5e8d4"/><circle cx="36" cy="21" r="1" fill="#243332"/><circle cx="41" cy="25" r="1.3" fill="#243332"/></svg>`;return `<svg viewBox="0 0 44 46" role="img" aria-label="${s.name}">${saw?'<path d="M17 13V5Q22 0 27 5V13" fill="none" stroke="#373d42" stroke-width="4"/>':`<path d="M7 19L8 3 20 17M24 17L37 3 38 21" fill="${fur}"/><path d="M11 15L11 8 17 16M28 16L34 8 34 16" fill="#c6a7a5"/>`}<ellipse cx="22" cy="27" rx="18" ry="16" fill="${fur}"/>${saw?'<path d="M20 18V1H25L27 5 24 7 27 10 24 12 27 15 24 18Z" fill="#89979c" stroke="#374248" stroke-width="1"/>':`<ellipse cx="22" cy="34" rx="12" ry="8" fill="${cream}"/>`}<ellipse cx="15" cy="25" rx="2.5" ry="3.5" fill="#28343d"/><ellipse cx="29" cy="25" rx="2.5" ry="3.5" fill="#28343d"/>${saw?'<path d="M15 34Q22 40 29 34" fill="#fff2db"/>':'<ellipse cx="22" cy="32" rx="3" ry="2.4" fill="#33424a"/><path d="M17 36Q22 39 27 36" fill="none" stroke="#8d7668" stroke-width="1.3"/>'}</svg>`}
function drawPlayerSkin(pose,now,id=selectedSkin,heading=null){drawDetailedSkin(pose,now,skinInfo(id).id,heading)}
