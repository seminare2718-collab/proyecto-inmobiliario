// Columns follow the side walls, front corners and stair tower in each render.
// Each vertical line records its x, roof height and pavement height.
const marks = {
 wide: [
  [[0,125,280],[187,124,275],[191,124,275],[301,122,275],[414,124,275],[418,124,275],[600,125,280]],
  [[0,112,216],[192,117,219],[197,118,222],[248,129,253],[322,141,291],[378,119,257],[600,124,260]],
  [[0,122,225],[227,121,228],[270,143,260],[337,131,238],[391,119,218],[395,118,217],[600,121,215]]
 ],
 tall: [
  [[0,230,361],[57,231,357],[61,232,357],[150,230,357],[238,232,357],[242,231,357],[300,230,361]],
  [[0,218,308],[69,224,316],[73,225,318],[116,236,346],[179,246,374],[224,229,350],[300,227,345]],
  [[0,223,325],[80,225,326],[117,246,354],[181,232,333],[229,224,314],[232,224,313],[300,225,312]]
 ]
};

function grid(photo,view,w,h){
 const tall=photo.naturalHeight>photo.naturalWidth;
 const width=tall?300:600,height=tall?533:338,scale=Math.max(w/width,h/height);
 return [0,1,2,3].flatMap(row=>marks[tall?'tall':'wide'][view].map(([x,roof,base])=>{
  const y=[0,roof,base,height][row];
  return {x:(w-width*scale)/2+x*scale,y:(h-height*scale)/2+y*scale,
    u:x*photo.naturalWidth/width,v:y*photo.naturalHeight/height};
 }));
}

function triangle(ctx,img,src,dst,indices){
 const [a,b,c]=indices.map(i=>src[i]),[p,q,r]=indices.map(i=>dst[i]);
 const u=b.u-a.u,v=b.v-a.v,U=c.u-a.u,V=c.v-a.v,det=u*V-v*U;
 const x=q.x-p.x,y=q.y-p.y,X=r.x-p.x,Y=r.y-p.y;
 const m=(x*V-X*v)/det,n=(y*V-Y*v)/det,o=(X*u-x*U)/det,s=(Y*u-y*U)/det;
 ctx.save();ctx.beginPath();
 const cx=(p.x+q.x+r.x)/3,cy=(p.y+q.y+r.y)/3;
 for(const [index,point] of [p,q,r].entries()){
  const dx=point.x-cx,dy=point.y-cy,k=.8/(Math.hypot(dx,dy)||1);
  ctx[index?'lineTo':'moveTo'](point.x+dx*k,point.y+dy*k);
 }
 ctx.closePath();ctx.clip();ctx.setTransform(m,n,o,s,p.x-m*a.u-o*a.v,p.y-n*a.u-s*a.v);
 ctx.drawImage(img,0,0);ctx.restore();
}

export async function interpolateFacades(layer,from,to,start,end,duration,active){
 const canvas=document.createElement('canvas');
 const ratio=Math.min(1,1440/layer.clientWidth,960/layer.clientHeight);
 const w=canvas.width=Math.max(1,Math.round(layer.clientWidth*ratio));
 const h=canvas.height=Math.max(1,Math.round(layer.clientHeight*ratio));
 const previous=grid(from,start,w,h),next=grid(to,end,w,h);
 const buffer=document.createElement('canvas');buffer.width=w;buffer.height=h;
 const ctx=canvas.getContext('2d'),surface=buffer.getContext('2d');
 const faces=[];
 for(let row=0;row<3;row++)for(let col=0;col<6;col++){
  const i=row*7+col;faces.push([i,i+1,i+8],[i,i+8,i+7]);
 }
 layer.replaceChildren(canvas);
 const begin=performance.now();
 await new Promise(resolve=>{
  function render(now){
   if(!active())return resolve();
   const progress=Math.min(1,Math.max(0,(now-begin)/duration)),t=progress*progress*(3-2*progress);
   const dst=previous.map((p,i)=>({x:p.x+(next[i].x-p.x)*t,y:p.y+(next[i].y-p.y)*t}));
   for(const ids of faces)triangle(ctx,from,previous,dst,ids);
   if(t>0){
    for(const ids of faces)triangle(surface,to,next,dst,ids);
    ctx.globalAlpha=t;ctx.drawImage(buffer,0,0);ctx.globalAlpha=1;
   }
   if(progress===1)resolve();else requestAnimationFrame(render);
  }
  render(begin);
 });
}
