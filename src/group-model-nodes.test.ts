import { expect, test } from 'vitest';
import { parseTracks, parseNodesAndRoutes, parseEvents } from '@/parsers';
import tracks from '@/assets/tests/tracks.txt?raw';
import nodesAndRoutes from '@/assets/tests/nodes.txt?raw';
import events from '@/assets/tests/events.txt?raw';
import { createModel } from '@/model';
import { groupModelNodes } from './group-model-nodes';

const parsedTracks = parseTracks(tracks);
const { nodes, routes } = parseNodesAndRoutes(nodesAndRoutes);
const { events: parsedEvents, variables } = parseEvents(
  events,
  parsedTracks,
  nodes
);
const model = createModel(parsedTracks, nodes, parsedEvents, variables, routes);

test('groupModelNodes', () => {
  const grouped = groupModelNodes(model);
  // ensure every node is processed
  const processed = model.data.nodes.map(() => false);
  for (const group of grouped) {
    for (const node of group) {
      processed[node.id] = true;
    }
  }
  expect(processed.every((p) => p)).toBe(true);

  // ensure group has no additional source branches
  for (const group of grouped) {
    for (const node of group.slice(1)) {
      const sources = model
        .getSourceNodesByBranches(node.id)
        .value.filter((n) => !group.includes(n));
      expect(sources.length).toBe(0);
    }
  }

  // ensure group has no additional destination branches
  for (const group of grouped) {
    for (const node of group.slice(0, -1)) {
      const destinations = node.branches
        .map(({ dstnode }) => model.data.nodes[dstnode])
        .filter((n) => !group.includes(n));
      expect(destinations.length).toBe(0);
    }
  }
});
