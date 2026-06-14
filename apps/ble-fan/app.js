/* =========================================================
   BLE DESK FAN — app.js
   ========================================================= */

const SERVICE_UUID        = "4fa4c201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

let fanCharacteristic = null;
let bleDevice         = null;

/* ── Service worker registration ──────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        setSwStatus(true);
        console.log('[SW] Registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}

function setSwStatus(active) {
  const el = document.getElementById('sw-status');
  if (!el) return;
  el.textContent = active ? 'Offline-ready ✓' : 'Service worker inactive';
  if (active) el.classList.add('active');
}

/* ── Firefox detection ─────────────────────────────────────── */
if (navigator.userAgent.toLowerCase().includes('firefox')) {
  document.getElementById('firefox-warning').removeAttribute('hidden');
  document.querySelectorAll('.no-firefox').forEach(el => el.setAttribute('hidden', ''));
}

/* ── Status badge ──────────────────────────────────────────── */
function setStatus(text, state) {
  const badge = document.getElementById('status-badge');
  badge.dataset.state = state;
  badge.querySelector('.status-badge__text').textContent = text;
}

/* ── Log ───────────────────────────────────────────────────── */
function addLog(message, type = '') {
  const log = document.getElementById('log');
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);

  // remove placeholder on first real entry
  const placeholder = log.querySelector('.log__entry--muted');
  if (placeholder) placeholder.remove();

  const li = document.createElement('li');
  li.className = 'log__entry' + (type ? ` log__entry--${type}` : '');
  li.innerHTML = `<span class="log__time">${time}</span><span>${message}</span>`;

  // prepend so newest is on top (list is reversed)
  log.prepend(li);
}

function clearLog() {
  const log = document.getElementById('log');
  log.innerHTML = '<li class="log__entry log__entry--muted">Log cleared.</li>';
}

/* ── Slider ────────────────────────────────────────────────── */
function updateSliderDisplay(val) {
  document.getElementById('speed-value').textContent = val;
  // update the track fill
  document.getElementById('speed-slider').style.setProperty('--pct', val + '%');
  document.getElementById('speed-slider').value = val;
  updatePresetHighlight(Number(val));
}

function onSliderInput(val) {
  updateSliderDisplay(val);
}

function onSliderChange(val) {
  sendControlSignal(val.toString());
}

/* ── Preset buttons ────────────────────────────────────────── */
function updatePresetHighlight(val) {
  document.querySelectorAll('.btn--preset').forEach(btn => btn.classList.remove('active'));
  const targets = [0, 25, 50, 75, 100];
  const idx = targets.indexOf(val);
  if (idx !== -1) {
    document.querySelectorAll('.btn--preset')[idx].classList.add('active');
  }
}

function setSpeed(val) {
  updateSliderDisplay(val);
  sendControlSignal(val.toString());
}

/* ── BLE connect ───────────────────────────────────────────── */
async function connectBLE() {
  setStatus('Searching…', 'connecting');
  addLog('Scanning for BLE device…');

  const btnConnect    = document.getElementById('btn-connect');
  const btnDisconnect = document.getElementById('btn-disconnect');
  btnConnect.disabled = true;

  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    addLog(`Found: ${bleDevice.name || 'unnamed device'}`);
    setStatus('Connecting…', 'connecting');

    const server = await bleDevice.gatt.connect();
    addLog('Connected to GATT server');

    const service = await server.getPrimaryService(SERVICE_UUID);
    fanCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    setStatus('Connected', 'connected');
    addLog(`Connected to ${bleDevice.name || 'device'}`);

    btnConnect.setAttribute('hidden', '');
    btnDisconnect.removeAttribute('hidden');

    bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

  } catch (err) {
    console.error(err);
    setStatus('Connection failed', 'error');
    addLog(err.message || 'Connection failed', 'error');
    btnConnect.disabled = false;
  }
}

/* ── BLE disconnect ────────────────────────────────────────── */
function disconnectBLE() {
  if (bleDevice && bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
  }
  onDisconnected();
}

function onDisconnected() {
  setStatus('Disconnected', 'off');
  addLog('Device disconnected');
  fanCharacteristic = null;

  const btnConnect    = document.getElementById('btn-connect');
  const btnDisconnect = document.getElementById('btn-disconnect');
  btnConnect.removeAttribute('hidden');
  btnConnect.disabled = false;
  btnDisconnect.setAttribute('hidden', '');
}

/* ── BLE write ─────────────────────────────────────────────── */
async function sendControlSignal(value) {
  if (!fanCharacteristic) {
    addLog('Not connected — connect first', 'error');
    return;
  }
  try {
    await fanCharacteristic.writeValue(new TextEncoder().encode(value));
    addLog(`Speed → ${value}%`);
  } catch (err) {
    console.error('Write failed:', err);
    addLog('Write failed: ' + err.message, 'error');
    setStatus('Write error', 'error');
  }
}

/* ── Init slider highlight ─────────────────────────────────── */
updatePresetHighlight(60);