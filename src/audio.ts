export type PathMusicAudio =
  | PathMusicAudioFile
  | PathMusicAudioSlice
  | PathMusicAudioVolume
  | PathMusicAudioMix;

export interface PathMusicAudioFile {
  type: 'file';
  id: string;
}
export interface PathMusicAudioSlice {
  type: 'slice';
  source: PathMusicAudio;
  waitSecondsBeforeStart: number;
  start: number;
  end: number;
}
export interface PathMusicAudioVolume {
  type: 'volume';
  source: PathMusicAudio;
  startVolume: number;
  endVolume: number;
}
export interface PathMusicAudioMix {
  type: 'mix';
  sources: PathMusicAudio[];
}

export function parseAudioDescription(text: string): PathMusicAudio {
  // parse a single line to a PathMusicAudio.
  // example: mix(file('id1'), slice(0, 0, 1, file('id2')), volume(0.5, 1, file('id3')))

  const stack: Partial<PathMusicAudio>[] = [];
  while (text.length > 0) {
    text = text.trim();
    if (text.startsWith(')')) {
      text = text.slice(1).trim();
      const audio = stack.pop();
      if (!audio) {
        throw new Error('Unexpected )');
      }
      if (stack.length === 0) {
        return audio as PathMusicAudio;
      }
      const parent = stack[stack.length - 1];
      if (parent.type === 'slice' || parent.type === 'volume') {
        if (parent.source) {
          throw new Error(
            `Duplicate source of ${parent.type}: ${audio.type} and ${parent.source.type}`
          );
        }
        parent.source = audio as PathMusicAudio;
      } else if (parent.type === 'mix') {
        const sources = parent.sources ?? [];
        sources.push(audio as PathMusicAudio);
        parent.sources = sources;
        if (text.startsWith(',')) {
          text = text.slice(1);
        }
      } else {
        throw new Error(
          `Unexpected audio type ${audio.type} as source of ${parent.type}`
        );
      }
    } else if (text.startsWith('file(')) {
      text = text.slice('file('.length);
      const id = text.slice(0, text.indexOf(')'));
      stack.push({ type: 'file', id });
      text = text.slice(id.length);
    } else if (text.startsWith('slice(')) {
      text = text.slice('slice('.length);
      const waitText = text.slice(0, text.indexOf(','));
      const waitSecondsBeforeStart = parseFloat(waitText);
      text = text.slice(waitText.length + 1);
      const startText = text.slice(0, text.indexOf(','));
      const start = parseFloat(startText);
      text = text.slice(startText.length + 1);
      const endText = text.slice(0, text.indexOf(','));
      const end = parseFloat(endText);
      text = text.slice(endText.length + 1);
      stack.push({
        type: 'slice',
        waitSecondsBeforeStart,
        start,
        end,
      });
    } else if (text.startsWith('volume(')) {
      text = text.slice('volume('.length);
      const startVolumeText = text.slice(0, text.indexOf(','));
      const startVolume = parseFloat(startVolumeText);
      text = text.slice(startVolumeText.length + 1);
      const endVolumeText = text.slice(0, text.indexOf(','));
      const endVolume = parseFloat(endVolumeText);
      text = text.slice(endVolumeText.length + 1);
      stack.push({
        type: 'volume',
        startVolume,
        endVolume,
      });
    } else if (text.startsWith('mix(')) {
      text = text.slice('mix('.length);
      stack.push({
        type: 'mix',
      });
    } else {
      throw new Error(`Unexpected audio type: ${text}`);
    }
  }
  throw new Error('Unexpected end of text');
}
