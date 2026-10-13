// Part 8 (command reference): filter every table row by the text typed into #cmd-filter.
function bind() {
  const input = document.querySelector<HTMLInputElement>('#cmd-filter');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  const count = document.querySelector<HTMLElement>('.filter-count');
  const rows = [...document.querySelectorAll<HTMLTableRowElement>('.lesson-body tbody tr')];
  const sections = [...document.querySelectorAll<HTMLElement>('.lesson-body section')];
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) {
      const hit = !q || r.textContent!.toLowerCase().includes(q);
      r.hidden = !hit;
      if (hit) shown++;
    }
    // Hide sections with no matching rows while searching.
    for (const s of sections) {
      const has = [...s.querySelectorAll('tbody tr')].some((r) => !(r as HTMLElement).hidden);
      s.hidden = !!q && !has;
    }
    if (count) count.textContent = q ? `${shown} matching ${shown === 1 ? 'command' : 'commands'}` : '';
  });
}
document.addEventListener('astro:page-load', bind);
bind();
