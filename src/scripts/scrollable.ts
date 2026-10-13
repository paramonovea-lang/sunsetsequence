// Containers that scroll sideways (wide tables, keyboards, step grids) must be reachable with the
// keyboard (WCAG 2.1.1, axe "scrollable-region-focusable"). Only containers that actually overflow
// get a tab stop, and they lose it again when the window grows.
const SELECTOR = [
  '.table-wrap', '.kbd-wrap', '.arpgrid-wrap', '.songmap-wrap', '.grid-fig', '.catrow', '.fxscale-fig',
  '.scroll', '.list-wrap', '.sq-guided__static',
].join(', ');

function mark() {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    const scrolls = el.scrollWidth > el.clientWidth + 1;
    if (scrolls && !el.hasAttribute('tabindex')) {
      el.tabIndex = 0;
      el.dataset.scrollFocus = '';
      if (!el.hasAttribute('role')) el.setAttribute('role', 'region');
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.querySelector('table') ? 'Table (scrolls sideways)' : 'Scrolls sideways');
    } else if (!scrolls && el.hasAttribute('data-scroll-focus')) {
      el.removeAttribute('tabindex');
      el.removeAttribute('data-scroll-focus');
      if (el.getAttribute('role') === 'region') el.removeAttribute('role');
      if (/scrolls sideways/i.test(el.getAttribute('aria-label') ?? '')) el.removeAttribute('aria-label');
    }
  });
}

let timer = 0;
const later = () => {
  clearTimeout(timer);
  timer = window.setTimeout(mark, 150);
};
document.addEventListener('astro:page-load', mark);
window.addEventListener('resize', later);
window.addEventListener('sq:content', later); // islands announce new content (guided steps)
mark();
