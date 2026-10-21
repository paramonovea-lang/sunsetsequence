// Facts the owner hasn't supplied yet stay visible as [PLACEHOLDERS] (docs/11).
export const SITE = {
  domain: 'sunsetsequence.com',
  name: 'Sunset Sequence',
  wordmark: 'SUNSET SEQUENCE',
  artist: 'Egor P.', // Q1, answered 12 Oct 2026: the author; Sunset Sequence is the site/label
  // Bio: the owner's text, tightened in design/avatar/HANDOFF.md (12 Oct 2026). Original:
  // "Modern technologies like music programming allow you to realize your own ideas that were
  // previously difficult to achieve. This is your new age of creative inquiry. Let's walk this path together."
  about: "Music programming lets you build ideas that used to be out of reach. This is your new age of creative inquiry. Let's walk this path together.",
  byline: 'music in code, and the course to write your own.',
  // Kept in two parts and joined in the browser (components/Email.astro), so the address isn't
  // written out in the page source or the repository for spam bots.
  contact: { user: 'paramonov.e.a', domain: 'gmail.com' },
  // Google Analytics 4 (Q9, owner 21 Oct 2026; components/Analytics.astro). The ID is public by design:
  // every page that uses GA shows it in its source.
  analyticsId: 'G-VD0BHX2GQH',
  sourceRepo: 'https://github.com/paramonovea-lang/sunsetsequence', // Q4: AGPL-3.0 repo (LICENSING.md)
  // The author's profiles (About page, footer). Owner, 12 Oct 2026: GitHub only.
  links: [{ label: 'GitHub', href: 'https://github.com/paramonovea-lang' }],
  licenses: {
    site: 'AGPL-3.0-or-later',
    trackCode: 'All rights reserved', // Q3, changed 13 Oct 2026: releases' code, like their audio
    trackAudio: 'All rights reserved', // Q3: releases only (owner sells on streaming)
    course: 'CC BY-SA 4.0', // Q3: course text
    courseCode: 'CC0 1.0', // 13 Oct 2026: course code boxes, guided steps and the course's example tracks
    logo: 'All rights reserved', // name, logo and icons (LICENSING.md)
  },
} as const;
