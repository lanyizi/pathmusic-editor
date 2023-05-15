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
  numbranches: number;
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
