import { expect, test } from 'vitest';
import {
  parseTracks,
  dumpTracks,
  parseNodesAndRoutes,
  dumpNodesAndRoutes,
  parseEvents,
  dumpEvents,
} from '@/parsers';
import tracks from '@/assets/tests/tracks.txt?raw';
import nodesAndRoutes from '@/assets/tests/nodes.txt?raw';
import events from '@/assets/tests/events.txt?raw';

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
});
