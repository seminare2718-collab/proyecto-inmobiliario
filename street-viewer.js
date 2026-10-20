import * as THREE from 'three';
import { GLTFLoader } from './assets/GLTFLoader.js';

export class StreetViewer {
  constructor(root) {
    this.root = root;
    this.viewport = root.querySelector('#streetViewport');
    this.directions = root.querySelector('#streetDirections');
    this.message = root.querySelector('#streetMessage');
    this.active = false;
    this.yaw = 0;
    this.pitch = 0;
    this.moveStart = null;
    this.frame = null;
    this.unit = 'PB-1';
    this.request = 0;
    this.viewport.tabIndex = 0;
    root.querySelector('#streetReset').onclick = () => this.reset();
    root.querySelector('#streetLookLeft').onclick = () => this.turn(Math.PI / 4);
    root.querySelector('#streetLookRight').onclick = () => this.turn(-Math.PI / 4);
    let drag = null;
    this.viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      drag = { x: e.clientX, y: e.clientY };
      this.viewport.setPointerCapture(e.pointerId);
      this.viewport.focus({ preventScroll: true });
    });
    this.viewport.addEventListener('pointermove', e => {
      if (!drag || !this.active) return;
      this.yaw -= (e.clientX - drag.x) * .004;
      this.pitch = THREE.MathUtils.clamp(this.pitch - (e.clientY - drag.y) * .003, -.65, .8);
      drag = { x: e.clientX, y: e.clientY };
      this.orient();
    });
    const endDrag = () => { drag = null; this.updateDirections(); };
    this.viewport.addEventListener('pointerup', endDrag);
    this.viewport.addEventListener('pointercancel', endDrag);
    this.viewport.addEventListener('keydown', e => {
      if (!this.active || !this.graph) return;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.turn(.22);
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) this.turn(-.22);
      else if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) {
        const backwards = ['ArrowDown', 's', 'S'].includes(e.key);
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).multiplyScalar(backwards ? -1 : 1);
        const p = this.graph.nodes[this.current];
        const ranked = p.neighbors.map(i => ({ i, score: new THREE.Vector3().fromArray(this.graph.nodes[i].position).sub(new THREE.Vector3().fromArray(p.position)).normalize().dot(forward) }));
        ranked.sort((a, b) => b.score - a.score);
        if (ranked[0]) this.move(ranked[0].i);
      } else return;
      e.preventDefault();
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.viewport);
  }

  async open(unit) {
    this.unit = unit;
    this.active = true;
    this.message.hidden = false;
    this.message.textContent = 'Cargando el recorrido del proyecto…';
    try {
      if (!this.loading) this.loading = this.load().catch(error => { this.loading = null; throw error; });
      await this.loading;
      if (!this.active) return;
      this.reset();
      this.resize();
      this.message.hidden = true;
      this.start();
    } catch (error) {
      console.warn('Recorrido no disponible', error);
      this.message.textContent = 'No se pudo cargar el recorrido. Volvé a elegir Vistas para intentarlo de nuevo.';
    }
  }

  async load() {
    if (!this.renderer) {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.domElement.setAttribute('aria-label', 'Recorrido 3D a nivel de calle con el edificio del proyecto');
      this.viewport.prepend(renderer.domElement);
      this.renderer = renderer;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#bdceda');
      this.scene.fog = new THREE.Fog('#bdceda', 165, 355);
      this.scene.add(new THREE.HemisphereLight('#e5f0ff', '#b5a68b', 2.5));
      const sun = new THREE.DirectionalLight('#fff3dc', 2.2);
      sun.position.set(-55, 100, 75);
      this.scene.add(sun);
      this.camera = new THREE.PerspectiveCamera(72, 1, .12, 12000);
      this.camera.rotation.order = 'YXZ';
    }
    const response = await fetch('assets/street-walk-20261019.json');
    if (!response.ok) throw new Error('No se encontró la navegación');
    const graph = await response.json();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(graph.model, event => {
      if (!this.active || !event.total) return;
      this.message.textContent = `Cargando el recorrido… ${Math.round(event.loaded / event.total * 100)} %`;
    });
    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      object.frustumCulled = true;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material.map) material.map.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      }
    });
    this.scene.add(gltf.scene);
    this.graph = graph;
  }

  reset() {
    if (!this.graph) return;
    const start = this.graph.starts[this.unit] || this.graph.starts['PB-1'];
    this.current = start.node;
    this.camera.position.fromArray(this.graph.nodes[this.current].position);
    const target = new THREE.Vector3().fromArray(start.target).sub(this.camera.position);
    this.yaw = Math.atan2(-target.x, -target.z);
    this.pitch = Math.atan2(target.y, Math.hypot(target.x, target.z));
    this.moveStart = null;
    this.orient();
    this.updateDirections();
  }

  orient() {
    if (this.camera) this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  turn(angle) {
    this.yaw += angle;
    this.orient();
    this.updateDirections();
  }

  move(index) {
    if (!this.graph || this.moveStart || !this.graph.nodes[this.current].neighbors.includes(index)) return;
    this.moveStart = { from: this.camera.position.clone(), to: new THREE.Vector3().fromArray(this.graph.nodes[index].position), time: performance.now(), duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800, index };
    for (const b of this.directions.children) b.disabled = true;
  }

  updateDirections() {
    if (!this.graph || this.moveStart) return;
    this.directions.replaceChildren();
    const p = this.graph.nodes[this.current];
    for (const index of p.neighbors) {
      const q = this.graph.nodes[index].position;
      const yaw = Math.atan2(-(q[0] - p.position[0]), -(q[2] - p.position[2]));
      const difference = Math.atan2(Math.sin(yaw - this.yaw), Math.cos(yaw - this.yaw));
      const forward = Math.abs(difference) < Math.PI / 4;
      const backward = Math.abs(difference) > Math.PI * .75;
      const arrow = forward ? '↑' : backward ? '↓' : difference > 0 ? '←' : '→';
      const label = forward ? 'Seguir' : backward ? 'Regresar' : difference > 0 ? 'Por la izquierda' : 'Por la derecha';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${arrow} ${label}`;
      button.setAttribute('aria-label', label + ' por la calle');
      button.onclick = () => this.move(index);
      this.directions.appendChild(button);
    }
  }

  resize() {
    if (!this.renderer || !this.camera || !this.active) return;
    const width = this.viewport.clientWidth, height = this.viewport.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.frame) return;
    const render = time => {
      this.frame = null;
      if (!this.active) return;
      if (this.moveStart) {
        const move = this.moveStart;
        const t = move.duration === 0 ? 1 : Math.min(1, (time - move.time) / move.duration);
        this.camera.position.lerpVectors(move.from, move.to, t * t * (3 - 2 * t));
        if (t === 1) { this.current = move.index; this.moveStart = null; this.updateDirections(); }
      }
      this.renderer.render(this.scene, this.camera);
      this.frame = requestAnimationFrame(render);
    };
    this.frame = requestAnimationFrame(render);
  }

  setActive(active) {
    this.active = active;
    if (!active) { cancelAnimationFrame(this.frame); this.frame = null; }
    else if (this.graph) { this.resize(); this.start(); }
  }
}
