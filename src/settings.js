const KEY = 'various-roots.settings.v1';
export const OPTIONS = {
  sway: { min: 0, max: 150, step: 5, initial: 100 },
  radius: { min: 2, max: 8, step: 1, initial: 5 },
};

function valueFor(value, { min, max, step, initial }) {
  if (!Number.isFinite(value)) return initial;
  return Math.max(min, Math.min(max, min + step * Math.round((value - min) / step)));
}

export function readSettings() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch {}
  return Object.fromEntries(Object.entries(OPTIONS).map(([name, option]) =>
    [name, valueFor(saved?.[name], option)]));
}

export function bindSettings(settings, apply) {
  for (const [name, option] of Object.entries(OPTIONS)) {
    const slider = document.getElementById(name);
    Object.assign(slider, { min: option.min, max: option.max, step: option.step, value: settings[name] });
    const output = document.getElementById(name + '-value');
    const display = () => {
      const label = name === 'sway' ? settings.sway + '%' : String(settings.radius);
      output.value = label;
      slider.setAttribute('aria-valuetext', label);
    };
    display();
    slider.addEventListener('input', () => {
      settings[name] = valueFor(slider.valueAsNumber, option);
      display();
      apply(name);
      try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
    });
  }
}
