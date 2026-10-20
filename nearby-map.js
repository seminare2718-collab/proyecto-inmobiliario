const categories = { all: 'Todos', compras: 'Compras', gastronomia: 'Gastronomía', salud: 'Salud', educacion: 'Educación', paseos: 'Paseos', servicios: 'Servicios' };
const kindLabels = { supermarket:'supermercado almacén', convenience:'almacén kiosco', pharmacy:'farmacia', restaurant:'restaurante comida', cafe:'café cafetería', fast_food:'comida rápida', bar:'bar bebidas', bakery:'panadería', hospital:'hospital', school:'escuela colegio', university:'universidad', bank:'banco', atm:'cajero banco', clothes:'ropa indumentaria', furniture:'muebles', museum:'museo', park:'parque plaza', car:'autos concesionaria', car_repair:'taller autos', bicycle:'bicicletas', hairdresser:'peluquería', hardware:'ferretería', electronics:'electrónica', shoes:'zapatos calzado' };
const placeTypes = {
  supermarket:'Supermercado', convenience:'Almacén / kiosco', pharmacy:'Farmacia',
  restaurant:'Restaurante', cafe:'Cafetería', fast_food:'Comida rápida', bar:'Bar', pub:'Bar',
  ice_cream:'Heladería', bakery:'Panadería', confectionery:'Tienda de dulces', chocolate:'Chocolatería', deli:'Alimentos preparados',
  museum:'Museo', park:'Parque / espacio verde', playground:'Juegos infantiles', attraction:'Lugar de interés', viewpoint:'Mirador', gallery:'Galería de arte',
  hospital:'Hospital', clinic:'Clínica', doctors:'Consultorio médico', dentist:'Odontología', veterinary:'Veterinaria', chemist:'Droguería', medical_supply:'Insumos médicos',
  school:'Escuela / colegio', kindergarten:'Jardín de infantes', university:'Universidad', college:'Institución educativa', library:'Biblioteca',
  clothes:'Tienda de ropa', furniture:'Mueblería', fashion_accessories:'Accesorios de moda', shoes:'Zapatería', bed:'Colchones y camas',
  electronics:'Electrónica', computer:'Informática', mobile_phone:'Telefonía', gift:'Regalería', jewelry:'Joyería',
  books:'Librería', stationery:'Librería / papelería', hardware:'Ferretería', paint:'Pinturería', houseware:'Artículos para el hogar',
  car:'Concesionaria de autos', car_repair:'Taller de autos', car_parts:'Repuestos de autos', bicycle:'Bicicletería', fuel:'Estación de servicio',
  bank:'Banco', atm:'Cajero automático', post_office:'Correo', community_centre:'Centro comunitario', townhall:'Municipalidad', police:'Policía',
  travel_agency:'Agencia de viajes', mall:'Centro comercial', beauty:'Estética / belleza', optician:'Óptica', health_food:'Alimentos saludables', hairdresser:'Peluquería', hairdresser_supply:'Insumos de peluquería',
  sports:'Artículos deportivos', sports_centre:'Centro deportivo', stadium:'Estadio', fitness_centre:'Gimnasio', trade:'Comercio especializado'
};
function placeType(place) {
  return place.kind === 'park' && /^plaza\b/i.test(place.name) ? 'Plaza' : placeTypes[place.kind] || categories[place.category] || 'Lugar del mapa';
}
function placeCard(place) {
  const card = el('div', null, 'nearby-place-card');
  card.append(el('strong', place.name), el('span', [placeType(place), categories[place.category]].filter((v,i,a) => v && a.indexOf(v) === i).join(' · '), 'nearby-place-type'));
  if (place.address) card.append(el('small', place.address));
  return card;
}
const modes = { walking: { label: 'A pie', profile: 'foot', icon: '↟' }, driving: { label: 'En auto', profile: 'car', icon: '↗' }, bicycling: { label: 'En bici', profile: 'bike', icon: '◉' } };
let instance, leafletPromise, lastRequest = 0, routeQueue = Promise.resolve();
const routeCache = new Map();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) leafletPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'assets/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => { script.remove(); leafletPromise = null; reject(new Error('Mapa no disponible')); };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function googleDirections(origin, place, mode) {
  const query = new URLSearchParams({ api: '1', origin: `${origin.routeLat},${origin.routeLng}`, destination: `${place.lat},${place.lng}`, travelmode: mode });
  return 'https://www.google.com/maps/dir/?' + query;
}

