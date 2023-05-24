import { expect, test } from 'vitest';
import {
  parseTracks,
  parseNodesAndRoutes,
  parseEvents,
  dumpTracks,
  dumpNodesAndRoutes,
  dumpEvents,
  dumpRa3MusicHeader,
} from '@/parsers';
import tracks from '@/assets/tests/tracks.txt?raw';
import nodesAndRoutes from '@/assets/tests/nodes.txt?raw';
import events from '@/assets/tests/events.txt?raw';
import ra3MusicHeader from '@/assets/tests/RA3Music.h?raw';

test('parseTrack', () => {
  const dumped = dumpTracks(parseTracks(tracks));
  expect(dumped).toBe(tracks);
});

test('parseNodesAndRoutes', () => {
  const parsed = parseNodesAndRoutes(nodesAndRoutes);
  const dumped = dumpNodesAndRoutes(parsed.nodes, parsed.routes);
  expect(dumped).toBe(nodesAndRoutes);
});

test('parseEvents', () => {
  const parsedTracks = parseTracks(tracks);
  const { nodes } = parseNodesAndRoutes(nodesAndRoutes);
  const parsed = parseEvents(events, parsedTracks, nodes);
  const dumped = dumpEvents(parsed.variables, parsed.events);
  expect(dumped).toBe(events);

  const generated = dumpEvents([], [{ name: 'gen_0x0', id: 0, actions: [] }]);
  expect(generated).toBe(
    'vars: {\n},\nevent: {\n\teventID: gen_0x0,\n\tactions:[\n\t],\n},\n'
  );

  const dumpedHeader = dumpRa3MusicHeader(parsedTracks, parsed.events);
  const sortedDumped = dumpedHeader.split('\n').sort();
  const sortedOriginal = ra3MusicHeader.split('\n').sort();
  expect(sortedDumped).toEqual(sortedOriginal);
});
