import { computed, shallowReactive, type Ref } from 'vue';
import type { Immutable } from '@/immutable';

export interface PathMusicTrack {
  path: string;
  startingsample: number;
  numsubbanks: number;
  purgemode: number;
  muschecksum: number;
  maxaram: number;
  maxmram: number;
}

// {index: -1, trackID: 1, sectionID: 0, repeat: 0, routerID: 0, numbranches: 0, beats: 1, bars: 1, partID: 797, notes: 0}, //1889
export interface PathMusicNode {
  id: number;
  musicIndex: number;
  trackID: number;
  sectionID: number;
  repeat: number;
  routerID: number;
  beats: number;
  bars: number;
  partID: number;
  notes: number;
  branches: PathMusicBranch[];
}

// {controlmin: 0, controlmax: 127, dstnode: 1889}
export interface PathMusicBranch {
  controlmin: number;
  controlmax: number;
  dstnode: number;
}

export interface PathMusicEvent {
  name: string;
  id: number;
  actions: PathMusicAction[];
}

export enum PathMusicActionType {
  Generic = 'action',
  If = 'if',
  Else = 'else',
  ElseIf = 'elseif',
  EndIf = 'endif',
  BranchTo = 'branchto',
}

interface BasePathMusicAction {
  type: PathMusicActionType;
  track?: number;
}
interface PathMusicConditionAction extends BasePathMusicAction {
  actions: PathMusicAction[];
  track: number;
}

export type PathMusicAction =
  | PathMusicGenericAction
  | IfAction
  | ElseAction
  | ElseIfAction
  | EndIfAction
  | BranchToAction;

export interface PathMusicGenericAction extends BasePathMusicAction {
  type: PathMusicActionType.Generic;
  data: string;
  track: number;
}

export interface IfAction extends PathMusicConditionAction {
  type: PathMusicActionType.If;
  condition: string;
}

export interface ElseAction extends PathMusicConditionAction {
  type: PathMusicActionType.Else;
}

export interface ElseIfAction extends PathMusicConditionAction {
  type: PathMusicActionType.ElseIf;
  condition: string;
}

export interface EndIfAction extends BasePathMusicAction {
  type: PathMusicActionType.EndIf;
}

export interface BranchToAction extends BasePathMusicAction {
  type: PathMusicActionType.BranchTo;
  node: number;
  ofsection: number;
  immediate: boolean;
  track: number;
}

export function copyNode(node: Immutable<PathMusicNode>) {
  return {
    ...node,
    branches: node.branches.map((b) => ({ ...b })),
  };
}

export function copyEvent(event: Immutable<PathMusicEvent>) {
  function copyAction(action: Immutable<PathMusicAction>): PathMusicAction {
    if ('actions' in action) {
      return {
        ...action,
        actions: action.actions.map((a) => copyAction(a)),
      };
    }
    return { ...action };
  }
  return {
    ...event,
    actions: event.actions.map(copyAction),
  };
}

export interface Model {
  data: Immutable<{
    tracks: PathMusicTrack[];
    nodes: PathMusicNode[];
    events: PathMusicEvent[];
    variables: [string, number][];
    routers: number[][];
  }>;
  addNode(musicIndex: number, trackId: number): number;
  setNode(node: PathMusicNode): Immutable<PathMusicNode>;
  addEvent(event: PathMusicEvent): void;
  getEvent(id: number | string): Immutable<PathMusicEvent> | null;
  setEvent(event: PathMusicEvent): Immutable<PathMusicEvent>;
  getSourceNodesByBranches(id: number): Immutable<PathMusicNode>[];
  getSourceNodesByRouters(id: number): Immutable<PathMusicNode>[];
  getNodeAssociatedEvents(id: number): Immutable<PathMusicEvent>[];
  getBranchDestinationNodes(id: number): Immutable<PathMusicNode>[];
}

export function createModel(
  tracks: PathMusicTrack[],
  nodes: PathMusicNode[],
  events: PathMusicEvent[],
  variables: [string, number][],
  routers: number[][]
): Model {
  function getArrayAt<T>(array: Ref<T[][]>, id: number) {
    if (!array.value[id]) {
      return [];
    }
    return array.value[id];
  }

  const model = shallowReactive({
    tracks,
    nodes,
    events,
    routers,
    variables,
  });
  const sourceNodesFromBranches = computed(() => {
    const results: PathMusicNode[][] = model.nodes.map(() => []);
    for (const node of model.nodes) {
      for (const branch of node.branches) {
        if (branch.dstnode !== 65535) {
          results[branch.dstnode].push(node);
        }
      }
    }
    return results;
  });
  const sourceNodesFromRouters = computed(() => {
    const results: PathMusicNode[][] = model.nodes.map(() => []);
    for (const node of model.nodes) {
      const router = model.routers[node.routerID - 1];
      if (!router) {
        continue;
      }
      for (const dstnode of router) {
        results[dstnode].push(node);
      }
    }
    return results;
  });
  const eventsFromNodes = computed(() => {
    const results: PathMusicEvent[][] = model.nodes.map(() => []);
    for (const event of model.events) {
      for (const action of event.actions) {
        if (action.type === PathMusicActionType.BranchTo) {
          const events = results[action.node];
          if (events) {
            events.push(event);
          }
        }
      }
    }
    return results;
  });
  return {
    data: model,
    addNode(musicIndex, trackId) {
      const id = model.nodes.length;
      const newArray = model.nodes.concat({
        id,
        musicIndex,
        trackID: trackId,
        sectionID: 0,
        repeat: 0,
        routerID: 0,
        beats: 1,
        bars: 1,
        partID: 0,
        notes: 0,
        branches: [],
      });
      model.nodes = newArray;
      return id;
    },
    setNode(node) {
      const newArray = model.nodes.slice();
      newArray[node.id] = copyNode(node);
      model.nodes = newArray;
      return newArray[node.id];
    },
    addEvent(event) {
      const newArray = model.events.concat(event);
      model.events = newArray;
    },
    getEvent(id) {
      if (typeof id === 'string') {
        return model.events.find((e) => e.name === id) ?? null;
      }
      return model.events.find((e) => e.id === id) ?? null;
    },
    setEvent(event) {
      const newArray = model.events.slice();
      const index = newArray.findIndex((e) => e.id === event.id);
      newArray[index] = copyEvent(event);
      model.events = newArray;
      return newArray[index];
    },
    getSourceNodesByBranches: (id) => getArrayAt(sourceNodesFromBranches, id),
    getSourceNodesByRouters: (id) => getArrayAt(sourceNodesFromRouters, id),
    getNodeAssociatedEvents: (id) => getArrayAt(eventsFromNodes, id),
    getBranchDestinationNodes: (id) =>
      (model.nodes[id]?.branches ?? [])
        .filter((branch) => branch.dstnode !== id)
        .map(({ dstnode }) => model.nodes[dstnode])
        .filter((n) => !!n),
  };
}
