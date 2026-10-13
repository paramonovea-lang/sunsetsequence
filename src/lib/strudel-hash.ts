// Same format as the original course's toHash(): '#' + encodeURIComponent(base64(UTF-8 code)).
export function strudelHash(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return encodeURIComponent(btoa(bin));
}

export const strudelUrl = (code: string) => `https://strudel.cc/#${strudelHash(code)}`;
