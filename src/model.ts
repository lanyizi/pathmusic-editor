import { computed, shallowReactive, type Ref, type InjectionKey } from 'vue';
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
  // condition action
  If = 'if',
  ElseIf = 'else if',
  Else = 'else',
  // all other actions
  WaitTime = 'waittime',
  WaitBeat = 'waitbeat',
  BranchTo = 'branchto',
  Fade = 'fade',
  DryLevelFade = 'drylevelfade',
  SfxFade = 'sfxfade',
  SetValue = 'setvalue',
  Event = 'event',
  FilterOn = 'filteron',
  FilterOff = 'filteroff',
  FilterClear = 'filterclear',
  Callback = 'callback',
  Calculate = 'calculate',
  Pause = 'pause',
  LoadBank = 'loadbank',
  PitchFade = 'pitchfade',
  StretchFade = 'stretchfade',
}

export const Comparisons = ['==', '!=', '>', '<', '>=', '<='] as const;
export type Comparison = (typeof Comparisons)[number];

export const Operators = ['+=', '-=', '*=', '/=', '%='] as const;
export type Operator = (typeof Operators)[number];

export const SetValueSpecialLeftValues = [
  'PATH_VOLUME',
  'PATH_CONTROLLER',
] as const;

export const WaitTimeSpecialValues = [
  'PATH_TIMETONEXTNODE',
  'PATH_TIMETONEXTBEAT',
  'PATH_TIMETONEXTBAR',
] as const;
export type WaitTimeSpecialValue = (typeof WaitTimeSpecialValues)[number];

export const FadeTypes = [
  'PATH_FADE_LINEAR',
  'PATH_FADE_EQPOWER',
  'PATH_FADE_EXPONENTIAL',
  'PATH_FADE_COSINE',
] as const;
export type FadeType = (typeof FadeTypes)[number];

interface BasePathMusicAction {
  type: PathMusicActionType;
  track?: number;
}
interface PathMusicConditionCheck extends BasePathMusicAction {
  type: PathMusicActionType.If | PathMusicActionType.ElseIf;
  left: string;
  comparison: Comparison;
  right: number;
  track: number;
}

interface PathMusicConditionAction extends BasePathMusicAction {
  type:
    | PathMusicActionType.If
    | PathMusicActionType.Else
    | PathMusicActionType.ElseIf;
  actions: PathMusicAction[];
  track: number;
}

export type PathMusicAction =
  | IfAction
  | ElseAction
  | ElseIfAction
  | WaitTimeAction
  | BranchToAction
  | FadeAction
  | SetValueAction
  | CalculateAction;

export interface IfAction
  extends PathMusicConditionCheck,
    PathMusicConditionAction {
  type: PathMusicActionType.If;
}

export interface ElseIfAction
  extends PathMusicConditionCheck,
    PathMusicConditionAction {
  type: PathMusicActionType.ElseIf;
}

export interface ElseAction extends PathMusicConditionAction {
  type: PathMusicActionType.Else;
}

export interface WaitTimeAction extends BasePathMusicAction {
  type: PathMusicActionType.WaitTime;
  lowest: number;
  millisecs: number | WaitTimeSpecialValue;
}

export interface BranchToAction extends BasePathMusicAction {
  type: PathMusicActionType.BranchTo;
  node: number;
  offsection: number;
  immediate: boolean;
  track: number;
}

export interface FadeAction extends BasePathMusicAction {
  type: PathMusicActionType.Fade;
  tovol: number;
  id: FadeType;
  flip: number;
  ms: number;
  track: number;
}

export interface SetValueAction extends BasePathMusicAction {
  type: PathMusicActionType.SetValue;
  left: string;
  right: number | 'PATH_RANDOMSHORT';
  track: number;
}

export interface CalculateAction extends BasePathMusicAction {
  type: PathMusicActionType.Calculate;
  left: string;
  operator: Operator;
  right: number;
  track: number;
}

export function createEventAction(
  type: PathMusicActionType,
  model: Model
): PathMusicAction {
  if (model.data.tracks.length === 0) {
    throw new Error('No tracks');
  }
  const track = 0;
  switch (type) {
    case PathMusicActionType.If:
    case PathMusicActionType.ElseIf:
      if (model.data.variables.length === 0) {
        throw new Error('No variables');
      }
      return {
        type,
        left: `vars['${model.data.variables[0][0]}']`,
        comparison: '==',
        right: 0,
        actions: [],
        track,
      } as IfAction | ElseIfAction;
    case PathMusicActionType.Else:
      return {
        type,
        actions: [],
        track,
      } as ElseAction;
    case PathMusicActionType.WaitTime:
      return {
        type,
        lowest: 0,
        millisecs: 0,
        track,
      } as WaitTimeAction;
    case PathMusicActionType.BranchTo:
      return {
        type,
        node: -1,
        offsection: -1,
        immediate: false,
        track,
      } as BranchToAction;
    case PathMusicActionType.Fade:
      return {
        type,
        tovol: 0,
        id: 'PATH_FADE_LINEAR',
        flip: 0,
        ms: 0,
        track,
      } as FadeAction;
    case PathMusicActionType.SetValue:
      if (model.data.variables.length === 0) {
        throw new Error('No variables');
      }
      return {
        type,
        left: `vars['${model.data.variables[0][0]}']`,
        right: 0,
        track,
      } as SetValueAction;
    case PathMusicActionType.Calculate:
      return {
        type,
        left: `vars['${model.data.variables[0][0]}']`,
        operator: '+=',
        right: 0,
        track,
      } as CalculateAction;
  }
  throw new Error(`Invalid action type ${type}`);
}
export function copyNode(node: Immutable<PathMusicNode>) {
  return {
    ...node,
    branches: node.branches.map((b) => ({ ...b })),
  };
}

