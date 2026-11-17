const app=document.getElementById('app'),stage=document.getElementById('exteriorStage');
const sky=document.createElement('div');sky.id='homeSky';sky.setAttribute('aria-hidden','true');stage.append(sky);
const night=document.getElementById('night');
const syncSky=()=>app.classList.toggle('home-night',night.getAttribute('aria-pressed')==='true');
new MutationObserver(syncSky).observe(night,{attributes:true,attributeFilter:['aria-pressed']});syncSky();
const terrain=document.getElementById('floorBackdrop');
function syncLawn(){
 let lawn=terrain.querySelector('.terrain-lawn');
 if(!lawn){lawn=document.createElement('div');lawn.className='terrain-lawn';lawn.setAttribute('aria-hidden','true');terrain.append(lawn);}
 const size=terrain.style.backgroundSize.split(' '),position=terrain.style.backgroundPosition.split(' ');
 if(size.length===2&&position.length===2){Object.assign(lawn.style,{width:size[0],height:size[1],left:position[0],top:position[1]});}
}
new MutationObserver(syncLawn).observe(terrain,{attributes:true,attributeFilter:['style'],childList:true});syncLawn();
