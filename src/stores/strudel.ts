// Who is using the single in-page Strudel instance right now ('codeblock', 'guided', or null).
// Each controller resets its own UI when another one takes over (docs/07 "one block at a time").
import { atom } from 'nanostores';

export const $strudelOwner = atom<string | null>(null);
