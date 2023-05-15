import {
  type PathMusicTrack,
  type PathMusicNode,
  type PathMusicBranch,
  type PathMusicEvent,
  PathMusicActionType,
  type PathMusicAction,
} from '@/model';

export function parseTrack(content: string): PathMusicTrack[] {
  return eval(content);
}

export function dumpTrack(tracks: PathMusicTrack[]): string {
  const allowedKeys: (keyof PathMusicTrack)[] = [
    'path',
    'startingsample',
    'numsubbanks',
    'purgemode',
    'muschecksum',
    'maxaram',
    'maxmram',
  ];
  const texts = tracks.map((track) => {
    const fields = allowedKeys
      .map((key) => `${key}: ${JSON.stringify(track[key])}`)
      .join(', ');
    return `\t{ ${fields}},`;
  });
  return ['[', ...texts, ']\n'].join('\n');
}

export interface PathMusicNodeParseResult {
  nodes: PathMusicNode[];
  routes: number[][];
}

type RawPathMusicNode = Omit<PathMusicNode, 'musicIndex' | 'branches'> & {
  index: number;
};

export function parseNodesAndRoutes(content: string): PathMusicNodeParseResult {
  type Element = RawPathMusicNode | PathMusicBranch | number[];
  const elements: Element[] = eval(content);

  const result: PathMusicNodeParseResult = {
    nodes: [],
    routes: [],
  };

  for (const element of elements) {
    if (Array.isArray(element)) {
      result.routes.push(element);
    } else if ('index' in element) {
      result.nodes.push({
        ...element,
        musicIndex: element.index,
        branches: [],
      });
    } else if ('controlmin' in element) {
      result.nodes[result.nodes.length - 1].branches.push(element);
    } else {
      throw new Error('Unknown element');
    }
  }
  return result;
}

export function dumpNodesAndRoutes(
  nodes: PathMusicNode[],
  routes: number[][]
): string {
  const allowedTrackNodeKeys: (keyof RawPathMusicNode)[] = [
    'index',
    'trackID',
    'sectionID',
    'repeat',
    'routerID',
    'numbranches',
    'beats',
    'bars',
    'partID',
    'notes',
  ];
  const allowedBranchKeys: (keyof PathMusicBranch)[] = [
    'controlmin',
    'controlmax',
    'dstnode',
  ];
  let result = '[\n';
  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i];
    const rawNode = { ...node, index: node.musicIndex };
    const fields = allowedTrackNodeKeys
      .map((key) => `${key}: ${rawNode[key]}`)
      .join(', ');
    result += `{${fields}}, //${i}\n`;
    for (const branch of node.branches) {
      const fields = allowedBranchKeys
        .map((key) => `${key}: ${branch[key]}`)
        .join(', ');
      result += `\t{${fields}},\n`;
    }
  }
  for (let i = 0; i < routes.length; ++i) {
    result += `[${routes[i].join(',')}], //${i}\n`;
  }
  result += ']\n';
  return result;
}

export interface PathMusicEventParseResult {
  variables: [string, number][];
  events: PathMusicEvent[];
}

