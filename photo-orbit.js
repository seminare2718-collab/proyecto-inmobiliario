import * as THREE from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';

// Yaw, elevation, distance, focal length and principal point fitted to each
// render using the eaves and street-level corners of the SketchUp model.
const cameras = {
  wide:[[-.0188,.1863,87.4332,767.6881,302.0095,189.378],
        [.7868,.2813,43.39,303.9615,283.7839,184.7234],
        [-.6564,.3173,66.8844,414.3897,310.0436,173.7212]],
  tall:[[-.0048,.1771,95.8222,684.3697,150.7965,286.2998],
        [.8026,.2911,44.5315,268.283,146.9175,283.1843],
        [-.6401,.3075,67.1746,384.2496,155.5167,275.0831]]
};
const target = new THREE.Vector3(15.875,9.3,-8.15);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
let renderer, ready;
const textureCache = new Map();
const uniforms = {
  sourceA:{value:null},sourceB:{value:null},
  cameraA:{value:new THREE.Matrix4()},cameraB:{value:new THREE.Matrix4()},travel:{value:0},
  eyeA:{value:new THREE.Vector3()},eyeB:{value:new THREE.Vector3()},
  boundsA:{value:new THREE.Vector4()},boundsB:{value:new THREE.Vector4()},boundsNow:{value:new THREE.Vector4()},
  crop:{value:new THREE.Vector2()}
};
// The street and sky belong to the photographs. Keep them on a separate
// plate so pixels hidden behind the building never project onto distant sky.
const environment = new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({
  uniforms,depthTest:false,depthWrite:false,
  vertexShader:`varying vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`uniform sampler2D sourceA,sourceB;uniform vec4 boundsA,boundsB,boundsNow;
  uniform vec2 crop;uniform float travel;varying vec2 screenUV;
  float remap(float u,float lo,float hi,float a,float b){
    if(u<lo)return u*a/lo;
    if(u>hi)return b+(u-hi)*(1.-b)/(1.-hi);
    return mix(a,b,(u-lo)/(hi-lo));
  }
  vec2 sampleAt(vec2 p,vec4 bounds){
    return vec2(remap(p.x,boundsNow.x,boundsNow.z,bounds.x,bounds.z),
                remap(p.y,boundsNow.y,boundsNow.w,bounds.y,bounds.w));
  }
  void main(){vec2 p=(screenUV-.5)*crop+.5;
    float t=smoothstep(.425,.575,travel+.075*(p.x-.5));
    gl_FragColor=mix(texture2D(sourceA,sampleAt(p,boundsA)),texture2D(sourceB,sampleAt(p,boundsB)),t);}`
}));
environment.renderOrder=-1;environment.frustumCulled=false;scene.add(environment);
const material = new THREE.ShaderMaterial({
  uniforms, side:THREE.DoubleSide,
  vertexShader:`uniform mat4 cameraA,cameraB;
    varying vec4 atA,atB;varying vec3 point;
    void main(){vec4 world=modelMatrix*vec4(position,1.);
      point=world.xyz;atA=cameraA*world;atB=cameraB*world;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`uniform sampler2D sourceA,sourceB;uniform float travel;
    uniform vec3 eyeA,eyeB;varying vec4 atA,atB;varying vec3 point;
    float inFrame(vec4 clip,vec2 uv){
      vec2 border=min(uv,1.-uv);
      return step(0.,clip.w)*smoothstep(-.04,.025,min(border.x,border.y));}
    void main(){vec2 a=.5+.5*atA.xy/atA.w,b=.5+.5*atB.xy/atB.w;
      float t=smoothstep(.12,.88,travel);
      vec3 normal=normalize(cross(dFdx(point),dFdy(point)));
      float facingA=max(.005,dot(normal,normalize(eyeA-point)));
      float facingB=max(.005,dot(normal,normalize(eyeB-point)));
      float wa=(1.-t)*inFrame(atA,a)*facingA*facingA,wb=t*inFrame(atB,b)*facingB*facingB;
      float weight=(wa+wb>.001)?wb/(wa+wb):t;
      gl_FragColor=mix(texture2D(sourceA,a),texture2D(sourceB,b),weight);}`
});

async function loadScene(){
  const model = await new GLTFLoader().loadAsync('assets/building.glb');
  model.scene.updateMatrixWorld(true);
  // Bake the original SketchUp groups into one draw call. Only positions
  // are needed because the approved exterior renders provide the materials.
  const positions=[],indices=[];
  const vertex=new THREE.Vector3();
  model.scene.traverse(object=>{
    if(!object.isMesh)return;
    const geometry=object.geometry,points=geometry.attributes.position,base=positions.length/3;
    for(let i=0;i<points.count;i++){
      vertex.fromBufferAttribute(points,i).applyMatrix4(object.matrixWorld);
      positions.push(vertex.x,vertex.y,vertex.z);
    }
    const index=geometry.index;
    for(let i=0;i<(index?.count??points.count);i++)indices.push(base+(index?index.getX(i):i));
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
  scene.add(new THREE.Mesh(geometry,material));
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.domElement.className='model-orbit';
}
export function prepareOrbit(){
  if(!ready)ready=loadScene().catch(error=>{ready=null;throw error;});
  return ready;
}
function texture(image){
  if(textureCache.has(image.src)){
    const cached=textureCache.get(image.src);
    textureCache.delete(image.src);textureCache.set(image.src,cached);
    return cached;
  }
  if(!textureCache.has(image.src)){
    const result=new THREE.Texture(image);result.needsUpdate=true;
    result.wrapS=THREE.MirroredRepeatWrapping;result.wrapT=THREE.MirroredRepeatWrapping;
    result.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    textureCache.set(image.src,result);
    if(textureCache.size>4){
      const oldest=textureCache.keys().next().value;
      textureCache.get(oldest).dispose();textureCache.delete(oldest);
    }
  }
  return textureCache.get(image.src);
}
function place(pose,rw,rh,width,height){
  const [yaw,pitch,radius,focal,x,y]=pose,scale=Math.max(width/rw,height/rh);
  camera.position.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch))
    .multiplyScalar(radius).add(target);camera.lookAt(target);camera.updateMatrixWorld();
  const near=.15, pixel=near/(focal*scale);
  const cx=(width-rw*scale)/2+x*scale,cy=(height-rh*scale)/2+y*scale;
  camera.projectionMatrix.makePerspective(-cx*pixel,(width-cx)*pixel,cy*pixel,(cy-height)*pixel,near,3000);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
export async function modelOrbit(layer,from,to,start,end,duration,active){
  await prepareOrbit();
  if(!active())return;
  const tall=from.naturalHeight>from.naturalWidth,rw=tall?300:600,rh=tall?533:338;
  const poses=cameras[tall?'tall':'wide'],a=poses[start],b=poses[end];
  const w=layer.clientWidth,h=layer.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2,2880/Math.max(w,h)));
  renderer.setSize(w,h,false);
  const corner=new THREE.Vector3();
  function bounds(out){
    out.set(1,1,0,0);
    for(const x of [4.2,27.55])for(const y of [1,17.6])for(const z of [-1.7,-14.6]){
      corner.set(x,y,z).project(camera).multiplyScalar(.5).addScalar(.5);
      out.x=Math.min(out.x,corner.x);out.y=Math.min(out.y,corner.y);
      out.z=Math.max(out.z,corner.x);out.w=Math.max(out.w,corner.y);
    }
  }
  const scale=Math.max(w/rw,h/rh);uniforms.crop.value.set(w/(rw*scale),h/(rh*scale));
  for(const [suffix,pose] of [['A',a],['B',b]]){
    place(pose,rw,rh,rw,rh);
    uniforms['camera'+suffix].value.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    uniforms['eye'+suffix].value.copy(camera.position);bounds(uniforms['bounds'+suffix].value);
  }
  uniforms.sourceA.value=texture(from);uniforms.sourceB.value=texture(to);
  function draw(t){
    const pose=a.map((value,i)=>THREE.MathUtils.lerp(value,b[i],t));
    // Preserve apparent building size as the camera orbits and changes focal length.
    pose[3]=pose[2]*THREE.MathUtils.lerp(a[3]/a[2],b[3]/b[2],t);
    place(pose,rw,rh,rw,rh);bounds(uniforms.boundsNow.value);
    place(pose,rw,rh,w,h);uniforms.travel.value=t;renderer.render(scene,camera);
  }
  draw(0);
  layer.replaceChildren(renderer.domElement);
  await new Promise(resolve=>{
    let first;
    function frame(time){
      if(!active())return resolve();
      first??=time;
      const t=Math.min(1,(time-first)/duration);
      draw(t*t*(3-2*t));
      if(t<1)requestAnimationFrame(frame);else resolve();
    }
    requestAnimationFrame(frame);
  });
  if(active())layer.replaceChildren(to);
}
