import { test, expect } from 'vitest';
import { parseAudioDescription } from '@/audio';

test('parsing', () => {
  const text = `mix(
    file(id1),
    slice(0, 0, 1, file(id2)),
    volume(0.5, 1, file(id3))
  )`;
  const audio = parseAudioDescription(text);
  expect(audio).toEqual({
    type: 'mix',
    sources: [
      { type: 'file', id: 'id1' },
      {
        type: 'slice',
        waitSecondsBeforeStart: 0,
        start: 0,
        end: 1,
        source: { type: 'file', id: 'id2' },
      },
      {
        type: 'volume',
        startVolume: 0.5,
        endVolume: 1,
        source: { type: 'file', id: 'id3' },
      },
    ],
  });
});
