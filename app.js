import { orbit, cancelTurn, flyToParcel, cancelArrival, prepareExterior } from './showroom-camera.js?v=4';
import { prepareParcel } from './parcel-imagery.js?v=1';
import { initContact } from './contact.js?v=20261030';
import { openMaps, closeMaps } from './nearby-map.js?v=20261029';
import { showGallery } from './gallery.js?v=unidades-20261110';
const $=id=>document.getElementById(id);const NS='http://www.w3.org/2000/svg';let reduced=localStorage.getItem('seminare-motion')==='off';
let state='home',floor=4,selected=null,hovered=null,view=0,mode='day',introTimer=null,cycleTimer=null,activeTab='render',project={units:[]};
const floorUnits={"1": [{"letter": "A", "label": [568.0, 714.0], "points": [[277, 608], [716, 608], [716, 867], [420, 867], [420, 820], [251, 820], [251, 680], [277, 680]]}, {"letter": "B", "label": [979.5, 714.0], "points": [[833, 608], [1270, 608], [1270, 680], [1300, 680], [1300, 820], [1126, 820], [1126, 867], [833, 867]]}, {"letter": "C", "label": [568.0, 502.5], "points": [[251, 397], [420, 397], [420, 349], [716, 349], [716, 608], [277, 608], [277, 535], [251, 535]]}, {"letter": "D", "label": [979.5, 502.5], "points": [[833, 349], [1126, 349], [1126, 397], [1300, 397], [1300, 535], [1270, 535], [1270, 608], [833, 608]]}], "2": [{"letter": "A", "label": [554.5, 679.5], "points": [[248, 567], [712, 567], [712, 845], [397, 845], [397, 792], [224, 792], [224, 645], [248, 645]]}, {"letter": "B", "label": [990.5, 679.5], "points": [[838, 567], [1301, 567], [1301, 645], [1323, 645], [1323, 792], [1143, 792], [1143, 845], [838, 845]]}, {"letter": "C", "label": [554.5, 455.0], "points": [[224, 343], [397, 343], [397, 287], [712, 287], [712, 567], [248, 567], [248, 493], [224, 493]]}, {"letter": "D", "label": [990.5, 455.0], "points": [[838, 287], [1143, 287], [1143, 343], [1323, 343], [1323, 493], [1301, 493], [1301, 567], [838, 567]]}], "3": [{"letter": "A", "label": [567.5, 707.0], "points": [[248, 592], [726, 592], [726, 873], [409, 873], [409, 822], [224, 822], [224, 672], [248, 672]]}, {"letter": "B", "label": [1007.0, 707.0], "points": [[850, 592], [1331, 592], [1331, 672], [1358, 672], [1358, 822], [1164, 822], [1164, 873], [850, 873]]}, {"letter": "C", "label": [567.5, 476.5], "points": [[224, 361], [409, 361], [409, 305], [726, 305], [726, 592], [248, 592], [248, 514], [224, 514]]}, {"letter": "D", "label": [1007.0, 476.5], "points": [[850, 305], [1164, 305], [1164, 361], [1358, 361], [1358, 514], [1331, 514], [1331, 592], [850, 592]]}], "4": [{"letter": "A", "label": [549.5, 689.0], "points": [[220, 576], [708, 576], [708, 854], [391, 854], [391, 802], [204, 802], [204, 653], [220, 653]]}, {"letter": "B", "label": [988.0, 689.0], "points": [[831, 576], [1305, 576], [1305, 653], [1335, 653], [1335, 802], [1145, 802], [1145, 854], [831, 854]]}, {"letter": "C", "label": [549.5, 463.5], "points": [[204, 351], [391, 351], [391, 298], [708, 298], [708, 576], [220, 576], [220, 501], [204, 501]]}, {"letter": "D", "label": [988.0, 463.5], "points": [[831, 298], [1145, 298], [1145, 351], [1335, 351], [1335, 501], [1305, 501], [1305, 576], [831, 576]]}]};
const ground=[{"letter": "L1", "label": [560, 710], "points": [[382, 490], [524, 490], [524, 451], [693, 451], [693, 877], [539, 877], [539, 838], [394, 838], [394, 715], [415, 715], [415, 605], [382, 605]]}, {"letter": "L2", "label": [1000, 710], "points": [[837, 451], [1053, 451], [1053, 490], [1200, 490], [1200, 838], [1049, 838], [1049, 877], [837, 877]]}];
const buildingSilhouettes={"0": [[738,363],[841,363],[841,446],[1058,446],[1058,484],[1206,484],[1206,610],[1194,610],[1194,709],[1206,709],[1206,842],[1056,842],[1056,882],[832,882],[832,848],[754,848],[754,882],[694,882], [539, 882], [539, 842], [389, 842], [389, 722], [232, 722], [232, 600], [376, 600], [376, 484], [520, 484], [520, 446], [738, 446]], "1": [[709, 235], [838, 235], [838, 341], [1128, 341], [1128, 389], [1307, 389], [1307, 541], [1277, 541], [1277, 676], [1307, 676], [1307, 827], [1133, 827], [1133, 876], [827, 876], [827, 827], [723, 827], [723, 876], [414, 876], [414, 827], [244, 827], [244, 689], [199, 689], [199, 549], [244, 549], [244, 389], [414, 389], [414, 341], [709, 341]], "2": [[702, 166], [847, 166], [847, 280], [1150, 280], [1150, 335], [1331, 335], [1331, 501], [1309, 501], [1309, 638], [1333, 638], [1333, 800], [1150, 800], [1150, 853], [831, 853], [831, 800], [721, 800], [721, 853], [397, 853], [397, 800], [215, 800], [215, 638], [185, 638], [185, 512], [215, 512], [215, 335], [385, 335], [385, 280], [702, 280]], "3": [[718, 179], [856, 179], [856, 298], [1171, 298], [1171, 353], [1366, 353], [1366, 521], [1337, 521], [1337, 665], [1367, 665], [1367, 830], [1171, 830], [1171, 881], [845, 881], [845, 830], [734, 830], [734, 881], [402, 881], [402, 830], [216, 830], [216, 668], [181, 668], [181, 522], [216, 522], [216, 353], [401, 353], [401, 298], [718, 298]], "4": [[699, 174], [839, 174], [839, 290], [1150, 290], [1150, 345], [1343, 345], [1343, 506], [1311, 506], [1311, 647], [1343, 647], [1343, 810], [1150, 810], [1150, 863], [825, 863], [825, 810], [713, 810], [713, 863], [384, 863], [384, 810], [197, 810], [197, 345], [384, 345], [384, 290], [699, 290]]};
for(let f=2;f<=4;f++){floorUnits[f]=floorUnits[1];buildingSilhouettes[f]=buildingSilhouettes[1];}
const high=floorUnits[1];
const units=()=>floor===0?ground:floorUnits[floor];const unitId=i=>floor===0?`PB-${i+1}`:`${floor}${high[i].letter}`;const unitTitle=i=>floor===0?`Local ${i+1}`:`Unidad ${unitId(i)}`;
function data(i){return project.units.find(u=>u.id===unitId(i))||{status:'available',rooms:floor===0?null:2,bedrooms:floor===0?0:1,bathrooms:1,balcony:floor===0?false:true,kitchen:floor===0?'Office':'Sí'};}
function status(i){const u=data(i);return {label:({available:'Disponible',sold:'Vendida',reserved:'Reservada'})[u.status]||'Disponibilidad a confirmar',color:({available:'#1dac70',sold:'#e92236',reserved:'#c18d38'})[u.status]||'#ba913e'};}
const show=(id,on)=>$(id).hidden=!on;function context(){return floor===0?'Planta baja · Locales comerciales':`Piso ${floor} · 4 departamentos`;}
fetch('./project.json?v=20261117-motion').then(r=>r.json()).then(async d=>{project=d;if(d.availabilityEndpoint){try{const r=await fetch(d.availabilityEndpoint);if(!r.ok)throw Error(r.status);const rows=await r.json();if(Array.isArray(rows))project.units=project.units.map(u=>({...u,...rows.find(v=>v.id===u.id)}));}catch(e){console.warn('Disponibilidad pendiente',e);}}applyMedia();if(state==='floors')renderPlan();else if(state==='detail')openDetails();}).catch(console.error);
function syncBackdrop(){const current=mode==='night'?$('nightImage'):$('dayImage');$('exteriorStage').style.setProperty('--scene-image',`url(${JSON.stringify(current.src)})`);}
function setMode(value){mode=value;$('nightImage').style.opacity=value==='night'?'1':'0';$('day').setAttribute('aria-pressed',value==='day');$('night').setAttribute('aria-pressed',value==='night');syncBackdrop();}
function startDayNightCycle(){
 clearInterval(cycleTimer);
 if(state!=='exterior'||reduced)return;
 cycleTimer=setInterval(()=>{if(turning||!['home','exterior'].includes(state)||$('app').classList.contains('entering')||$('app').classList.contains('ascending'))return;setMode(mode==='day'?'night':'day');},12000);
}
function sceneSource(images,period){const mobile=matchMedia('(max-width:650px)').matches;return mobile?images?.[period==='day'?'mobileDay':'mobileNight']||images?.[period]:images?.[period];}
let orbitToken=0, turning=false, desiredView=0;
function stopOrbit(){
 orbitToken++;
 turning=false;
 desiredView=view;
 cancelTurn();
 $('app').classList.remove('turning');
}
function exteriorPhoto(index,period){
 const suffix=matchMedia('(max-width:650px)').matches?'-mobile':'';
 const angle=['facade','oblique-right','oblique-left'][index];
 return sceneSource(project.media?.exterior?.[index],period)||`assets/scenes-20261116-v3/${angle}-${period==='night'?'dusk':'day'}${suffix}.jpg`;
}
function displayView(index){
 view=index;
 const cover=state==='home';
 for(const period of ['day','night']){
  const image=$(period+'Image');
  const src=cover?(sceneSource(project.media?.cover,period)||exteriorPhoto(0,period)):exteriorPhoto(view,period);
  if(image.getAttribute('src')!==src)image.src=src;
  image.alt=`Vista exterior ${view+1} del edificio, de ${period==='day'?'día':'noche'}`;
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.view===view));
 syncBackdrop();
}
async function setView(value,turn=false){
 desiredView=(value+3)%3;
 if(!turn||reduced){stopOrbit();displayView((value+3)%3);desiredView=view;return;}
 if(turning||desiredView===view)return;
 turning=true;
 const token=++orbitToken;
 $('app').classList.add('turning');
 try{
  while(view!==desiredView){
   const target=desiredView, photos=[0,1,2].map(i=>exteriorPhoto(i,mode));
   await orbit(view,target,photos,$(mode+'Image').currentSrc||photos[view]);
   if(token!==orbitToken)return;
   displayView(target);
  }
 }finally{
  if(token===orbitToken){
   turning=false;$('app').classList.remove('turning');
   startDayNightCycle();
  }
 }
}
function stopIntro(){departure?.cancel();departure=null;$('app').classList.remove('departing');const wasEntering=$('app').classList.contains('entering');cancelArrival();clearTimeout(introTimer);$('app').classList.remove('entering');$('intro').classList.remove('motion-ready');show('intro',false);if(state==='exterior'){show('exteriorControls',true);show('dayControls',true);show('floorsBtn',true);show('hint',true);if(wasEntering)startDayNightCycle();}}
function route(next,keepBuildingTransition=false){stopOrbit();closeMaps();show('mapScreen',next==='map');if(!keepBuildingTransition)cancelBuildingEntry();stopIntro();clearInterval(cycleTimer);state=next;selected=null;hovered=null;$('app').dataset.screen=next;show('exteriorStage',next==='home'||next==='exterior');show('welcome',next==='home');show('back',next!=='home');show('context',next!=='home');show('floorsBtn',next==='exterior');show('dayControls',next==='exterior');show('exteriorControls',next==='exterior');show('floorStage',next==='floors');show('floorRail',next==='floors');show('floorCadBtn',next==='floors');show('details',false);show('unitPreview',false);show('hint',next==='floors'||next==='exterior');$('hint').textContent=next==='floors'?'Pasá el cursor o tocá una unidad':'Elegí un ángulo para recorrer el exterior';$('context').textContent=next==='floors'?context():next==='map'?'Mapa y cercanía':'Proyecto Inmobiliario';if(next==='home'){setView(0);setMode('day');}else if(next==='exterior'){setView(view);}else if(next==='floors'){floor=4;renderPlan();}else if(next==='map'){openMaps($('mapScreen'),(project.mapData||'assets/nearby-places-20261019.json')+'?v=20261029');}if(next==='home'||next==='exterior')startDayNightCycle();history.replaceState(null,'','#'+next);}
let departure=null;
function prewarmShowroom(){
 if(reduced||!['home','exterior'].includes(state))return;
 prepareExterior().catch(()=>{});
 if(state==='home')prepareParcel();
}
if('requestIdleCallback' in window)requestIdleCallback(prewarmShowroom,{timeout:1600});
else setTimeout(prewarmShowroom,500);
async function enter(){
 if(departure)return;
 if(!reduced){
  prepareParcel();
  const veil=$('departureCloud');
  $('app').classList.add('departing');
  departure=veil.animate([
   {opacity:0,transform:'scale(1.24) translateY(-5%)'},
   {opacity:1,transform:'scale(1.03)'}
  ],{duration:390,easing:'cubic-bezier(.4,0,.38,1)',fill:'both'});
  try{await departure.finished;}catch{return;}
 }
 route('exterior');setView(0);setMode('day');
 if(reduced)return;
 show('exteriorControls',false);show('dayControls',false);show('floorsBtn',false);show('hint',false);
 clearInterval(cycleTimer);show('intro',true);$('app').classList.add('entering');
 flyToParcel(stopIntro);
}
const floorAlignment={
 0:{s:1146/830,cx:789,cy:713},
 1:{s:1.23,cx:775.5,cy:608},
 2:{s:1146/1118,cx:774,cy:567},
 3:{s:1146/1151,cx:791.5,cy:592},
 4:{s:1,cx:770,cy:576}
};
function alignFloor(){
 const a=floorAlignment[floor===0?0:1];
 $('floorContent').setAttribute('transform',`translate(${770-a.cx*a.s} ${576-a.cy*a.s}) scale(${a.s})`);
 $('plan').setAttribute('viewBox',innerWidth<=700?'-30 80 1430 850':'-15 75 1400 850');
}
function renderPlan(){updateFloorBackground();$('plan').setAttribute('viewBox','0 0 1536 1024');$('planImage').setAttribute('clip-path','url(#floorSilhouette)');$('floorOutline').setAttribute('points',buildingSilhouettes[floor].map(p=>p.join(',')).join(' '));$('planImage').setAttribute('href',planSource());$('planImage').setAttribute('width',1536);$('planImage').setAttribute('height',1024);$('hotspots').replaceChildren();$('planLabels').replaceChildren();units().forEach((u,i)=>{const polygon=document.createElementNS(NS,'polygon');polygon.setAttribute('points',u.points.map(p=>p.join(',')).join(' '));polygon.dataset.unit=i;polygon.setAttribute('tabindex','0');polygon.setAttribute('role','button');polygon.setAttribute('aria-label',`Ver ${unitTitle(i)}`);polygon.style.setProperty('--status-color',status(i).color);polygon.style.setProperty('--status-fill',status(i).color+'33');polygon.addEventListener('pointerenter',()=>previewUnit(i,false));polygon.addEventListener('pointerleave',()=>{if(selected===null){hovered=null;highlight(-1);show('unitPreview',false);}});polygon.addEventListener('focus',()=>previewUnit(i,false));polygon.addEventListener('click',()=>previewUnit(i,true));polygon.addEventListener('dblclick',()=>{previewUnit(i,true);openDetails();});polygon.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();previewUnit(i,true);}});$('hotspots').appendChild(polygon);const b=document.createElement('button');b.className='unit-label';b.dataset.unit=i;b.setAttribute('aria-label',`Ver ${unitTitle(i)}`);b.innerHTML=`<i style="background:${status(i).color}"></i><span>${floor===0?'Local '+(i+1):unitId(i)}</span>`;b.style.setProperty('--status-color',status(i).color);b.onclick=()=>previewUnit(i,true);b.ondblclick=()=>{previewUnit(i,true);openDetails();};b.onmouseenter=()=>previewUnit(i,false);b.onmouseleave=()=>{if(selected===null){hovered=null;highlight(-1);show('unitPreview',false);}};$('planLabels').appendChild(b);});$('context').textContent=context();document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.floor===floor));alignFloor();requestAnimationFrame(positionLabels);}
function positionLabels(){if(state!=='floors'||sideMotions.length)return;alignFloor();alignTerrain();const matrix=$('floorContent').getScreenCTM();if(!matrix)return;units().forEach((u,i)=>{const p=$('plan').createSVGPoint();[p.x,p.y]=u.label;const out=p.matrixTransform(matrix),b=$('planLabels').children[i];if(b){b.style.left=out.x+'px';b.style.top=out.y+'px';}});}
function highlight(i){document.querySelectorAll('[data-unit]').forEach(el=>el.classList.toggle('active',+el.dataset.unit===i));}
function previewUnit(i,lock){hovered=i;if(lock)selected=i;highlight(i);$('previewFloor').textContent=floor===0?'PLANTA BAJA':`PISO ${floor}`;$('previewName').textContent=unitTitle(i);$('previewRooms').textContent=floor===0?'Local comercial · Office · Baño':'2 ambientes · 1 dormitorio · Balcón';$('previewStatus').textContent=status(i).label;$('previewStatus').style.color=status(i).color;$('previewStatus').style.backgroundColor=status(i).color+'18';show('unitPreview',true);}
function setFloor(value){
 if(value===floor)return;
 const previous=floor;
 floor=value;selected=null;hovered=null;show('unitPreview',false);renderPlan();
 if(!reduced){
  const direction=value>previous?1:-1;
  const plan=$('plan');plan.getAnimations().forEach(a=>a.cancel());
  plan.animate([{opacity:.35,transform:`translateY(${direction*22}px)`},{opacity:1,transform:'translateY(0)'}],{duration:460,easing:'cubic-bezier(.2,.6,.2,1)'});
 }
}
function closePreview(){selected=null;hovered=null;highlight(-1);show('unitPreview',false);}
const confirmed=v=>v===null||v===undefined?'A confirmar':typeof v==='boolean'?(v?'Sí':'No'):v;
function openDetails(){const i=hovered??selected;if(i===null)return;selected=i;state='detail';$('app').dataset.screen='detail';show('floorStage',false);show('floorRail',false);show('floorCadBtn',false);show('unitPreview',false);show('hint',false);show('details',true);$('context').textContent=`${floor===0?'Planta baja':'Piso '+floor} / ${unitTitle(i)}`;$('detailName').textContent=unitTitle(i);$('detailStatus').textContent=status(i).label;$('detailStatus').style.color=status(i).color;$('detailStatus').style.backgroundColor=status(i).color+'18';const d=data(i),area=v=>typeof v==='number'?v.toLocaleString('es-AR')+' m²':'A confirmar';const commercial=floor===0||d.type==='commercial';const fields=[['Superficie total',area(d.totalArea)],['Piso',floor===0?'Planta baja':floor],...(!commercial?[['Ambientes',confirmed(d.rooms)],['Dormitorio',confirmed(d.bedrooms>0)]]:[]),['Baño',confirmed(d.bathrooms>0)],...(!commercial?[['Balcón',confirmed(d.balcony)],['Cocina',confirmed(d.kitchen)],['Lavadora',confirmed(d.washer)],['Secadora',confirmed(d.dryer)]]:[]),['Módulo de estacionamiento',confirmed(d.parking)],...(commercial?[['Sistema de calefacción',d.heating]]:[])];$('detailFields').replaceChildren();fields.forEach(([key,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;div.append(dt,dd);$('detailFields').appendChild(div);});selectTab('render');history.replaceState(null,'',`#unidad-${unitId(i)}`);}
function selectTab(tab){
 if(tab==='views'&&floor===0&&!project.media?.balconyViews?.[unitId(selected)])tab='render';
 activeTab=tab;
 const balcony=tab==='views'?project.media?.balconyViews?.[unitId(selected)]:null;
 show('balconyPanel',!!balcony);
 document.querySelectorAll('[data-tab]').forEach(b=>{
  b.hidden=floor===0&&b.dataset.tab==='views'&&!project.media?.balconyViews?.[unitId(selected)];
  b.setAttribute('aria-selected',b.dataset.tab===tab);b.setAttribute('tabindex',b.dataset.tab===tab?'0':'-1');
  b.setAttribute('aria-controls',b.dataset.tab==='render'?'renderPanel':b.dataset.tab==='gallery'?'galleryPanel':b.dataset.tab==='cad'?'pdfPanel':b.dataset.tab==='views'?(project.media?.balconyViews?.[unitId(selected)]?'balconyPanel':'emptyPanel'):'emptyPanel');
 });
 show('renderPanel',tab==='render');show('galleryPanel',tab==='gallery');show('emptyPanel',tab==='views'&&!balcony);show('pdfPanel',tab==='cad');
 if(tab==='gallery')showGallery($('galleryPanel'),floor===0);
 if(balcony){
  $('balconyImage').src=balcony.src;$('balconyImage').alt=(floor===0?'Vista exterior de ':'Vista desde el balcón de ')+unitTitle(selected);
  $('balconyTitle').textContent=floor===0?'Vista · '+unitTitle(selected):'Balcón · '+unitTitle(selected)+' · Piso '+floor;$('balconyOrientation').textContent=balcony.orientation;$('viewDescription').textContent=floor===0?'Vista exterior del local.':'Render de la vista desde el balcón, basado en el entorno modelado. Representación aproximada; no es una fotografía de la vista real.';
 }else if(tab==='render'){renderUnitPlan();}
 else if(tab==='cad'){
  const base=floor===0?'local-'+(selected+1):'unit-'+high[selected].letter.toLowerCase();
  $('pdfTitle').textContent='Plano CAD · '+unitTitle(selected);$('pdfOpen').href=`assets/${base}.pdf`;$('pdfDownload').href=`assets/${base}.pdf`;
  $('pdfPreview').src=`assets/cad-${base}.png`;$('pdfPreview').alt='Plano CAD individual · '+unitTitle(selected);$('pdfPreview').parentElement.classList.remove('zoomed');
 }else{
  $('emptyIcon').textContent=tab==='gallery'?'▧':'◫';$('emptyTitle').textContent=tab==='gallery'?'Galería de la unidad':'Vistas desde el balcón';
  $('emptyDescription').textContent=tab==='gallery'?'Las fotografías y renders se incorporarán próximamente.':'Las imágenes de las vistas se incorporarán próximamente.';
 }
}
let buildingTimer=null;
let sideMotions=[];
function clearSideLift(){
 for(const motion of sideMotions)motion.cancel();
 sideMotions=[];
 $('app').classList.remove('side-lift');
}

// Front-left, front-right and back-left corners of the roof, in reference pixels.
const sideRoofs={
 desktop:[[[190,124],[416,124],[203,110]],[[196,118],[322,141],[248,101]],[[270,143],[392,119],[227,121]]],
 mobile:[[[60,232],[241,232],[70,223]],[[72,225],[179,247],[119,211]],[[117,246],[229,224],[80,225]]]
};
// Outer silhouette in the same render coordinates as the three roof anchors.
const exteriorOutline={
 desktop:[
  [[190,122],[204,112],[284,112],[284,88],[300,83],[317,89],[317,112],[398,112],[416,122],[414,274],[191,274]],
  [[196,119],[242,102],[242,94],[322,85],[334,92],[334,111],[380,118],[373,257],[322,291],[211,231]],
  [[225,121],[270,111],[270,90],[279,85],[343,96],[346,102],[366,103],[394,119],[385,218],[270,262],[228,247]]
 ],
 mobile:[
  [[59,230],[71,223],[136,223],[136,206],[149,198],[163,205],[163,223],[230,223],[242,231],[240,356],[61,356]],
  [[72,225],[112,211],[112,204],[181,198],[189,204],[189,224],[229,231],[224,348],[178,374],[83,319]],
  [[79,225],[118,216],[118,195],[126,191],[180,201],[188,207],[202,208],[233,223],[226,317],[117,355],[81,337]]
 ]
};
function liftToPlan(photo){
 const w=$('app').clientWidth,h=$('app').clientHeight;
 const mobile=photo.currentSrc.includes('-mobile');
 const refWidth=mobile?300:600,refHeight=mobile?533:338;
 const scale=Math.max(w/refWidth,h/refHeight);
 const [frontLeft,frontRight,backLeft]=sideRoofs[mobile?'mobile':'desktop'][view].map(
  ([x,y])=>[(w-refWidth*scale)/2+x*scale,(h-refHeight*scale)/2+y*scale]);
 const surface=$('planCamera'),overlay=$('buildingTransition');
 const background=$('buildingFallback');
 background.src=photo.currentSrc;
 route('floors',true);
 $('app').classList.add('side-lift','ascending');
 overlay.classList.add('single-entry');
 show('buildingTransition',true);
 const outline=exteriorOutline[mobile?'mobile':'desktop'][view].map(([x,y])=>
  `${(w-refWidth*scale)/2+x*scale}px ${(h-refHeight*scale)/2+y*scale}px`);
 background.style.clipPath=`polygon(${outline.join(',')})`;
 const surroundings=$('liftSurroundings');
 surroundings.style.backgroundImage=`url(${JSON.stringify(photo.currentSrc)})`;
 surroundings.style.clipPath=`polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${outline.join(',')},${outline[0]},0 0)`;
 positionLabels();
 const matrix=$('floorContent').getScreenCTM();
 const start=new DOMPoint(246,389).matrixTransform(matrix);
 const targetWidth=1061*matrix.a,targetHeight=438*matrix.d;
 const a=(frontRight[0]-frontLeft[0])/targetWidth,b=(frontRight[1]-frontLeft[1])/targetWidth;
 const c=(frontLeft[0]-backLeft[0])/targetHeight,d=(frontLeft[1]-backLeft[1])/targetHeight;
 const duration=1500,options={duration,easing:'cubic-bezier(.35,0,.22,1)',fill:'both'};
 surface.style.transformOrigin='0 0';
 // Both images follow the same roof edge throughout the turn.
 const steps=40, planFrames=[], photoFrames=[];
 const angle=Math.atan2(b,a), widthRatio=Math.hypot(a,b);
 for(let i=0;i<=steps;i++){
  const t=i/steps, u=1-t;
  const left=frontLeft[0]*u+start.x*t,top=frontLeft[1]*u+(start.y+targetHeight)*t;
  const factor=widthRatio*u+t,theta=angle*u;
  const ax=factor*Math.cos(theta),ay=factor*Math.sin(theta);
  // Pitch around the front eave. The roof gains depth as the wall below
  // it foreshortens; they share the same edge at every camera position.
  const pitch=t*Math.PI/2, rise=Math.sin(pitch);
  const cx=c*u,cy=d*u+rise;
  const fx=left-ax*start.x-cx*(start.y+targetHeight),fy=top-ay*start.x-cy*(start.y+targetHeight);
  const reveal=Math.min(1,t*3);
  planFrames.push({transform:`matrix(${ax},${ay},${cx},${cy},${fx},${fy})`,opacity:reveal*reveal*(3-2*reveal)});
  const zoom=factor/widthRatio, wall=Math.cos(pitch)**2.4;
  const x0=Math.cos(angle),y0=Math.sin(angle),x1=Math.cos(theta),y1=Math.sin(theta);
  const m=zoom*(x1*x0+wall*y1*y0),n=zoom*(y1*x0-wall*x1*y0);
  const p=zoom*(x1*y0-wall*y1*x0),q=zoom*(y1*y0+wall*x1*x0);
  photoFrames.push({transform:`matrix(${m},${n},${p},${q},${left-m*frontLeft[0]-p*frontLeft[1]},${top-n*frontLeft[0]-q*frontLeft[1]})`});
 }
 sideMotions=[
  surface.animate(planFrames,options),
  surroundings.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.14) translateY(-8%)',offset:.58},{opacity:0,transform:'scale(1.14) translateY(-8%)'}],options),
  overlay.animate([{opacity:1},{opacity:1,offset:.31},{opacity:0,offset:.71},{opacity:0}],options),
  overlay.animate(photoFrames,options)
 ];
 buildingTimer=setTimeout(()=>{cancelBuildingEntry();positionLabels();},duration);
}
function cancelBuildingEntry(){clearSideLift();clearTimeout(buildingTimer);show('buildingTransition',false);$('buildingTransition').classList.remove('reveal-floor','single-entry','motion-ready');$('app').classList.remove('ascending');}
function finishBuildingEntry(){if(sideMotions.length){cancelBuildingEntry();positionLabels();return;}if(!$('app').classList.contains('ascending'))return;clearTimeout(buildingTimer);route('floors',true);$('app').classList.remove('ascending');$('buildingTransition').classList.add('reveal-floor');buildingTimer=setTimeout(cancelBuildingEntry,350);}
function enterBuilding(){
 if(state!=='exterior'||$('app').classList.contains('ascending'))return;
 if(turning)stopOrbit();
 stopIntro();
 clearInterval(cycleTimer);
 const activePhoto=mode==='night'?$('nightImage'):$('dayImage');
 if(reduced||!activePhoto.complete||!activePhoto.naturalWidth){route('floors');return;}
 liftToPlan(activePhoto);
}
function openFloorCad(){const groundFloor=floor===0,base=groundFloor?'floor-ground':'floor-high';$('floorCadTitle').textContent=(groundFloor?'Planta baja':'Piso '+floor)+' · Plano CAD';$('floorCadOpen').href=`assets/${base}.pdf`;$('floorCadDownload').href=`assets/${base}.pdf`;$('floorCadPreview').src=`assets/cad-${groundFloor?'ground':'high'}.png`;$('floorCadPreview').alt='Plano CAD de la planta completa';$('floorCadPreview').parentElement.classList.remove('zoomed');$('floorCad').showModal();}
$('floorCadBtn').onclick=openFloorCad;$('floorCadPreview').onclick=()=>$('floorCadPreview').parentElement.classList.toggle('zoomed');$('skipBuilding').onclick=finishBuildingEntry;
function syncMotion(){document.documentElement.classList.toggle('motion-off',reduced);$('motionToggle').textContent=reduced?'Animaciones desactivadas · Activar':'Animaciones activadas · Desactivar';$('motionToggle').setAttribute('aria-pressed',String(!reduced));}
syncMotion();$('motionToggle').onclick=()=>{reduced=!reduced;localStorage.setItem('seminare-motion',reduced?'off':'on');syncMotion();if(reduced){setView(desiredView);stopIntro();cancelBuildingEntry();}};
$('enter').onclick=enter;$('skipIntro').onclick=stopIntro;$('floorsBtn').onclick=$('buildingEntry').onclick=enterBuilding;$('back').onclick=()=>{if(state==='detail'){const f=floor;route('floors');setFloor(f);}else route(state==='floors'?'exterior':'home');};$('day').onclick=()=>{setMode('day');startDayNightCycle();};$('night').onclick=()=>{setMode('night');startDayNightCycle();};$('previous').onclick=()=>setView(desiredView-1,true);$('next').onclick=()=>setView(desiredView+1,true);$('exteriorStage').onclick=()=>{if(state==='exterior'&&!$('app').classList.contains('entering')&&!$('app').classList.contains('ascending'))setView(desiredView+1,true);};$('closePreview').onclick=closePreview;$('moreDetails').onclick=openDetails;initContact(()=>({email:project.contactEmail,unit:unitTitle(selected)}));document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>setFloor(+b.dataset.floor));document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>selectTab(b.dataset.tab));$('mediaTabs').onkeydown=e=>{const tabs=[...document.querySelectorAll('[data-tab]')].filter(b=>!b.hidden),i=tabs.findIndex(b=>b.dataset.tab===activeTab);let n;if(['ArrowDown','ArrowRight'].includes(e.key))n=(i+1)%tabs.length;if(['ArrowUp','ArrowLeft'].includes(e.key))n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();selectTab(tabs[n].dataset.tab);tabs[n].focus();}};$('pdfPreview').onclick=()=>{$('pdfPreview').parentElement.classList.toggle('zoomed');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('notice').textContent='Usá la opción de pantalla completa de tu navegador.';show('notice',true);setTimeout(()=>show('notice',false),3500);}};
$('menuBtn').onclick=()=>{$('menu').showModal();$('menuBtn').setAttribute('aria-expanded','true');};$('menu').onclose=()=>$('menuBtn').setAttribute('aria-expanded','false');document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{$('menu').close();const dest=b.dataset.nav==='location'?'map':b.dataset.nav;if(['home','exterior','floors','map'].includes(dest))route(dest);else{$('infoContent').innerHTML="<p class=\"eyebrow\">PROYECTO INMOBILIARIO</p><h2>Sobre este proyecto</h2><p>Este proyecto consiste en una propuesta arquitectónica de un edificio de uso mixto, que combina locales comerciales en planta baja con departamentos en los niveles superiores. Su diseño busca aprovechar los espacios de manera eficiente, integrando las actividades comerciales y residenciales en un mismo edificio.</p><p>El proyecto nació como nuestro Trabajo Práctico Integrador (TPI), correspondiente al último año de la formación de Maestro Mayor de Obras. Comenzamos desde cero, desarrollando la idea inicial, la distribución de los espacios, el diseño arquitectónico, la estructura y las distintas instalaciones, hasta llegar a la elaboración de los planos técnicos y el modelado tridimensional.</p><p>Desde el principio, nuestro objetivo fue ir más allá de lo estético. Buscamos desarrollar un edificio que no solo tuviera una buena apariencia, sino que también fuera <strong>funcional, seguro y realmente posible de construir</strong>, teniendo en cuenta las condiciones climáticas, los sistemas constructivos y las particularidades de Tierra del Fuego.</p><p>Este trabajo nos permitió aplicar los conocimientos adquiridos durante nuestra formación, pero también aprender muchas cosas que solo pudimos comprender al enfrentarnos a un proyecto de esta magnitud. A medida que avanzábamos, fuimos descubriendo nuevas posibilidades, identificando aspectos que podríamos mejorar y entendiendo cómo distintas decisiones influyen tanto en la estética como en la funcionalidad del edificio.</p><p>Más allá del resultado final, nos llevamos una experiencia que nos permitió desarrollar una mirada más crítica y completa sobre la arquitectura y la construcción. Hoy sabemos que hay muchas cosas que haríamos de otra manera, y justamente ese aprendizaje es el que nos permitirá afrontar futuros proyectos con más conocimientos, experiencia y mejores resultados.</p><p class=\"about-contact\"><strong>Alumnos</strong><br>Lucca Pérez Tenorio<br>Christian tomas Agustin Alonso Astorga · <a href=\"mailto:tomas1802aa@gmail.com\">tomas1802aa@gmail.com</a></p>";$('info').showModal();}});
window.addEventListener('hashchange',()=>{if(location.hash==='#home'){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());route('home');}});
window.addEventListener('resize',()=>{positionLabels();if(state==='home'||state==='exterior')setView(view);});new ResizeObserver(positionLabels).observe($('floorStage'));window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(state==='exterior'&&!$('app').classList.contains('entering')&&!$('app').classList.contains('ascending')){if(e.key==='ArrowLeft')setView(desiredView-1,true);if(e.key==='ArrowRight')setView(desiredView+1,true);}});

