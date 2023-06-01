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
