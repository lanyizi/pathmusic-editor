import { reactive, type ComputedRef, computed } from 'vue';

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

export interface Model {
  data: {
    tracks: PathMusicTrack[];
    nodes: PathMusicNode[];
    events: PathMusicEvent[];
    variables: [string, number][];
  };
  addNode(musicIndex: number, trackId: number): number;
  addNodeBranches(id: number, branch: PathMusicBranch): void;
  addEvent(event: PathMusicEvent): void;
  getSourceNodesByBranches(id: number): ComputedRef<PathMusicNode[]>;
  getSourceNodesByRouters(id: number): ComputedRef<PathMusicNode[]>;
  getNodeAssociatedEvents(id: number): ComputedRef<PathMusicEvent[]>;
}

export function createModel(
  tracks: PathMusicTrack[],
  nodes: PathMusicNode[],
  events: PathMusicEvent[],
  variables: [string, number][],
  routers: number[][]
): Model {
  const model = reactive({
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
          results[action.node].push(event);
        }
      }
    }
    return results;
  });
  return {
    data: model,
    addNode(musicIndex: number, trackId: number) {
      const id = model.nodes.length;
      model.nodes.push({
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
      return id;
    },
    addEvent(event: PathMusicEvent) {
      model.events.push(event);
    },
    addNodeBranches(id: number, branch: PathMusicBranch) {
      model.nodes[id].branches.push(branch);
    },
    getSourceNodesByBranches(id: number) {
      return computed(() => sourceNodesFromBranches.value[id]);
    },
    getSourceNodesByRouters(id: number) {
      return computed(() => sourceNodesFromRouters.value[id]);
    },
    getNodeAssociatedEvents(id: number) {
      return computed(() => eventsFromNodes.value[id]);
    },
  };
}
