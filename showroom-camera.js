import {interpolateFacades} from './facade-turn.js?v=2';
let orbitModule;
export function prepareExterior(){
  orbitModule??=import('./photo-orbit.js?v=1');
  return orbitModule.then(module=>module.prepareOrbit());
}
const byId = id => document.getElementById(id);
let turnLayer, turnNumber = 0;

export function cancelTurn() {
  turnNumber++;
  turnLayer?.remove();
  turnLayer = null;
}

// Panorama positions are left, front, right. Crossing both sides passes the front.
export async function orbit(previous, next, photos, firstPhoto) {
  cancelTurn();
  const run = turnNumber;
  const position = [0, 1, -1];
  let currentView = previous;
  const stops = Math.abs(position[next] - position[previous]) === 2 ? [0, next] : [next];
  const layer = document.createElement('div');
  layer.className = 'orbit-viewport';
  byId('exteriorStage').append(layer);
  turnLayer = layer;
  let original = firstPhoto;
  try {
    for (const stop of stops) {
      const from = new Image(), to = new Image();
      from.src = original;
      to.src = photos[stop];
      await Promise.all([from.decode(), to.decode()]);
      if (run !== turnNumber) return;
      const args=[layer,from,to,currentView,stop,stops.length===2?350:580,()=>run===turnNumber];
      try{
        await prepareExterior();
        if(run!==turnNumber)return;
        await (await orbitModule).modelOrbit(...args);
      }catch{
        if(run===turnNumber)await interpolateFacades(...args);
      }
      currentView = stop;
      if (run !== turnNumber) return;
      original = to.src;
    }
  } catch { /* The selected exterior remains available beneath the animation. */ }
  finally { if (run === turnNumber) cancelTurn(); }
}

let flightAnimations = [], landingTimer, exitTimer, flightNumber = 0;
export function cancelArrival() {
  flightNumber++;
  clearTimeout(landingTimer);
  clearTimeout(exitTimer);
  for (const animation of flightAnimations) animation.cancel();
  flightAnimations = [];
  const clip = byId('arrivalVideo');
  clip.onplaying = null;
  clip.pause();
}

export function flyToParcel(done) {
  cancelArrival();
  const run = flightNumber, intro = byId('intro'), video = byId('arrivalVideo');
  const animate = (element, frames, timing) => {
    const animation = element.animate(frames, {...timing, fill:'both'});
    flightAnimations.push(animation);
    return animation;
  };
  animate(byId('parcelOrtho'), [
    {transform:'scale(1.04)'},
    {transform:'scale(1.65) rotate(4deg)',offset:.54},
    {transform:'perspective(1100px) scale(3.3) rotateX(32deg) rotate(27deg)'}
  ], {duration:3200,easing:'cubic-bezier(.36,.12,.48,1)'});
  animate(byId('skyPass'), [
    {transform:'scale(1.03)',opacity:1,'--opening':'-42%'},
    {transform:'scale(1.25)',opacity:1,'--opening':'-29%',offset:.22},
    {transform:'scale(1.8) translateY(-3%)',opacity:.95,'--opening':'23%',offset:.6},
    {transform:'scale(2.6) translateY(-7%)',opacity:0,'--opening':'83%'}
  ], {duration:1250,easing:'ease-in'});
  animate(byId('mapCredit'), [{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.88},{opacity:0}],{duration:3400});
  const finish = () => {
    if (run !== flightNumber) return;
    animate(intro,[{opacity:1},{opacity:0}],{duration:290}).finished.then(()=>{
      if (run === flightNumber) done();
    }).catch(()=>{});
  };
  // Use the oblique-to-street portion only after the downward flight has reached the block.
  landingTimer = setTimeout(()=>{
    if (run !== flightNumber) return;
    video.currentTime = 2.05;
    video.playbackRate = 1.75;
    video.onplaying = () => {
      video.onplaying = null;
      if (run !== flightNumber) return;
      animate(video,[{opacity:0},{opacity:1}],{duration:540});
    };
    video.play().catch(()=>{});
  },2280);
  exitTimer = setTimeout(finish,4920);
}