async function pacedRoute(url, signal) {
  const response = routeQueue.catch(() => {}).then(async () => {
    if (signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    await delay(Math.max(0, 1100 - (Date.now() - lastRequest)));
    if (signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    lastRequest = Date.now();
    const result = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) });
    if (!result.ok) throw new Error('Ruta no disponible');
    const data = await result.json(), route = data.routes?.[0];
    if (data.code !== 'Ok' || !route || !Number.isFinite(route.duration) || !Number.isFinite(route.distance) || !route.geometry?.coordinates?.length) throw new Error('Sin recorrido');
    return route;
  });
  routeQueue = response.catch(() => {});
  return response;
}

class NearbyMap {
  constructor(root) {
    this.root = root;
    this.category = 'all';
    this.mode = 'walking';
    this.limit = 20;
    this.token = 0;
    this.searchToken = 0;
    this.markers = new Map();
    root.innerHTML = `<div class="nearby-heading"><div><p class="eyebrow">UBICACIÓN Y CERCANÍA</p><h2>Todo, cerca del proyecto.</h2><p id="nearbyLocation" class="nearby-location"></p></div><p>Pasá el cursor por un lugar o tocá para explorarlo.</p></div>
      <div class="nearby-layout"><aside class="nearby-sidebar"><form id="nearbySearch"><label for="nearbyQuery">¿Qué estás buscando?</label><div class="nearby-search-row"><input id="nearbyQuery" type="search" autocomplete="off" placeholder="Un café, una farmacia, un negocio…"><button type="submit">Buscar</button></div></form>
      <div id="nearbyCategories" class="nearby-categories" aria-label="Tipo de lugar"></div><p id="nearbyMessage" role="status" class="nearby-message"></p>
      <section id="nearbySelection" class="nearby-selection" aria-label="Recorridos al lugar elegido" hidden><span class="eyebrow">DESDE EL PROYECTO</span><h3 id="nearbyName"></h3><p id="nearbyAddress"></p><div id="nearbyModes" class="nearby-modes"></div><p id="nearbyRouteSummary" aria-live="polite"></p><a id="nearbyGoogle" target="_blank" rel="noopener">Abrir recorrido en Google Maps ↗</a><small>Tiempos estimados, sin tráfico en vivo.</small></section>
      <div id="nearbyList" class="nearby-list" aria-label="Lugares cercanos"></div><button id="nearbyMore" class="nearby-more" hidden>Mostrar más lugares</button><a id="nearbyGoogleSearch" target="_blank" rel="noopener" class="nearby-external">Buscar más lugares en Google Maps ↗</a></aside>
      <div class="nearby-map-wrap"><div id="nearbyMap" aria-label="Mapa de lugares cercanos al proyecto"></div><button id="nearbyHome" type="button">⌖ Volver al proyecto</button></div></div>`;
    this.get = id => root.querySelector('#' + id);
    for (const [id, name] of Object.entries(categories)) {
      const button = el('button', name);
      button.type = 'button'; button.dataset.category = id; button.setAttribute('aria-pressed', id === this.category);
      button.onclick = () => { this.category = id; this.limit = 20; this.searchResults = null; this.searchToken++; this.renderPlaces(); };
      this.get('nearbyCategories').appendChild(button);
    }
    for (const [mode, info] of Object.entries(modes)) {
      const button = el('button'); button.type = 'button'; button.dataset.mode = mode;
      button.append(el('span', `${info.icon} ${info.label}`), el('strong', '—'));
      button.setAttribute('aria-pressed', mode === this.mode);
      button.onclick = () => { this.mode = mode; this.renderRoute(); };
      this.get('nearbyModes').appendChild(button);
    }
    this.get('nearbyQuery').addEventListener('input', () => { this.limit = 20; this.searchResults = null; this.searchToken++; this.renderPlaces(); });
    this.get('nearbySearch').onsubmit = event => { event.preventDefault(); this.search(); };
    this.get('nearbyMore').onclick = () => { this.limit += 20; this.renderPlaces(); };
    this.get('nearbyHome').onclick = () => this.map?.setView([this.data.origin.lat, this.data.origin.lng], 16);
  }

