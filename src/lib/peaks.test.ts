import { describe, expect, it } from 'vitest';
import { toBars } from './peaks';

describe('toBars', () => {
  it('takes the loudest min/max per bar and scales to 1', () => {
    const data = [-10, 20, -64, 32, -5, 5, -1, 127];
    expect(toBars({ data }, 2)).toEqual([0.504, 1]);
  });
  it('never makes more bars than frames', () => {
    expect(toBars({ data: [-1, 1, -2, 2] }, 160)).toHaveLength(2);
  });
  it('handles empty peaks', () => {
    expect(toBars({ data: [] })).toEqual([]);
  });
});