const floorOutlines={
 high:'756,17 914,17 914,77 1274,77 1274,137 1537,137 1542,356 1524,356 1524,526 1555,526 1562,769 1300,769 1300,850 912,850 912,788 754,788 754,850 370,850 370,769 106,769 117,525 145,525 145,356 128,356 136,136 380,136 380,77 756,77',
 ground:'878,17 1038,17 1038,122 1402,122 1402,179 1662,179 1662,403 1633,403 1633,537 1663,537 1663,748 1403,748 1403,804 1027,804 1027,738 897,738 897,804 500,804 500,748 258,748 258,571 24,571 24,368 255,368 255,179 509,179 509,123 878,123'
};
for(const src of ['assets/floor-high.png','assets/floor-ground.png']){const img=new Image();img.src=src;img.decode().catch(()=>{});}
setView(0);const hash=location.hash.slice(1);if(hash.startsWith('unidad-')){const id=hash.slice(7);floor=id.startsWith('PB-')?0:parseInt(id);floor=Number.isFinite(floor)&&floor>=0&&floor<=4?floor:4;hovered=id.startsWith('PB-')?Math.max(0,Math.min(1,parseInt(id.at(-1))-1)):Math.max(0,high.findIndex(u=>u.letter===id.at(-1)));show('exteriorStage',false);show('welcome',false);show('back',true);show('context',true);openDetails();}else route(hash==='location'?'map':['floors','exterior','map'].includes(hash)?hash:'home');