  async open(url) {
    this.active = true;
    try {
      if (!this.initializing) this.initializing = this.initialize(url).catch(error => { this.initializing = null; throw error; });
      await this.initializing;
      if (this.active) {
        requestAnimationFrame(() => this.map.invalidateSize());
        if (this.selected && this.controller?.signal.aborted) this.select(this.selected);
      }
    } catch (error) {
      console.warn(error);
      this.get('nearbyMessage').textContent = 'No se pudo cargar el mapa. Intentá abrirlo nuevamente.';
    }
  }

  async initialize(url) {
    const [L, response] = await Promise.all([loadLeaflet(), fetch(url)]);
    if (!response.ok) throw new Error('Lugares no disponibles');
    this.data = await response.json();
    this.get('nearbyLocation').textContent = this.data.origin.address;
    this.map = L.map(this.get('nearbyMap'), { zoomControl: false, scrollWheelZoom: true }).setView([this.data.origin.lat, this.data.origin.lng], 16);
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(this.map);
    this.map.attributionControl.addAttribution('Rutas: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">OSRM / FOSSGIS</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Corregir el mapa</a>');
    const origin = L.divIcon({ className: 'nearby-project-marker', html: '<span>S</span>', iconSize: [36, 36], iconAnchor: [18, 18] });
    const label = el('div'); label.append(el('strong', 'Proyecto Inmobiliario'), el('p', this.data.origin.address));
    const locationLink = el('a', 'Ver ubicación en Google Maps ↗');
    locationLink.href = 'https://www.google.com/maps/search/?' + new URLSearchParams({ api:'1', query:`${this.data.origin.lat},${this.data.origin.lng}` });
    locationLink.target = '_blank'; locationLink.rel = 'noopener'; label.appendChild(locationLink);
    const locationTooltip = el('div', null, 'nearby-place-card');
    locationTooltip.append(el('strong', 'Ubicación del proyecto'), el('span', this.data.origin.address, 'nearby-place-type'));
    L.marker([this.data.origin.lat, this.data.origin.lng], { icon: origin, zIndexOffset: 1000, title: 'Proyecto Inmobiliario' }).bindPopup(label).bindTooltip(locationTooltip, { direction:'top', offset:[0,-16], className:'nearby-place-tooltip', opacity:1 }).addTo(this.map);
    this.poiLayer = L.layerGroup().addTo(this.map);
    this.renderPlaces();
  }

  matches() {
    if (!this.data) return [];
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = normalize(this.get('nearbyQuery').value.trim());
    return (this.searchResults || this.data.places).filter(p => (this.searchResults || this.category === 'all' || p.category === this.category) && (this.searchResults || !query || normalize(`${p.name} ${categories[p.category] || ''} ${placeType(p)} ${kindLabels[p.kind] || ''} ${p.address || ''} ${p.category==='compras'?'negocios comercios':''}`).includes(query)));
  }

