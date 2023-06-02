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
