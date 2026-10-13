// Course progress without an account (docs/08): visited parts in localStorage, shown as a check
// after the title in the course menu (the part number stays), in the step cards and the progress strip.
const KEY = 'sq.course.v1';
type Progress = { visited: number[]; last?: number; guided?: Record<string, number> };

export function readProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Progress>;
    return { ...p, visited: Array.isArray(p.visited) ? p.visited : [] };
  } catch {
    return { visited: [] };
  }
}

function save(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode, blocked storage */ }
}

function apply() {
  const lesson = document.querySelector<HTMLElement>('[data-lesson-part]');
  const p = readProgress();
  if (lesson) {
    const n = Number(lesson.dataset.lessonPart);
    if (!p.visited.includes(n)) p.visited.push(n);
    p.last = n;
    save(p);
  }
  for (const n of p.visited.filter(Number.isInteger)) {
    document.querySelectorAll<HTMLElement>(`[data-menu-part="${n}"], [data-progress-part="${n}"], [data-part="${n}"]`).forEach((el) => {
      el.dataset.visited = '';
    });
  }
  const resume = document.querySelector<HTMLAnchorElement>('[data-resume]');
  if (resume && Number.isInteger(p.last) && p.last) {
    const card = document.querySelector<HTMLAnchorElement>(`[data-part="${p.last}"]`);
    if (card) {
      resume.href = card.href;
      resume.hidden = false;
    }
  }
}

document.addEventListener('astro:page-load', apply);
apply();