  renderPlaces() {
    if (!this.data) return;
    for (const b of this.get('nearbyCategories').children) b.setAttribute('aria-pressed', b.dataset.category === this.category);
    const places = this.matches();
    this.get('nearbyMessage').textContent = places.length ? `${places.length} lugares cercanos · Distancias de la lista en línea recta` : 'No encontramos ese lugar en la lista. Tocá Buscar para ampliar la búsqueda.';
    const query = this.get('nearbyQuery').value.trim() || (this.category === 'all' ? 'negocios' : categories[this.category]);
    this.get('nearbyGoogleSearch').href = 'https://www.google.com/maps/search/?' + new URLSearchParams({ api: '1', query: `${query} cerca de ${this.data.origin.lat},${this.data.origin.lng}, Río Grande Argentina` });
    this.get('nearbyList').replaceChildren();
    this.renderMarkers(places);
    for (const p of places.slice(0, this.limit)) {
      const button = el('button', null, 'nearby-place'); button.type = 'button'; button.dataset.place = p.id;
      const copy = el('span'); copy.append(el('strong', p.name), el('small', [placeType(p), p.address].filter(Boolean).join(' · ')));
      const distance = Number.isFinite(p.distance) ? p.distance < 1000 ? `${p.distance} m` : `${(p.distance / 1000).toFixed(1).replace('.', ',')} km` : 'Ver ruta';
      button.append(copy, el('span', distance, 'nearby-distance')); button.onclick = () => this.select(p);
      if (p.id === this.selected?.id) button.classList.add('selected');
      this.get('nearbyList').appendChild(button);
    }
    this.get('nearbyMore').hidden = places.length <= this.limit;
  }

  markerStyle(place, emphasized = false) {
    const chosen = place.id === this.selected?.id;
    return { radius:chosen || emphasized ? 9 : 5.5, color:'#fff', weight:2, fillColor:chosen || emphasized ? '#b89b5e' : '#353535', fillOpacity:.95 };
  }

