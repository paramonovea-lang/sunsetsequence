// The parts of the course, in order. Keep in step with PAGES in scripts/migrate-course.mjs
// and with the course source (E:\Tindal\course\tools\build-nav.js).
export const PARTS = [
  { n: 1, slug: '01-start-here', title: 'Start here', desc: 'What Strudel is, your first sound, and the track you will build.' },
  { n: 2, slug: '02-rhythm-and-drums', title: 'Rhythm and drums', desc: 'Pulse, meter, the drum kit, the beat lab and hi-hats.' },
  { n: 3, slug: '03-notes-and-chords', title: 'Notes and chords', desc: 'Octaves, basslines, chords, inversions, melody, scales, arpeggios.' },
  { n: 4, slug: '04-sound-and-effects', title: 'Sound and effects', desc: 'Movement, effects and what their numbers mean, a sound effect.' },
  { n: 5, slug: '05-song-structure', title: 'Song structure', desc: 'The finished arrangement, and songs built from blocks.' },
  { n: 6, slug: '06-visuals', title: 'Visuals', desc: 'Piano rolls, scopes and colours that draw your music.' },
  { n: 7, slug: '07-save-export-practice', title: 'Save, export and practice', desc: 'Keep your code, export a WAV file, practice tasks.' },
  { n: 8, slug: '08-command-reference', title: 'Command reference', desc: 'Every command, what its numbers mean, with an example.' },
  { n: 9, slug: '09-sound-bank', title: 'Sound bank', desc: 'Drum machines, synths, instruments and sample sets.' },
  { n: 10, slug: '10-error-messages', title: 'Error messages', desc: 'What the messages mean, and what to check when there is no sound.' },
  { n: 11, slug: '11-example-tracks', title: 'Example tracks', desc: 'Finished example tracks, each built step by step.' },
] as const;

export const stepLabel = (n: number) => String(n).padStart(2, '0');
export const partBySlug = (slug: string) => PARTS.find((p) => p.slug === slug);
/** Sunrise icons: the sun climbs from 60 to 180 "BPM" (cover.ts sunTop range) across the parts. */
export const sunBpm = (n: number) => Math.round(60 + ((n - 1) * 120) / (PARTS.length - 1));
