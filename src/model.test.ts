import { createModel } from '@/model';
import { expect, test } from 'vitest';

test('modelNodeLookup', () => {
  const model = createModel([], [], [], []);

  const id1 = model.addNode(0, 0);
  const node1 = model.nodes[id1];
  expect(id1).toBe(0);
  expect(node1.id).toBe(id1);

  const id2 = model.addNode(0, 0);
  const node2 = model.nodes[id2];
  expect(id2).toBe(1);
  expect(node2.id).toBe(id2);

  model.addNodeBranches(node1.id, {
    dstnode: id2,
    controlmin: 0,
    controlmax: 127,
  });

  expect(model.nodes[id1].branches[0].dstnode).toEqual(node2.id);
  expect(model.nodes[id2].branches.length).toEqual(0);
  expect(model.getSourceNodesByBranches(node2.id).value[0]).toEqual(node1);
});