export function copyEventAction<T extends PathMusicAction>(
  action: Immutable<T>,
  shallow?: boolean
): T {
  if (!shallow && 'actions' in action) {
    return {
      ...action,
      actions: action.actions.map((a) => copyEventAction(a)),
    } as T;
  }
  return { ...action } as T;
}

export function copyEvent(event: Immutable<PathMusicEvent>) {
  return {
    ...event,
    actions: event.actions.map((a) => copyEventAction(a)),
  };
}

export function copyVariables(variables: Immutable<[string, number][]>) {
  return variables.map((v) => {
    const name = v[0] as string;
    const value = v[1] as number;
    return [name.slice(0, Math.min(15, name.length)), value] as [
      string,
      number
    ];
  });
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
  addEvent(event: PathMusicEvent): Immutable<PathMusicEvent>;
  getEvent(id: number | string): Immutable<PathMusicEvent> | null;
  setEvent(event: PathMusicEvent): Immutable<PathMusicEvent>;
  setVariables(variables: [string, number][]): void;
  getSourceNodesByBranches(id: number): Immutable<PathMusicNode>[];
  getSourceNodesByRouters(id: number): Immutable<PathMusicNode>[];
  getNodeAssociatedEvents(id: number): Immutable<PathMusicEvent>[];
  getBranchDestinationNodes(id: number): Immutable<PathMusicNode>[];
  getSpecialValueAssociatedEvents(
    specialValue: string
  ): Immutable<PathMusicEvent>[];
  getVariableAssociatedEvents(name: string): Immutable<PathMusicEvent>[];
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
      const actionStack = [...event.actions];
      while (actionStack.length > 0) {
        const action = actionStack.pop()!;
        if ('actions' in action) {
          actionStack.push(...action.actions);
        }
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
  const eventsFromVariables = computed(() => {
    const namedVariables: Record<string, PathMusicEvent[]> = {};
    const specialValues: Record<string, PathMusicEvent[]> = {};
    const tryAddEvent = (key: string, event: PathMusicEvent) => {
      let results;
      let variable;
      if (key.startsWith('PATH_')) {
        results = specialValues;
        variable = key;
      } else {
        results = namedVariables;
        [, variable] = /vars\['(.*)'\]/.exec(key) ?? [];
      }
      if (!variable) {
        return;
      }
      if (!results[variable]) {
        results[variable] = [];
      }
      if (results[variable].includes(event)) {
        return;
      }
      results[variable].push(event);
    };
    for (const event of model.events) {
      const actionStack = [...event.actions];
      while (actionStack.length > 0) {
        const action = actionStack.pop()!;
        if ('actions' in action) {
          actionStack.push(...action.actions);
        }
        switch (action.type) {
          case PathMusicActionType.If:
          case PathMusicActionType.ElseIf:
          case PathMusicActionType.SetValue:
          case PathMusicActionType.Calculate:
            tryAddEvent(action.left, event);
            if (typeof action.right !== 'number') {
              tryAddEvent(action.right, event);
            }
            break;
        }
      }
    }
    return { namedVariables, specialValues };
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
      const newArray = model.events.concat(copyEvent(event));
      model.events = newArray;
      return newArray.slice(-1)[0];
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
    setVariables(variables: [string, number][]) {
      model.variables = copyVariables(variables);
    },
    getSourceNodesByBranches: (id) => getArrayAt(sourceNodesFromBranches, id),
    getSourceNodesByRouters: (id) => getArrayAt(sourceNodesFromRouters, id),
    getNodeAssociatedEvents: (id) => getArrayAt(eventsFromNodes, id),
    getBranchDestinationNodes: (id) =>
      (model.nodes[id]?.branches ?? [])
        .filter((branch) => branch.dstnode !== id)
        .map(({ dstnode }) => model.nodes[dstnode])
        .filter((n) => !!n),
    getVariableAssociatedEvents: (name) =>
      eventsFromVariables.value.namedVariables[name] ?? [],
    getSpecialValueAssociatedEvents: (specialValue) =>
      eventsFromVariables.value.specialValues[specialValue] ?? [],
  };
}

export function countEventActions(event: Immutable<PathMusicEvent>) {
  let count = 0;
  const actionStack = [...event.actions];
  while (actionStack.length > 0) {
    const action = actionStack.pop()!;
    ++count;
    if ('actions' in action) {
      actionStack.push(...action.actions);
    }
    if (action.type === PathMusicActionType.If) {
      ++count; // for end if
    }
  }
  return count;
}

export const modelKey = Symbol('model') as InjectionKey<Ref<Model>>;
