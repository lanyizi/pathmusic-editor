import type { Immutable } from '@/immutable';

export type PathMusicAudio =
  | PathMusicAudioFile
  | PathMusicAudioSlice
  | PathMusicAudioVolume
  | PathMusicAudioMix;

export interface PathMusicAudioFile {
  type: 'file';
  track: number;
  id: number;
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

export function normalizeAudio(
  audio: Partial<Immutable<PathMusicAudio>> | undefined
): PathMusicAudio {
  const defaultAudio: PathMusicAudioFile = { type: 'file', track: 0, id: 0 };
  if (typeof audio !== 'object' || audio === null) {
    return defaultAudio;
  }
  const getNumber = (value: any) => (isNaN(Number(value)) ? 0 : Number(value));
  switch (audio.type) {
    case 'file':
      return {
        type: 'file',
        track: getNumber(audio.track),
        id: getNumber(audio.id),
      };
    case 'slice': {
      const start = getNumber(audio.start);
      const end = getNumber(audio.end);
      return {
        type: 'slice',
        source: normalizeAudio(audio.source),
        waitSecondsBeforeStart: getNumber(audio.waitSecondsBeforeStart),
        start,
        end: end < start ? start : end,
      };
    }
    case 'volume':
      return {
        type: 'volume',
        source: normalizeAudio(audio.source),
        startVolume: getNumber(audio.startVolume),
        endVolume: getNumber(audio.endVolume),
      };
    case 'mix':
      return {
        type: 'mix',
        sources: audio.sources?.map(normalizeAudio) ?? [],
      };
  }
  return defaultAudio;
}

export function copyPathMusicAudio<T extends PathMusicAudio>(
  audio: Immutable<T>
): T {
  switch (audio.type) {
    case 'file':
      return { ...audio } as T;
    case 'slice':
      return { ...audio, source: copyPathMusicAudio(audio.source) } as T;
    case 'volume':
      return { ...audio, source: copyPathMusicAudio(audio.source) } as T;
    case 'mix':
      return { ...audio, sources: audio.sources.map(copyPathMusicAudio) } as T;
  }
}