function renderUnitPlan(){
 const u=units()[selected],xs=u.points.map(p=>p[0]),ys=u.points.map(p=>p[1]),pad=30;
 const x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)-x+pad,h=Math.max(...ys)-y+pad,groundFloor=floor===0;
 $('renderPanel').innerHTML=`<svg xmlns="${NS}" role="img" aria-label="Plano 3D de ${unitTitle(selected)}" viewBox="${x} ${y} ${w} ${h}"><defs><mask id="unitRenderMask" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><polygon points="${u.points.map(p=>p.join(',')).join(' ')}" fill="white" stroke="white" stroke-width="24" stroke-linejoin="round"/></mask></defs><image mask="url(#unitRenderMask)" href="${planSource()}" width="1536" height="1024"/></svg>`;
}
function applyMedia(){setView(view);for(const pair of project.media?.exterior||[])for(const src of Object.values(pair)){const image=new Image();image.src=src;}const plan=new Image();plan.src=planSource();}
function updateFloorBackground(){
 const source=project.media?.floorPlans?.[floor]?null:project.media?.floorBackgrounds?.[floor];
 const backdrop=$('floorBackdrop'),previous=backdrop.style.backgroundImage,next=source?`url(${JSON.stringify(source)})`:'none';backdrop.replaceChildren();backdrop.style.backgroundImage=next;if(previous&&previous!=='none'&&previous!==next){const fade=document.createElement('div');Object.assign(fade.style,{position:'absolute',inset:'0',backgroundImage:previous,backgroundSize:'cover',backgroundPosition:'center'});backdrop.appendChild(fade);fade.animate([{opacity:1},{opacity:0}],{duration:650,fill:'forwards'}).onfinish=()=>fade.remove();}
 // Per-floor images must be aligned to the same plan camera before publication.
 $('floorBackdrop').dataset.hasImage=Boolean(source);
}



function planSource(){return floor===0?'assets/plans-20261116-v2/planta-baja.png':'assets/plans-20261116-v2/planta-tipo.png';}

function alignTerrain(){
 const matrix=$('plan').getScreenCTM();if(!matrix)return;
 const bg=$('floorBackdrop'),levelScale=floor===0?2.086:1.962,scale=matrix.a*levelScale;
 if(innerWidth<=700){const k=innerHeight/1024*(1.08-floor*.012);bg.style.backgroundSize=(1536*k)+'px '+(1024*k)+'px';bg.style.backgroundPosition=(innerWidth/2-800*k)+'px '+((innerHeight-1024*k)/2)+'px';return;}
 const content=$('floorContent').getScreenCTM();if(!content)return;
 const left=content.e+(floor===0?230:200)*content.a;
 const front=content.f+(floor===0?928:933)*content.d;
 bg.style.backgroundSize=(1536*scale)+'px '+(1024*scale)+'px';
 bg.style.backgroundPosition=(left-467*scale)+'px '+(front-772*scale)+'px';
}
