'use strict';
// Per-fragment depth testing replaces average-distance painter sorting.
// Every face is submitted each frame; no view-direction culling or terrain streaming.
function createDepthRenderer(){
 const surface=document.createElement('canvas');let gl;
 try{gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl||typeof gl.getParameter(gl.VERSION)!=='string')return null}catch{return null}
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 try{
 const vs=shader(gl.VERTEX_SHADER,'attribute vec4 position; attribute vec4 color; varying lowp vec4 faceColor; void main(){gl_Position=position;faceColor=color;}');
 const fs=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying lowp vec4 faceColor; void main(){gl_FragColor=faceColor;}');
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
 const buffer=gl.createBuffer(),position=gl.getAttribLocation(program,'position'),color=gl.getAttribLocation(program,'color');let data=new Float32Array(65536);let lost=false;
 surface.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true});surface.addEventListener('webglcontextrestored',()=>location.reload());
 return {canvas:surface,draw(polygons,pixelWidth,pixelHeight,width,height){
 if(lost)return;
 if(surface.width!==pixelWidth||surface.height!==pixelHeight){surface.width=pixelWidth;surface.height=pixelHeight}
 let vertices=0;for(const p of polygons)vertices+=Math.max(0,p.pp.length-2)*3;const length=vertices*8;if(data.length<length)data=new Float32Array(2**Math.ceil(Math.log2(length)));
 let offset=0;const near=1,far=160,A=(far+near)/(far-near),B=-2*far*near/(far-near);
 for(const p of polygons){const hex=p.color.slice(1);const rgba=[parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255,hex.length===8?parseInt(hex.slice(6,8),16)/255:1];
 for(let i=1;i<p.pp.length-1;i++)for(const v of [p.pp[0],p.pp[i],p.pp[i+1]]){const distance=80-v.depth;data[offset++]=(v.x/width*2-1)*distance;data[offset++]=(1-v.y/height*2)*distance;data[offset++]=A*distance+B;data[offset++]=distance;for(const c of rgba)data[offset++]=c}}
 gl.viewport(0,0,pixelWidth,pixelHeight);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,length),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,4,gl.FLOAT,false,32,0);gl.enableVertexAttribArray(color);gl.vertexAttribPointer(color,4,gl.FLOAT,false,32,16);gl.drawArrays(gl.TRIANGLES,0,vertices);
 }};
 }catch(e){console.warn('Depth renderer unavailable; using subdivided Canvas fallback.',e);return null}
}
