import { expect, test } from 'vitest';
import {
  parseTracks,
  parseNodesAndRoutes,
  parseEvents,
  dumpTracks,
  dumpNodesAndRoutes,
  dumpEvents,
  dumpRa3MusicHeader,
} from '@/parsers';
import tracks from '@/assets/tests/tracks.txt?raw';
import nodesAndRoutes from '@/assets/tests/nodes.txt?raw';
import events from '@/assets/tests/events.txt?raw';
import ra3MusicHeader from '@/assets/tests/RA3Music.h?raw';

test('parseTrack', () => {
  const dumped = dumpTracks(parseTracks(tracks));
  expect(dumped).toBe(tracks);
});

test('parseNodesAndRoutes', () => {
  const parsed = parseNodesAndRoutes(nodesAndRoutes);
  const dumped = dumpNodesAndRoutes(parsed.nodes, parsed.routes);
  expect(dumped).toBe(nodesAndRoutes);
});

test('parseEvents', () => {
  const parsedTracks = parseTracks(tracks);
  const { nodes } = parseNodesAndRoutes(nodesAndRoutes);
  const parsed = parseEvents(events, parsedTracks, nodes);
  const dumped = dumpEvents(parsed.variables, parsed.events);
  expect(dumped).toBe(events);

  const generated = dumpEvents([], [{ name: 'gen_0x0', id: 0, actions: [] }]);
  expect(generated).toBe(
    'vars: {\n},\nevent: {\n\teventID: gen_0x0,\n\tactions:[\n\t],\n},\n'
  );

  const dumpedHeader = dumpRa3MusicHeader(parsedTracks, parsed.events).replace(
    /\r\n/g,
    '\n'
  );
  const sortedDumped = dumpedHeader.split('\n').sort();
  const sortedOriginal = ra3MusicHeader
    .replace(/\r\n/g, '\n')
    .split('\n')
    .sort();
  expect(sortedDumped).toEqual(sortedOriginal);
});

test('parseEventActions20230528bug', () => {
  const parsedTracks = parseTracks(tracks);
  const { nodes } = parseNodesAndRoutes(nodesAndRoutes);
  const event = `vars: {
    },
    event: {
    eventID: PATH_EVENT_Corona_BGM_Submit_0xdddddd,
    actions:[
      if(vars['cor_inputstep']==2) #0
      if(vars['cor_bgmtype']==1) #0
      if(vars['cor_bgmgroup']<=1) #0
      branchto(node=0, ofsection=-1, immediate=false) #0
      else if(vars['cor_bgmgroup']==2) #0
      branchto(node=1, ofsection=-1, immediate=false) #0
      else if(vars['cor_bgmgroup']==3) #0
      branchto(node=2, ofsection=-1, immediate=false) #0
      else if(vars['cor_bgmgroup']==4) #0
      branchto(node=3, ofsection=-1, immediate=false) #0
      else if(vars['cor_bgmgroup']>=5) #0
      branchto(node=4, ofsection=-1, immediate=false) #0
      end if
      end if
      end if
      vars['cor_inputstep']+=1 #0
      vars['cor_input']=0 #0
      vars['cor_set_ctrl']=0 #0
    ],
  },\n`;
  const parsed = parseEvents(event, parsedTracks, nodes);
  expect(
    dumpEvents(parsed.variables, parsed.events)
      .split('\n')
      .map((l) => l.trim())
      .join('\n')
  ).toBe(
    event
      .split('\n')
      .map((l) => l.trim())
      .join('\n')
  );
});
