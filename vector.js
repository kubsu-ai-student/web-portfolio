const buildings = [
  { key: 'north', name: 'Север · офис', base: 410, solar: 42, shift: 0 },
  { key: 'west', name: 'Запад · склад', base: 280, solar: 22, shift: 3 },
  { key: 'south', name: 'Юг · студия', base: 145, solar: 59, shift: 5 },
];
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const number = new Intl.NumberFormat('ru-RU');
const date = (day) => new Date(Date.UTC(2026, 10, day + 1));
const value = (site, day) => Math.round(site.base * (
  [1, 0.89, 1.06, 0.94, 1.13, 0.84, 0.97][(day + site.shift) % 7]
  + 0.08 * Math.sin((day + site.shift) * 0.55) + day * 0.003
));
const totalsFor = (sites, day) => sites.reduce((sum, site) => sum + value(site, day), 0);
const put = (id, text) => { document.getElementById(id).textContent = text; };
const campus = document.getElementById('site');
const canvas = document.getElementById('chart');
const context = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const controls = document.querySelectorAll('[data-range]');
let range = 7;
let readings = [];
let points = [];

function update() {
  const active = buildings.filter((building) => campus.value === 'all' || building.key === campus.value);
  const days = Array.from({ length: range }, (_, index) => 30 - range + index);
  readings = days.map((day) => ({ day, amount: totalsFor(active, day) }));
  const total = readings.reduce((sum, reading) => sum + reading.amount, 0);
  const peak = readings.reduce((top, reading) => reading.amount > top.amount ? reading : top);
  const solar = Math.round(active.reduce((sum, building) => (
    sum + days.reduce((amount, day) => amount + value(building, day), 0) * building.solar
  ), 0) / total);
  const startDate = dateFormat.format(date(days[0]));
  const endDate = dateFormat.format(date(days.at(-1)));
  put('total', number.format(total));
  put('total-note', 'С ' + startDate + ' по ' + endDate);
  put('peak', number.format(peak.amount));
  put('peak-note', dateFormat.format(date(peak.day)));
  put('solar', solar);
  put('ring-label', solar + '%');
  put('mix-solar', solar + '%');
  put('mix-grid', 100 - solar + '%');
  put('chart-summary', 'Пик ' + number.format(peak.amount) + ' кВт·ч · ' + dateFormat.format(date(peak.day)));
  put('table-range', 'Последние ' + range + ' дней');
  document.getElementById('ring').style.setProperty('--percentage', solar + '%');
  const rows = buildings.map((building) => {
    const row = document.createElement('tr');
    for (const text of [
      building.name, number.format(days.reduce((sum, day) => sum + value(building, day), 0)), building.solar + '%',
    ]) {
      row.insertCell().textContent = text;
    }
    return row;
  });
  document.getElementById('rows').replaceChildren(...rows);
  tooltip.hidden = true;
  drawChart();
}

function drawChart() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height || !readings.length) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const left = 41;
  const right = width - 10;
  const top = 13;
  const bottom = height - 31;
  const values = readings.map((reading) => reading.amount);
  const step = Math.max(25, Math.ceil((Math.max(...values) - Math.min(...values)) / 120) * 25);
  const minimum = Math.max(0, Math.floor(Math.min(...values) / step) * step - step);
  const maximum = Math.ceil(Math.max(...values) / step) * step + step;
  const y = (amount) => bottom - (amount - minimum) / (maximum - minimum) * (bottom - top);
  context.font = '12px "Segoe UI", sans-serif';
  context.fillStyle = '#a1b6b3';
  context.strokeStyle = '#2c3d3c';
  context.textBaseline = 'middle';
  for (let tick = minimum; tick <= maximum; tick += step) {
    const lineY = y(tick);
    context.fillText(String(tick), 0, lineY);
    context.beginPath();
    context.moveTo(left, lineY);
    context.lineTo(right, lineY);
    context.stroke();
  }
  points = readings.map(({ day, amount }, index) => ({
    day, amount, x: left + index / (readings.length - 1) * (right - left), y: y(amount),
  }));
  const interval = Math.ceil((points.length - 1) / Math.max(2, Math.floor(width / 82)));
  context.textBaseline = 'alphabetic';
  points.forEach((point, index) => {
    if (index % interval !== 0 && index !== points.length - 1) return;
    if (index !== points.length - 1 && points.at(-1).x - point.x < 49) return;
    const label = dateFormat.format(date(point.day));
    const textWidth = context.measureText(label).width;
    context.fillText(label, Math.min(width - textWidth, point.x - textWidth / 2), height - 5);
  });
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, 'rgba(72,235,174,.37)');
  gradient.addColorStop(1, 'rgba(72,235,174,.025)');
  context.beginPath();
  points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
  context.lineTo(right, bottom);
  context.lineTo(left, bottom);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
  context.beginPath();
  points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
  context.strokeStyle = '#48ebae';
  context.lineWidth = 2.6;
  context.lineJoin = 'round';
  context.stroke();
  if (points.length <= 14) {
    context.fillStyle = '#48ebae';
    for (const point of points) {
      context.beginPath();
      context.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      context.fill();
    }
  }
}

canvas.addEventListener('pointermove', (event) => {
  if (!points.length) return;
  const x = event.clientX - canvas.getBoundingClientRect().left;
  const closest = points.reduce((nearest, point) => Math.abs(point.x - x) < Math.abs(nearest.x - x) ? point : nearest);
  tooltip.textContent = dateFormat.format(date(closest.day)) + ' · ' + number.format(closest.amount) + ' кВт·ч';
  tooltip.hidden = false;
  tooltip.style.left = Math.max(0, Math.min(canvas.clientWidth - tooltip.offsetWidth, closest.x - 35)) + 'px';
});
canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; });
new ResizeObserver(drawChart).observe(canvas);
campus.addEventListener('change', update);
for (const button of controls) {
  button.addEventListener('click', () => {
    range = Number(button.dataset.range);
    for (const control of controls) control.setAttribute('aria-pressed', String(control === button));
    update();
  });
}
document.getElementById('export').addEventListener('click', () => {
  const csv = ['Дата;Расход (кВт·ч)', ...readings.map((reading) => date(reading.day).toISOString().slice(0, 10) + ';' + reading.amount)].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vector-grid-' + campus.value + '-' + range + '.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
update();
