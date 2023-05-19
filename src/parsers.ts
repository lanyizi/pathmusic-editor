import {
  type PathMusicTrack,
  type PathMusicNode,
  type PathMusicBranch,
  type PathMusicEvent,
  PathMusicActionType,
  type PathMusicAction,
  Comparisons,
  Operators,
} from '@/model';
import type { Immutable } from '@/immutable';

export function parseTracks(content: string): PathMusicTrack[] {
  return eval(content);
}

export function dumpTracks(tracks: Immutable<PathMusicTrack[]>): string {
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
  numbranches: number;
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
        id: result.nodes.length,
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
  nodes: Immutable<PathMusicNode[]>,
  routes: Immutable<number[][]>
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
    const rawNode = {
      ...node,
      index: node.musicIndex,
      numbranches: node.branches.length,
    };
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
  function parseActionArguments(action: string, name: string) {
    if (!action.startsWith(`${name}(`)) {
      throw new Error(`Expected ${name} in ${action}`);
    }
    const splitted = action
      .slice(`${name}(`.length, -')'.length)
      .split(',')
      .map((s) => s.split('='));
    function string(name: string, index: number) {
      const value = splitted[index][1].trim();
      if (splitted[index][0].trim() !== name) {
        throw new Error(`Expected ${name} in ${action}`);
      }
      return value;
    }
    return {
      string,
      number(name: string, index: number) {
        return Number(string(name, index));
      },
    };
  }

  function parseActionOperation<Operation extends string>(
    action: string,
    operations: readonly Operation[],
    name?: string
  ) {
    if (name) {
      if (!action.startsWith(`${name}(`)) {
        throw new Error(`Expected ${name} in ${action}`);
      }
      action = action.slice(`${name}(`.length, -')'.length);
    }
    let includeLength = 0;
    let result;
    for (const operation of operations) {
      if (!action.includes(operation)) {
        continue;
      }
      if (operation.length < includeLength) {
        continue;
      }
      const [left, right] = action.split(operation).map((s) => s.trim());
      result = {
        left,
        right,
        operator: operation as Operation,
      };
      includeLength = operation.length;
    }
    if (!result) {
      throw new Error(`Expected ${operations.join(', ')} in ${action}`);
    }
    return result;
  }

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
          const condition = parseActionOperation(action, Comparisons, 'if');
          const actions: PathMusicAction[] = [];
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.If,
            left: condition.left,
            comparison: condition.operator,
            right: Number(condition.right),
            actions,
            track: getTrackId(comment),
          });
          actionsStack.push(actions);
          continue;
        }
        if (action.startsWith('else if(')) {
          actionsStack.pop();
          const condition = parseActionOperation(
            action,
            Comparisons,
            'else if'
          );
          const actions: PathMusicAction[] = [];
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.ElseIf,
            left: condition.left,
            comparison: condition.operator,
            right: Number(condition.right),
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
          continue;
        }
        if (action.startsWith('branchto(')) {
          const getArg = parseActionArguments(action, 'branchto');
          const node = getArg.number('node', 0);
          if (node > 0 && !nodes[node - 1]) {
            throw new Error(`Invalid node id in line ${i + 1}: ${line}`);
          }
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.BranchTo,
            node,
            ofsection: getArg.number('ofsection', 1),
            immediate: getArg.string('immediate', 2) === 'true',
            track: getTrackId(comment),
          });
          continue;
        }
        if (action.startsWith('wait(')) {
          const getArg = parseActionArguments(action, 'wait');
          const millisecs = getArg.string('millisecs', 1);
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.WaitTime,
            lowest: getArg.number('lowest', 0),
            millisecs:
              millisecs === 'PATH_TIMETONEXTNODE'
                ? millisecs
                : Number(millisecs),
            track: getTrackId(comment),
          });
          continue;
        }
        if (action.startsWith('fade(')) {
          const getArg = parseActionArguments(action, 'fade');
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.Fade,
            tovol: getArg.number('tovol', 0),
            id: getArg.string('id', 1),
            flip: getArg.number('flip', 2),
            ms: getArg.number('ms', 3),
            track: getTrackId(comment),
          });
          continue;
        }
        if (action.includes('=') && !action.includes('(')) {
          if (Operators.some((o) => action.includes(o))) {
            const { left, right, operator } = parseActionOperation(
              action,
              Operators
            );
            actionsStack[actionsStack.length - 1].push({
              type: PathMusicActionType.Calculate,
              left,
              operator,
              right: Number(right),
              track: getTrackId(comment),
            });
            continue;
          }

          const { left, right } = parseActionOperation(action, ['=']);
          actionsStack[actionsStack.length - 1].push({
            type: PathMusicActionType.SetValue,
            left,
            right: right === 'PATH_RANDOMSHORT' ? right : Number(right),
            track: getTrackId(comment),
          });
          continue;
        }
        throw new Error(`Unknown action in line ${i + 1}: ${line}`);
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
  variables: Immutable<[string, number][]>,
  events: Immutable<PathMusicEvent[]>
): string {
  function getNestedActions(source: Immutable<{ actions: PathMusicAction[] }>) {
    const result: Immutable<PathMusicAction | { type: 'endif' }>[] = [];
    for (let i = 0; i < source.actions.length; ++i) {
      result.push(source.actions[i]);
      const type = source.actions[i].type;
      const next = source.actions[i + 1]?.type;
      const hasNoElseIf =
        type === PathMusicActionType.If &&
        next !== PathMusicActionType.Else &&
        next !== PathMusicActionType.ElseIf;
      const nextIsEndIf = hasNoElseIf || type === PathMusicActionType.Else;
      if (nextIsEndIf) {
        result.push({ type: 'endif' });
      }
    }
    return result;
  }

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
    type OutputAction = Immutable<PathMusicAction | { type: 'endif' }>;
    const actions: OutputAction[] = getNestedActions(event);
    for (let i = 0; i < actions.length; ++i) {
      const action = actions[i];
      switch (action.type) {
        case 'endif':
          result.push(`\t\tend if`);
          break;
        case PathMusicActionType.If:
        case PathMusicActionType.ElseIf:
          result.push(
            `\t\t${action.type}(${action.left}${action.comparison}${action.right}) #${action.track}`
          );
          break;
        case PathMusicActionType.Else:
          result.push(`\t\telse #${action.track}`);
          break;
        case PathMusicActionType.WaitTime:
          result.push(
            `\t\twait(lowest=${action.lowest}, millisecs=${action.millisecs}) #${action.track}`
          );
          break;
        case PathMusicActionType.BranchTo:
          result.push(
            `\t\tbranchto(node=${action.node}, ofsection=${action.ofsection}, immediate=${action.immediate}) #${action.track}`
          );
          break;
        case PathMusicActionType.Fade:
          result.push(
            `\t\tfade(tovol=${action.tovol}, id=${action.id}, flip=${action.flip}, ms=${action.ms}) #${action.track}`
          );
          break;
        case PathMusicActionType.SetValue:
          result.push(`\t\t${action.left}=${action.right} #${action.track}`);
          break;
        case PathMusicActionType.Calculate:
          result.push(
            `\t\t${action.left}${action.operator}${action.right} #${action.track}`
          );
          break;
        default:
          throw new Error(`Unexpected action type ${(action as any).type}`);
      }
      if ('actions' in action) {
        actions.splice(i + 1, 0, ...getNestedActions(action));
      }
    }
    result.push(`\t],`);
    result.push(`},`);
  }
  return result.join('\n') + '\n';
}
