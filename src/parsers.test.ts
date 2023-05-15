import { expect, test } from 'vitest';
import {
  parseTrack,
  dumpTrack,
  parseNodesAndRoutes,
  dumpNodesAndRoutes,
  parseEvents,
  dumpEvents,
} from '@/parsers';
import track from '@/assets/tests/tracks.txt?raw';
import nodesAndRoutes from '@/assets/tests/nodes.txt?raw';
import events from '@/assets/tests/events.txt?raw';

test('parseTrack', () => {
  const dumped = dumpTrack(parseTrack(track));
  expect(dumped).toBe(track);
});

test('parseNodesAndRoutes', () => {
  const parsed = parseNodesAndRoutes(nodesAndRoutes);
  const dumped = dumpNodesAndRoutes(parsed.nodes, parsed.routes);
  expect(dumped).toBe(nodesAndRoutes);
});

test('parseEvents', () => {
  const tracks = parseTrack(track);
  const { nodes } = parseNodesAndRoutes(nodesAndRoutes);
  const parsed = parseEvents(events, tracks, nodes);
  const dumped = dumpEvents(parsed.variables, parsed.events);
  expect(dumped).toBe(events);
});
