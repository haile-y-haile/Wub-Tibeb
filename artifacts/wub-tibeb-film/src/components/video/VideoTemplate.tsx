import { useEffect, useRef } from 'react';
import { VideoCanvas, type VideoAspectRatio, useVideoPlayer, VideoPausedContext } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS = {
  problem: 4550,
  exchange: 5350,
  match: 5450,
  confirm: 4800,
  tagline: 5350,
  lockup: 4500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  problem: Scene1, exchange: Scene2, match: Scene3, confirm: Scene4, tagline: Scene5, lockup: Scene6,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let ms = 0;
  for (const [k, d] of Object.entries(SCENE_DURATIONS)) { out[k] = ms / 1000; ms += d; }
  return out;
})();
const AUDIO_SEEK_EPSILON_SEC = 0.18;
const CAMERA = [
  { scale: 1, rotate: 0 }, { scale: 1.01, rotate: -0.4 }, { scale: 1, rotate: 0.3 },
  { scale: 1.01, rotate: 0 }, { scale: 1.015, rotate: -0.3 }, { scale: 1, rotate: 0 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Math.max(0, Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey));
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSceneKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    if (paused) { audio.pause(); return; }
    if (lastSceneKeyRef.current !== currentSceneKey) {
      lastSceneKeyRef.current = currentSceneKey;
      const target = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(audio.currentTime - target) > AUDIO_SEEK_EPSILON_SEC) audio.currentTime = target;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: 'var(--ivory)' }}>
        <motion.div className="absolute inset-0" initial={false} animate={CAMERA[sceneIndex]} transition={{ duration: 4, ease: 'easeOut' }}>
          <AnimatePresence mode="sync">
            {SceneComponent && <SceneComponent key={currentSceneKey} />}
          </AnimatePresence>
        </motion.div>
        <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
