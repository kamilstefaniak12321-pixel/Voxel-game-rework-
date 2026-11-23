import { checkRelease } from './releases.js';

export function initUpdates() {
  const status = document.querySelector('#update-status');
  const action = document.querySelector('#update-action');
  const notes = document.querySelector('#release-notes');
  const desktop = window.desktopUpdates;
  const android = location.hostname === 'variousroots.invalid';
  if (!desktop && !android) return;
  let state = {}, latest;
  function show(next) {
    state = next;
    const version = next.version || '';
    const labels = {
      checking: 'Sprawdzanie aktualizacji…', current: 'Wersja aktualna',
      offline: 'Sprawdzenie aktualizacji niedostępne', available: 'Dostępna wersja ' + version,
      downloading: 'Pobieranie ' + version + '…', ready: 'Wersja ' + version + ' gotowa',
      failed: 'Nie udało się pobrać aktualizacji', installing: 'Uruchamianie aktualizacji…',
    };
    status.textContent = labels[next.kind] || '';
    const buttons = { available: 'Pobierz APK', ready: 'Uruchom ponownie i zaktualizuj', offline: 'Spróbuj ponownie', failed: 'Spróbuj ponownie' };
    action.hidden = !buttons[next.kind];
    action.textContent = buttons[next.kind] || '';
    notes.hidden = !next.notes;
    if (next.notes) notes.href = next.notes;
  }
  async function check() {
    show({ kind: 'checking' });
    try {
      if (desktop) { show(await desktop.check()); return; }
      latest = await checkRelease(document.querySelector('#installed-version').textContent, 'android');
      show(latest ? { ...latest, kind: 'available' } : { kind: 'current' });
    } catch { show({ kind: 'offline' }); }
  }
  action.onclick = () => {
    if (state.kind === 'available' && latest) location.assign(latest.url);
    else if (state.kind === 'ready') desktop.install();
    else check();
  };
  if (desktop) {
    desktop.onChange(show);
    notes.onclick = e => { e.preventDefault(); desktop.notes(); };
  }
  check();
}
