import { PathMusicActionType, createModel, type PathMusicEvent } from '@/model';
import { assert, expect, test } from 'vitest';

test('modelNodeLookup', () => {
  const model = createModel([], [], [], [], []);

  const id1 = model.addNode(0, 0);
  const node1 = model.data.nodes[id1];
  expect(id1).toBe(0);
  expect(node1.id).toBe(id1);

  const id2 = model.addNode(0, 0);
  const node2 = model.data.nodes[id2];
  expect(id2).toBe(1);
  expect(node2.id).toBe(id2);

  const newNode1 = model.setNode({
    ...node1,
    branches: [
      {
        dstnode: id2,
        controlmin: 0,
        controlmax: 127,
      },
    ],
  });

  expect(model.data.nodes[id1].branches[0].dstnode).toEqual(node2.id);
  expect(model.data.nodes[id2].branches.length).toEqual(0);
  expect(model.getSourceNodesByBranches(node2.id)[0]).toEqual(newNode1);
});

test('invalidBranchDstNode', () => {
  const model = createModel([], [], [], [], []);

  const id1 = model.addNode(0, 0);
  const node1 = model.data.nodes[id1];
  expect(id1).toBe(0);
  expect(node1.id).toBe(id1);

  model.setNode({
    ...node1,
    branches: [
      {
        dstnode: 65535,
        controlmin: 0,
        controlmax: 127,
      },
    ],
  });
  expect(model.getSourceNodesByBranches(node1.id).length).toEqual(0);
});

test('invalidEventDstNode', () => {
  const model = createModel([], [], [], [], []);

  const id1 = model.addNode(0, 0);
  const node1 = model.data.nodes[id1];
  expect(id1).toBe(0);
  expect(node1.id).toBe(id1);

  model.addEvent({
    name: 'Test_0x1',
    id: 1,
    actions: [
      {
        type: PathMusicActionType.BranchTo,
        node: 65535,
        ofsection: 0,
        immediate: false,
        track: 0,
      },
      {
        type: PathMusicActionType.BranchTo,
        node: id1,
        ofsection: 0,
        immediate: false,
        track: 0,
      },
    ],
  });
  expect(model.getNodeAssociatedEvents(node1.id).length).toEqual(1);
});

test('avoidAccidentalNodeChanges', () => {
  const model = createModel([], [], [], [], []);

  const id1 = model.addNode(0, 0);
  const node1 = model.data.nodes[id1];
  expect(id1).toBe(0);
  expect(node1.id).toBe(id1);

  const nodeData = {
    ...node1,
    branches: [
      {
        dstnode: id1,
        controlmin: 0,
        controlmax: 127,
      },
    ],
  };
  const newNode1 = model.setNode(nodeData);
  expect(model.data.nodes[id1].branches.length).toEqual(1);

  nodeData.branches[0].dstnode = 65535;
  expect(newNode1.branches[0].dstnode).toEqual(id1);
  nodeData.branches = [];
  expect(newNode1.branches.length).toEqual(1);
});

test('avoidAccidentalEventChanges', () => {
  const model = createModel([], [], [], [], []);

  const id1 = model.addNode(0, 0);
  const id2 = model.addNode(0, 0);

  const eventData: PathMusicEvent = {
    name: 'Test_0x1',
    id: 1,
    actions: [
      {
        type: PathMusicActionType.BranchTo,
        node: id1,
        ofsection: 0,
        immediate: false,
        track: 0,
      },
      {
        type: PathMusicActionType.If,
        condition: '',
        actions: [
          {
            type: PathMusicActionType.If,
            condition: '',
            actions: [
              {
                type: PathMusicActionType.BranchTo,
                node: id2,
                ofsection: 0,
                immediate: false,
                track: 0,
              },
            ],
            track: 0,
          },
          {
            type: PathMusicActionType.EndIf,
          },
        ],
        track: 0,
      },
      {
        type: PathMusicActionType.EndIf,
      },
    ],
  };
  const event = model.addEvent(eventData);
  expect(event.actions.length).toEqual(3);

  assert(event.actions[0].type === PathMusicActionType.BranchTo);
  assert(eventData.actions[0].type === PathMusicActionType.BranchTo);
  eventData.actions[0].node = id2;
  expect(event.actions[0].node).toEqual(id1);

  assert(event.actions[1].type === PathMusicActionType.If);
  assert(eventData.actions[1].type === PathMusicActionType.If);
  assert(event.actions[1].actions[0].type === PathMusicActionType.If);
  assert(eventData.actions[1].actions[0].type === PathMusicActionType.If);
  assert(
    event.actions[1].actions[0].actions[0].type === PathMusicActionType.BranchTo
  );
  assert(
    eventData.actions[1].actions[0].actions[0].type ===
      PathMusicActionType.BranchTo
  );
  eventData.actions[1].actions[0].actions[0].node = id1;
  expect(event.actions[1].actions[0].actions[0].node).toEqual(id2);

  eventData.actions[1].actions = [];
  expect(event.actions[1].actions.length).toEqual(2);

  eventData.actions = [];
  expect(event.actions.length).toEqual(3);
});
