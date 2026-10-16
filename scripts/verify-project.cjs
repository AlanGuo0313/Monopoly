'use strict';
const {execFileSync}=require('node:child_process');
const {existsSync}=require('node:fs');
const path=require('node:path');
const project=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const sources=['game.js','renderer.js','events.js','details.js','scene.js','models.js','world-renderer.js','skins.js','skin-models.js','menu.js','server.cjs'];
try{
  for(const file of ['index.html','style.css',...sources]){
    if(!existsSync(path.join(project,file)))throw Error('Missing project file: '+file+'. Place this package in the project or pass its directory as the first argument.');
  }
  for(const file of sources)execFileSync(process.execPath,['--check',path.join(project,file)],{stdio:'inherit',timeout:15000});
  console.log('PASS: source syntax');
  for(const script of ['verify-tokyo.cjs','verify-events.cjs','verify-estates.cjs','verify-depth.cjs','verify-models.cjs','verify-world-renderer.cjs','verify-fast-scene.cjs','verify-camera.cjs','verify-mobile-zoom.cjs','verify-menu.cjs']){
    execFileSync(process.execPath,[path.join(__dirname,script),project],{stdio:'inherit',timeout:120000});
  }
  console.log('All project regression checks passed. Browser visuals and GPU execution still require real-browser verification.');
}catch(error){console.error(error.message);process.exitCode=1}
