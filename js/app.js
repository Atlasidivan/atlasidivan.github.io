// Kaşgarlı Mahmud Atlası — iki harita, ortak ID ile senkronizasyon.
const IMG = {
  original: { local: 'img/original.jpg', remote: 'https://commons.wikimedia.org/wiki/Special:FilePath/D%C4%ABw%C4%81n_Lugh%C4%81t_al-Turk_(original).jpg?width=2000', label: 'Özgün harita' },
  tr: { local: 'img/turkce.png', remote: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mahmud_al-Kashgari_map_(T%C3%BCrk%C3%A7e).png?width=2000', label: 'Türkçe açıklamalı' }
};
const TYPES = { tanimsiz: 'Tanımlanamayanlar (yalnız eski harita)', boy: 'Türk boyları', sehir: 'Şehirler', bolge: 'Bölgeler / ülkeler', nehir: 'Nehirler', dag: 'Dağlar', gol: 'Göller', deniz: 'Denizler', col: 'Çöller' };
const EV = { 1: 'Özgün haritada gösterilmiş', 2: 'Eserin metninde belirtilmiş', 3: 'Akademik yoruma dayalı' };
const CONF = { yuksek: 'Yüksek güven', yaklasik: 'Yaklaşık konum', tartismali: 'Tartışmalı' };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Güvenlik: yalnız https bağlantılar ve #rrggbb renkler HTML'e girer.
const safeUrl = u => /^https:\/\//i.test(u || '') ? u : '#';
const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#999999';
const CAL = new URLSearchParams(location.search).has('kalibre');

const { sources, features } = await (await fetch('data/features.json')).json();
const byId = new Map(features.map(f => [f.id, f]));
const state = { selected: null, types: new Set(Object.keys(TYPES)), ev: 'all' };
const visible = f => state.types.has(f.type) &&
  (state.ev === 'all' || (state.ev === 'source' ? f.evidenceType < 3 : f.evidenceType === 3));
const colorOf = f => safeColor(f.color || { sehir: '#d4a017', nehir: '#1f6fd1', dag: '#8b3a1a', gol: '#1f8fd1', deniz: '#1660a8', col: '#c9a25b', bolge: '#6c5b7b' }[f.type]);

// ---------- Modern harita (Leaflet)
const map = L.map('modernMap', { worldCopyJump: true, preferCanvas: false }).setView([44, 72], 4);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap katkıcıları' }).addTo(map);
map.createPane('areas').style.zIndex = 380; map.createPane('lines').style.zIndex = 390;
const layers = new Map();
function mkLayer(f) {
  const g = f.modernLocation; if (!g) return null;
  const c = colorOf(f), dash = f.confidence === 'yuksek' ? null : '6 5';
  if (g.type === 'LineString') {
    const ll = g.coordinates.map(([x, y]) => [y, x]);
    return L.polyline(ll, { color: c, weight: f.type === 'dag' ? 5 : 3, opacity: .85, pane: 'lines', dashArray: f.type === 'dag' ? '2 6' : dash });
  }
  const [lon, lat] = g.coordinates;
  if (f.area) { // yaklaşık dağılım: elips, kesikli kenar
    const pts = []; const { rxKm, ryKm } = f.area;
    for (let a = 0; a < 360; a += 10) { const r = a * Math.PI / 180; pts.push([lat + ryKm / 111 * Math.sin(r), lon + rxKm / (111 * Math.cos(lat * Math.PI / 180)) * Math.cos(r)]); }
    return L.polygon(pts, { color: c, weight: 1.5, fillColor: c, fillOpacity: .18, dashArray: '6 5', pane: 'areas' });
  }
  if (f.type === 'bolge' || f.type === 'deniz' || f.type === 'col')
    return L.circleMarker([lat, lon], { radius: 9, color: c, weight: 2, fillOpacity: .15, dashArray: '3 3' });
  return L.circleMarker([lat, lon], { radius: f.type === 'sehir' ? 6 : 7, color: '#5a3a00', weight: 1, fillColor: c, fillOpacity: .95 });
}
for (const f of features) {
  const l = mkLayer(f); if (!l) continue;
  l.bindTooltip(`<b>${esc(f.historicalName)}</b><br>${esc(f.modernName)}`, { className: 'lt', sticky: true });
  l.on({ mouseover: () => hover(f.id, true), mouseout: () => hover(f.id, false), click: () => select(f.id) });
  layers.set(f.id, l);
}
function styleModern(id, on) {
  const l = layers.get(id), f = byId.get(id); if (!l) return;
  if (f.area) l.setStyle({ fillOpacity: on ? .45 : .18, weight: on ? 3 : 1.5 });
  else if (l instanceof L.Polyline && !(l instanceof L.Polygon)) l.setStyle({ weight: on ? 7 : (f.type === 'dag' ? 5 : 3), color: on ? '#ff5a1f' : colorOf(f) });
  else l.setStyle({ color: on ? '#ff5a1f' : (f.type === 'sehir' ? '#5a3a00' : colorOf(f)), weight: on ? 4 : (f.type === 'sehir' ? 1 : 2), radius: on ? 11 : (f.type === 'sehir' ? 6 : 7) });
  if (on) l.bringToFront();
}

// ---------- Dairesel harita (görüntü + SVG katmanı)
const svg = $('#circSvg'), img = $('#circImg'), stage = $('#stage'), circ = $('#circ');
const NS = 'http://www.w3.org/2000/svg';
const view = { s: 1, x: 0, y: 0, base: 1 };
let cur = 'original', W = 1000, H = 1000;
const nodes = new Map();
const posOf = f => cur === 'tr' ? f.historicalMapPositionTr : f.historicalMapPosition;
function loadImg(which) {
  cur = which; const src = IMG[which];
  img.onerror = () => { if (img.src.endsWith(src.local)) img.src = src.remote; else $('#circNote').textContent = 'Harita görseli yüklenemedi.'; };
  img.onload = () => { W = img.naturalWidth; H = img.naturalHeight; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); drawSvg(); fit(); };
  img.src = src.local;
  $('#lblToggle').checked = which === 'original'; svg.classList.toggle('nolbl', which !== 'original'); // Türkçe görselde etiketler zaten var
  $('#imgToggle').textContent = which === 'original' ? 'Türkçe açıklamalı' : 'Özgün harita';
}
function drawSvg() {
  svg.replaceChildren(); nodes.clear();
  for (const f of features) {
    const p = posOf(f); if (!p) continue;
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', `hm ${f.type}`); g.dataset.id = f.id;
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p.x * W); c.setAttribute('cy', p.y * H);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', p.x * W); t.setAttribute('y', p.y * H); t.setAttribute('text-anchor', 'middle');
    t.textContent = f.historicalName;
    g.append(c, t); svg.append(g); nodes.set(f.id, g);
    g.addEventListener('mouseenter', e => { hover(f.id, true); tip(e, f); });
    g.addEventListener('mousemove', e => tip(e, f));
    g.addEventListener('mouseleave', () => { hover(f.id, false); tip(); });
    g.addEventListener('click', e => { e.stopPropagation(); select(f.id); });
  }
  sizeMarks(); applyFilters();
}
// İşaretçi boyutu ekran pikseli olarak sabit kalsın (yakınlaştırmada kaymaz, büyümez).
function sizeMarks() {
  const k = 1 / (view.s * view.base);
  for (const [id, g] of nodes) {
    const f = byId.get(id), [c, t] = g.children;
    c.setAttribute('r', (f.type === 'boy' ? 11 : 7) * k); c.setAttribute('stroke-width', 1.2 * k);
    t.setAttribute('dy', -12 * k); t.style.fontSize = 13 * k + 'px'; t.style.strokeWidth = 3 * k + 'px';
  }
}
function apply() { stage.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.s * view.base})`; sizeMarks(); }
function fit() {
  const r = circ.getBoundingClientRect(); if (!r.width) return;
  view.base = Math.min(r.width / W, r.height / H); view.s = 1;
  stage.style.width = W + 'px'; stage.style.height = H + 'px'; img.style.width = W + 'px';
  view.x = (r.width - W * view.base) / 2; view.y = (r.height - H * view.base) / 2; apply();
}
function zoomAt(f, cx, cy) {
  const ns = Math.min(12, Math.max(1, view.s * f)), k = ns / view.s;
  view.x = cx - (cx - view.x) * k; view.y = cy - (cy - view.y) * k; view.s = ns; apply();
}
circ.addEventListener('wheel', e => { e.preventDefault(); const r = circ.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
const ptrs = new Map(); let pinch = 0, moved = false;
circ.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, e); moved = false; if (ptrs.size === 1) circ.classList.add('drag'); });
addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, e);
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), r = circ.getBoundingClientRect();
    if (pinch) zoomAt(d / pinch, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top); pinch = d; return;
  }
  const dx = e.clientX - prev.clientX, dy = e.clientY - prev.clientY; if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
  view.x += dx; view.y += dy; apply();
});
addEventListener('pointerup', e => { ptrs.delete(e.pointerId); pinch = 0; if (!ptrs.size) circ.classList.remove('drag'); });
addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = 0; });
circ.addEventListener('click', e => {
  if (!CAL || moved) return; const r = svg.getBoundingClientRect();
  const x = +((e.clientX - r.left) / r.width).toFixed(4), y = +((e.clientY - r.top) / r.height).toFixed(4);
  const out = { id: state.selected, field: cur === 'tr' ? 'historicalMapPositionTr' : 'historicalMapPosition', x, y }; console.log('[kalibre]', JSON.stringify(out)); $('#circNote').textContent = 'Kalibrasyon: ' + JSON.stringify(out);
});
$('#zIn').onclick = () => { const r = circ.getBoundingClientRect(); zoomAt(1.4, r.width / 2, r.height / 2); };
$('#zOut').onclick = () => { const r = circ.getBoundingClientRect(); zoomAt(1 / 1.4, r.width / 2, r.height / 2); };
$('#zReset').onclick = fit;
$('#imgToggle').onclick = () => loadImg(cur === 'original' ? 'tr' : 'original');
$('#lblToggle').onchange = e => svg.classList.toggle('nolbl', !e.target.checked);
function centerOn(id) {
  const p = byId.get(id) && posOf(byId.get(id)), r = circ.getBoundingClientRect(); if (!p || !r.width) return;
  const k = view.s * view.base, sx = view.x + p.x * W * k, sy = view.y + p.y * H * k;
  if (sx < 30 || sy < 30 || sx > r.width - 30 || sy > r.height - 30) { view.x += r.width / 2 - sx; view.y += r.height / 2 - sy; apply(); }
}
new ResizeObserver(() => { fit(); map.invalidateSize(); }).observe(circ);

// ---------- Senkronizasyon
const tipEl = $('#tip');
function tip(e, f) {
  if (!f) { tipEl.hidden = true; return; }
  tipEl.innerHTML = `<b>${esc(f.historicalName)}</b> · ${esc(f.modernName || '—')}<br><i>${esc(CONF[f.confidence])}</i>`;
  tipEl.hidden = false; tipEl.style.left = e.clientX + 14 + 'px'; tipEl.style.top = e.clientY + 14 + 'px';
}
function hover(id, on) {
  if (!on && id === state.selected) return;
  styleModern(id, on); nodes.get(id)?.classList.toggle('on', on);
  const g = nodes.get(id); if (on && g && g.nextSibling) g.parentNode.append(g);
}
function select(id, { pan = true } = {}) {
  tip();
  const prev = state.selected; state.selected = id;
  if (prev && prev !== id) hover(prev, false);
  hover(id, true); renderInfo(byId.get(id)); renderResults();
  const l = layers.get(id);
  if (pan && l && $('#paneModern').offsetParent) {
    if (l.getBounds) map.fitBounds(l.getBounds(), { maxZoom: 6, padding: [30, 30] }); else map.setView(l.getLatLng(), Math.max(map.getZoom(), 5));
  }
  if (pan) centerOn(id);
  history.replaceState(null, '', '#' + id);
}

// ---------- Paneller
function renderInfo(f) {
  const src = f.source.map(s => sources[s]).filter(Boolean).map(s => `<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('');
  const ml = f.modernLocation?.type === 'Point' ? `${f.modernLocation.coordinates[1].toFixed(2)}°K, ${f.modernLocation.coordinates[0].toFixed(2)}°D` : f.modernLocation ? 'Çizgi geometrisi (sadeleştirilmiş)' : '—';
  const hp = f.historicalMapPosition, ht = f.historicalMapPositionTr;
  $('#info').innerHTML = `<div class="info"><h2>${esc(f.historicalName)}</h2>
    <span class="badge">${esc(TYPES[f.type] || 'Tanımlanamayan')}</span><span class="badge c-${esc(f.confidence)}">${esc(CONF[f.confidence])}</span><span class="badge">${esc(EV[f.evidenceType])}</span>
    <dl>${f.altNames.length ? `<dt>Alternatif yazılışlar</dt><dd>${f.altNames.map(esc).join(', ')}</dd>` : ''}
    <dt>Tarihsel açıklama</dt><dd>${esc(f.description)}</dd>
    ${f.divanNote ? `<dt>Dîvânu Lugâti't-Türk'te</dt><dd>${esc(f.divanNote)}</dd>` : ''}
    ${f.history ? `<dt>Kısa tarihçe</dt><dd>${esc(f.history)}</dd>` : ''}
    ${f.settlements.length ? `<dt>Önemli yerleşimler</dt><dd>${f.settlements.map(esc).join(', ')}</dd>` : ''}
    <dt>Günümüz coğrafi karşılığı</dt><dd>${esc(f.modernName || 'Belirlenemedi')}<br><small class="muted">${ml}</small></dd>
    ${f.area ? `<dt>Yaklaşık alan</dt><dd>Kesin sınır değildir; ~${f.area.rxKm}×${f.area.ryKm} km'lik dağılım gösterilir.</dd>` : ''}
    ${f.unidentifiedReason ? `<dt>Neden tanımlanamadı</dt><dd>${esc(f.unidentifiedReason)}</dd>` : ''}
    <dt>Dairesel haritadaki konum</dt><dd>${hp ? `Özgün: x ${+hp.x}, y ${+hp.y}${hp.calibrated ? '' : ' <small class="muted">(Türkçe haritadan dönüştürüldü, yaklaşık)</small>'}<br>Türkçe: x ${+ht.x}, y ${+ht.y}` : 'Haritada gösterilmiyor / okunamadı'}</dd>
    <dt>Kaynaklar</dt><dd><ol>${src}</ol></dd></dl></div>`;
}
function renderResults() {
  const qt = $('#qTribe').value.trim().toLocaleLowerCase('tr'), qp = $('#qPlace').value.trim().toLocaleLowerCase('tr');
  const hit = (f, q) => [f.historicalName, f.modernName, ...f.altNames].some(s => s && s.toLocaleLowerCase('tr').includes(q));
  const list = features.filter(f => f.type !== 'tanimsiz' && visible(f) && ((qt && f.type === 'boy' && hit(f, qt)) || (qp && f.type !== 'boy' && hit(f, qp)) || (!qt && !qp)));
  const li = f => `<li data-id="${esc(f.id)}" class="${f.id === state.selected ? 'on' : ''}"><span class="sw" style="background:${colorOf(f)}"></span>${esc(f.historicalName)}<small>${esc(TYPES[f.type] || '')}</small></li>`;
  $('#results').innerHTML = list.map(li).join('');
  $('#unknown').innerHTML = features.filter(f => f.type === 'tanimsiz').map(li).join('');
}
for (const ul of [$('#results'), $('#unknown')]) {
  ul.addEventListener('click', e => { const id = e.target.closest('li')?.dataset.id; if (id) select(id); });
  ul.addEventListener('mouseover', e => { const id = e.target.closest('li')?.dataset.id; if (id) hover(id, true); });
  ul.addEventListener('mouseout', e => { const id = e.target.closest('li')?.dataset.id; if (id) hover(id, false); });
}
$('#qTribe').oninput = $('#qPlace').oninput = renderResults;
$('#layers').insertAdjacentHTML('beforeend', Object.entries(TYPES).map(([k, v]) => `<label><input type="checkbox" value="${k}" checked> ${v}</label>`).join(''));
$('#layers').onchange = e => { e.target.checked ? state.types.add(e.target.value) : state.types.delete(e.target.value); applyFilters(); };
document.querySelectorAll('[name=ev]').forEach(r => r.onchange = () => { state.ev = r.value; applyFilters(); });
function applyFilters() {
  for (const f of features) {
    const v = visible(f), l = layers.get(f.id);
    if (l) v ? l.addTo(map) : l.remove();
    nodes.get(f.id)?.classList.toggle('off', !v);
  }
  renderResults();
}

// ---------- Görünüm sekmeleri ve tam ekran
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.body.dataset.view = b.dataset.v; tip(); setTimeout(() => { map.invalidateSize(); fit(); }, 0);
});
document.querySelectorAll('.fs').forEach(b => b.onclick = () => {
  const p = document.getElementById(b.dataset.fs); p.classList.toggle('full'); setTimeout(() => { map.invalidateSize(); fit(); }, 0);
});
addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.pane.full').forEach(p => { p.classList.remove('full'); map.invalidateSize(); fit(); }); });

if (matchMedia('(max-width:860px)').matches) { document.body.dataset.view = 'modern'; $('#left > details').open = false; }
$('#circNote').textContent = CAL ? 'Kalibrasyon modu: bir öğe seçip haritada doğru konuma tıklayın; değer konsola yazılır.'
  : 'Noktalar, doğrulanmış yer adları ve kaynak yorumlarına göre eşleştirilmiştir; harita geometrik olarak dönüştürülmemiştir.';
loadImg('original'); applyFilters();
const start = location.hash.slice(1);
select(byId.has(start) ? start : 'balasagun', { pan: byId.has(start) });
if (CAL) window.atlas = { map, layers, select, features }; // yalnız kalibrasyon modunda