  renderMarkers(places) {
    const ids = new Set(places.map(p => p.id));
    for (const [id, marker] of this.markers) {
      if (!ids.has(id)) { this.poiLayer.removeLayer(marker); this.markers.delete(id); }
    }
    for (const place of places) {
      let marker = this.markers.get(place.id);
      if (!marker) {
        marker = window.L.circleMarker([place.lat, place.lng], this.markerStyle(place))
          .bindTooltip(placeCard(place), { direction:'top', offset:[0,-9], className:'nearby-place-tooltip', opacity:1 })
          .bindPopup(placeCard(place), { className:'nearby-place-popup', maxWidth:270 })
          .addTo(this.poiLayer);
        marker.on('click', () => this.select(place));
        marker.on('popupopen', () => marker.closeTooltip());
        marker.on('mouseover', () => marker.setStyle(this.markerStyle(place, true)));
        marker.on('mouseout', () => marker.setStyle(this.markerStyle(place)));
        const target = marker.getElement();
        target.setAttribute('tabindex', '0'); target.setAttribute('role', 'button');
        target.setAttribute('aria-label', `${place.name} · ${placeType(place)}`);
        target.dataset.place = place.id;
        target.addEventListener('focus', () => { if (!marker.isPopupOpen()) marker.openTooltip(); marker.setStyle(this.markerStyle(place, true)); });
        target.addEventListener('blur', () => { marker.closeTooltip(); marker.setStyle(this.markerStyle(place)); });
        target.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); marker.openPopup(); this.select(place); }
        });
        this.markers.set(place.id, marker);
      } else marker.setStyle(this.markerStyle(place));
    }
  }

  async select(place) {
    this.controller?.abort(); this.controller = new AbortController(); const token = ++this.token;
    this.selected = place; this.routes = {}; this.errors = {};
    this.get('nearbySelection').hidden = false;
    this.get('nearbyName').textContent = place.name;
    this.get('nearbyAddress').textContent = [placeType(place), place.address].filter(Boolean).join(' · ');
    this.renderPlaces(); this.renderRoute();
    const origin = this.data.origin;
    this.map.fitBounds([[origin.lat, origin.lng], [place.lat, place.lng]], { padding: [45, 45], maxZoom: 17 });
    for (const [mode, info] of Object.entries(modes)) {
      if (token !== this.token || this.controller.signal.aborted) break;
      const key = `${place.lat},${place.lng}/${mode}`;
      try {
        let route = routeCache.get(key);
        if (!route) {
          const coords = `${origin.routeLng},${origin.routeLat};${place.lng},${place.lat}`;
          const url = `https://routing.openstreetmap.de/routed-${info.profile}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
          route = await pacedRoute(url, this.controller.signal); routeCache.set(key, route);
        }
        if (token !== this.token) return;
        this.routes[mode] = route;
      } catch (error) {
        if (token !== this.token || this.controller.signal.aborted) return;
        this.errors[mode] = true;
      }
      this.renderRoute();
    }
  }

  renderRoute() {
    if (!this.selected) return;
    for (const b of this.get('nearbyModes').children) {
      const mode = b.dataset.mode, route = this.routes[mode];
      b.setAttribute('aria-pressed', mode === this.mode);
      b.querySelector('strong').textContent = route ? `${Math.max(1, Math.round(route.duration / 60))} min` : this.errors[mode] ? 'Consultar' : '…';
    }
    const route = this.routes[this.mode];
    this.get('nearbyGoogle').href = googleDirections(this.data.origin, this.selected, this.mode);
    if (this.routeLine) { this.routeLine.remove(); this.routeLine = null; }
    if (route) {
      this.routeLine = window.L.geoJSON(route.geometry, { style: { color: '#252525', weight: 5, opacity: .85 } }).addTo(this.map);
      const distance = route.distance < 1000 ? `${Math.round(route.distance)} m` : `${(route.distance / 1000).toFixed(1).replace('.', ',')} km`;
      this.get('nearbyRouteSummary').textContent = `${distance} de recorrido · ${modes[this.mode].label}`;
    } else this.get('nearbyRouteSummary').textContent = this.errors[this.mode] ? 'El tiempo no está disponible ahora. Consultá el recorrido en Google Maps.' : 'Calculando el recorrido…';
  }

  async search() {
    const query = this.get('nearbyQuery').value.trim();
    if (query.length < 3) { this.renderPlaces(); return; }
    const matches = this.matches();
    if (matches.length && !this.searchResults) { this.select(matches[0]); return; }
    const now = Date.now();
    if (now - (this.lastSearch || 0) < 1200) return;
    this.lastSearch = now; const token = ++this.searchToken;
    this.get('nearbyMessage').textContent = 'Buscando lugares en Río Grande…';
    try {
      const { lat, lng } = this.data.origin;
      const params = new URLSearchParams({ format: 'jsonv2', limit: '6', q: `${query}, Río Grande, Tierra del Fuego, Argentina`, viewbox: `${lng - .06},${lat + .04},${lng + .06},${lat - .04}`, bounded: '1' });
      const r = await fetch('https://nominatim.openstreetmap.org/search?' + params, { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error('Búsqueda no disponible');
      const results = await r.json();
      if (token !== this.searchToken) return;
      this.searchResults = results.map(p => {
        const kind = p.type, group = p.category || p.class;
        const category = ['restaurant','cafe','fast_food','bar','pub','ice_cream','food_court'].includes(kind) ? 'gastronomia'
          : ['pharmacy','hospital','clinic','doctors','dentist','veterinary'].includes(kind) ? 'salud'
          : ['school','college','university','kindergarten','library'].includes(kind) ? 'educacion'
          : ['park','playground','museum','attraction','viewpoint','gallery','sports_centre','stadium','fitness_centre'].includes(kind) ? 'paseos'
          : group === 'shop' ? 'compras' : ['bank','atm','post_office','townhall','police','courthouse','community_centre','fuel'].includes(kind) ? 'servicios' : 'other';
        return { id:`search-${p.place_id}`, name:p.name || p.display_name.split(',')[0], address:p.display_name.split(',').slice(1,3).join(',').trim(), lat:Number(p.lat), lng:Number(p.lon), kind, category };
      }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      this.renderPlaces();
    } catch (error) {
      if (token !== this.searchToken) return;
      this.get('nearbyMessage').textContent = 'La búsqueda ampliada no está disponible. Podés buscar ese lugar en Google Maps con el enlace de abajo.';
    }
  }

  close() { this.active = false; this.controller?.abort(); this.token++; this.searchToken++; }
}

export async function openMaps(root, url) { if (!instance) instance = new NearbyMap(root); await instance.open(url); }
export function closeMaps() { instance?.close(); }
