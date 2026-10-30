const apartments = [
  ['dormitorio-01.webp', 'Dormitorio · vista desde el acceso'],
  ['dormitorio-02.webp', 'Dormitorio · placard'],
  ['dormitorio-03.webp', 'Dormitorio · ventana y calefactor'],
  ['bano-01.webp', 'Baño · ducha'],
  ['bano-02.webp', 'Baño · lavamanos'],
  ['cocina-01.webp', 'Cocina · mesada'],
  ['cocina-02.webp', 'Cocina · vista desde el estar'],
  ['estar-01.webp', 'Estar · hacia el balcón'],
  ['estar-02.webp', 'Estar y comedor'],
  ['estar-03.webp', 'Estar · salida al balcón']
];
const commercial = [
  ['local-01.webp', 'Local comercial · hacia el office'],
  ['local-02.webp', 'Local comercial · hacia el ingreso'],
  ['office-01.webp', 'Office · mesada'],
  ['local-bano-01.webp', 'Baño del local']
];

export function showGallery(container, isCommercial) {
  const items = isCommercial ? commercial : apartments;
  let index = 0;
  container.replaceChildren();
  const layout = document.createElement('div'); layout.className = 'interior-gallery';
  const heading = document.createElement('div'); heading.className = 'interior-gallery-heading';
  const title = document.createElement('h3'); title.textContent = isCommercial ? 'Interiores del local' : 'Interiores del departamento';
  const note = document.createElement('p'); note.textContent = 'Imágenes ilustrativas basadas en el modelo. Los detalles pueden variar.';
  heading.append(title, note);
  const figure = document.createElement('figure'); figure.className = 'interior-gallery-figure';
  const image = document.createElement('img'); image.decoding = 'async';
  const caption = document.createElement('figcaption');
  const controls = document.createElement('div'); controls.className = 'interior-gallery-controls';
  const previous = document.createElement('button'); previous.type = 'button'; previous.textContent = '‹'; previous.setAttribute('aria-label', 'Imagen anterior');
  const counter = document.createElement('span'); counter.setAttribute('aria-live', 'polite');
  const next = document.createElement('button'); next.type = 'button'; next.textContent = '›'; next.setAttribute('aria-label', 'Imagen siguiente');
  controls.append(previous, counter, next); figure.append(image, caption, controls);
  const thumbnails = document.createElement('div'); thumbnails.className = 'interior-gallery-thumbnails'; thumbnails.setAttribute('aria-label', 'Elegir vista interior');
  const buttons = items.map(([file, label], i) => {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', label);
    const thumb = document.createElement('img'); thumb.src = `assets/interiores/${file}`; thumb.alt = ''; thumb.loading = 'lazy';
    button.append(thumb); button.addEventListener('click', () => select(i)); thumbnails.append(button); return button;
  });
  function select(i) {
    index = (i + items.length) % items.length;
    const [file, label] = items[index]; image.src = `assets/interiores/${file}`; image.alt = label;
    caption.textContent = label; counter.textContent = `${index + 1} / ${items.length}`;
    buttons.forEach((button, n) => button.setAttribute('aria-pressed', String(n === index)));
  }
  previous.addEventListener('click', () => select(index - 1)); next.addEventListener('click', () => select(index + 1));
  layout.append(heading, figure, thumbnails); container.append(layout); select(0);
}
