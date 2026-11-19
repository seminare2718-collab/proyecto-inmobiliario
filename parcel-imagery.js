// Web Mercator metres around the project. The inner tiles have twice the
// sampling density so the block stays legible as the camera descends.
const centre = [-7535930, -7129406], span = 1580, aspect = 1580 / 890;
const world = 40075016.68557849;
let loaded = false;
export function prepareParcel() {
  if (loaded) return;
  loaded = true;
  const frame = document.createElement('div');
  frame.className = 'parcel-tiles';
  document.getElementById('parcelOrtho').append(frame);
  for (const [zoom, coverage] of [[18, 1], [19, .5]]) {
    const tileSpan = world / 2 ** zoom;
    const column = (centre[0] + world / 2) / tileSpan;
    const row = (world / 2 - centre[1]) / tileSpan;
    const across = span / tileSpan, down = across / aspect;
    const tiles = [];
    for (let y = Math.floor(row - down * coverage / 2); y < row + down * coverage / 2; y++) {
      for (let x = Math.floor(column - across * coverage / 2); x < column + across * coverage / 2; x++) {
        tiles.push({x,y, distance:Math.hypot(x + .5 - column,y + .5 - row)});
      }
    }
    for (const {x,y} of tiles.sort((a,b)=>a.distance-b.distance)) {
      const image = new Image();
      image.alt = ''; image.decoding = 'async';
      image.style.cssText = `left:${50+100*(x-column)/across}%;top:${50+100*(y-row)/down}%;width:${100/across}%;height:${100/down}%`;
      image.onload = () => frame.append(image);
      image.style.zIndex = String(zoom-17);
      image.src = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
    }
  }
}