export function parseEvents(
  content: string,
  tracks: PathMusicTrack[],
  nodes: PathMusicNode[]
): PathMusicEventParseResult {
  /* example:
vars: {
  player: 0,
  variation: 0,
  shelltrack: 0,
  a05incoming: 0,
},
event: {
  eventID: PATH_EVENT_SetPlayerAllied_0xd9047,
  actions:[
    vars['player']=1 #0
    vars['variation']=PATH_RANDOMSHORT #0
    vars['variation']%=2 #0
  ],
},
event: {
  eventID: PATH_EVENT_SetAdvantageEnemy_0xff1a03,
  actions:[
    if(vars['player']==0) #0
    branchto(node=112, ofsection=-1, immediate=false) #0
    else if(vars['player']==1) #0
    branchto(node=454, ofsection=-1, immediate=false) #0
    else if(vars['player']==2) #0
    branchto(node=680, ofsection=-1, immediate=false) #0
    else #0
    branchto(node=112, ofsection=-1, immediate=false) #0
    end if
  ],
},
  */
  enum ParseState {
    None,
    Vars,
    EndVars,
    Event,
    Actions,
    EndActions,
    EndEvent,
  }
  const result: PathMusicEventParseResult = {
    variables: [],
    events: [],
  };
  const lines = content.split('\n');
  let state = ParseState.None;
  const actionsStack: PathMusicAction[][] = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    switch (state) {
      case ParseState.None:
        if (line.startsWith('vars:')) {
          state = ParseState.Vars;
          continue;
        }
        if (line.startsWith('event:')) {
          state = ParseState.Event;
          continue;
        }
        throw new Error(`Expected 'vars' or 'event' in line ${i + 1}: ${line}`);
      case ParseState.Vars: {
        if (line.startsWith('}')) {
          state = ParseState.EndVars;
          continue;
        }
        const [key, value] = line.split(':');
        result.variables.push([key.trim(), parseInt(value.trim())]);
        break;
      }
      case ParseState.EndVars:
        if (line.startsWith('event:')) {
          state = ParseState.Event;
          continue;
        }
        throw new Error(`Expected 'event' in line ${i + 1}: ${line}`);
      case ParseState.Event:
        if (line.startsWith('}')) {
          state = ParseState.EndEvent;
          continue;
        }
        if (line.startsWith('	actions:[')) {
          state = ParseState.Actions;
          continue;
        }
        if (line.startsWith('	eventID:')) {
          const eventID = line.split(':')[1].trim();
          const actions: PathMusicAction[] = [];
          result.events.push({
            name: eventID,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: parseInt(eventID.split('_').pop()!),
            actions,
          });
          actionsStack.push(actions);
          continue;
        }
        throw new Error(
          `Unexpected line ${i + 1} when parsing event id: ${line}`
        );
      case ParseState.Actions: {
        if (line.trim().startsWith(']')) {
          state = ParseState.EndActions;
          continue;
        }
        const [action, comment] = line.split('#').map((s) => s.trim());
        // eslint-disable-next-line no-inner-declarations
        function getTrackId(comment?: string) {
          const trackId = parseInt(comment || '');
          if (!tracks[trackId]) {
            throw new Error(`Invalid track id in line ${i + 1}: ${line}`);
          }
          return trackId;
        }
        if (action.startsWith('if(')) {
          const condition = action.slice('if('.length, -')'.length);
          const actions: PathMusicAction[] = [];
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.If,
            condition,
            actions,
            track: getTrackId(comment),
          });
          actionsStack.push(actions);
          continue;
        }
        if (action.startsWith('else if(')) {
          actionsStack.pop();
          const condition = action.slice('else if('.length, -')'.length);
          const actions: PathMusicAction[] = [];
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.ElseIf,
            condition,
            actions,
            track: getTrackId(comment),
          });
          actionsStack.push(actions);
          continue;
        }
        if (action.startsWith('else')) {
          actionsStack.pop();
          const actions: PathMusicAction[] = [];
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.Else,
            actions,
            track: getTrackId(comment),
          });
          actionsStack.push(actions);
          continue;
        }
        if (action.startsWith('end if')) {
          actionsStack.pop();
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.EndIf,
          });
          continue;
        }
        if (action.startsWith('branchto(')) {
          const args = action
            .slice('branchto('.length, -')'.length)
            .split(',')
            .map((s) => s.split('=')[1].trim());
          const node = parseInt(args[0]);
          if (node > 0 && !nodes[node - 1]) {
            throw new Error(`Invalid node id in line ${i + 1}: ${line}`);
          }
          const ofsection = parseInt(args[1]);
          const immediate = args[2] === 'true';
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.BranchTo,
            node,
            ofsection,
            immediate,
            track: getTrackId(comment),
          });
          continue;
        }
        actionsStack[actionsStack.length - 1].push({
          type: PathMusicActionType.Generic,
          data: action,
          track: getTrackId(comment),
        });
        break;
      }
      case ParseState.EndActions:
        actionsStack.pop();
        if (line.startsWith('}')) {
          state = ParseState.EndEvent;
          continue;
        }
        throw new Error(`Expected '}' in line ${i + 1}: ${line}`);
      case ParseState.EndEvent:
        if (line.startsWith('event:')) {
          state = ParseState.Event;
          continue;
        }
        if (line.trim().length === 0) {
          continue;
        }
        throw new Error(`Expected 'event' in line ${i + 1}: ${line}`);
      default:
        throw new Error(`Unexpected state ${state}`);
    }
  }

  if (actionsStack.length !== 0) {
    throw new Error(`Expected all actions to be closed`);
  }
  if (state !== ParseState.EndEvent) {
    throw new Error(
      `Expected all events to be closed, got ${ParseState[state]}`
    );
  }
  return result;
}

export function dumpEvents(
  variables: [string, number][],
  events: PathMusicEvent[]
): string {
  const result = [];
  result.push('vars: {');
  for (const [key, value] of variables) {
    result.push(`\t${key}: ${value},`);
  }
  result.push('},');
  for (const event of events) {
    result.push(`event: {`);
    result.push(`\teventID: ${event.name}`);
    result.push(`\tactions:[`);
    const actions = [...event.actions];
    for (let i = 0; i < actions.length; ++i) {
      const action = actions[i];
      switch (action.type) {
        case PathMusicActionType.If:
          result.push(`\t\tif(${action.condition}) #${action.track}`);
          break;
        case PathMusicActionType.ElseIf:
          result.push(`\t\telse if(${action.condition}) #${action.track}`);
          break;
        case PathMusicActionType.Else:
          result.push(`\t\telse #${action.track}`);
          break;
        case PathMusicActionType.EndIf:
          result.push(`\t\tend if`);
          break;
        case PathMusicActionType.BranchTo:
          result.push(
            `\t\tbranchto(node=${action.node}, ofsection=${action.ofsection}, immediate=${action.immediate}) #${action.track}`
          );
          break;
        case PathMusicActionType.Generic:
          result.push(`\t\t${action.data} #${action.track}`);
          break;
        default:
          throw new Error(`Unexpected action type`);
      }
      if ('actions' in action) {
        actions.splice(i + 1, 0, ...action.actions);
      }
    }
    result.push(`\t],`);
    result.push(`},`);
  }
  return result.join('\n') + '\n';
}
