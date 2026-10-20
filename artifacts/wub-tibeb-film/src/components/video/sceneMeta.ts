export interface SceneDetails { title: string; filePath: string; }

export const SCENE_DETAILS: Record<string, SceneDetails> = {
  problem: { title: 'The holiday problem', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
  exchange: { title: 'Dress for dress', filePath: 'src/components/video/video_scenes/Scene2.tsx' },
  match: { title: 'A match is two dresses', filePath: 'src/components/video/video_scenes/Scene3.tsx' },
  confirm: { title: 'Talk, plan, confirm', filePath: 'src/components/video/video_scenes/Scene4.tsx' },
  tagline: { title: 'Wear. Share. Repeat.', filePath: 'src/components/video/video_scenes/Scene5.tsx' },
  lockup: { title: 'Lockup', filePath: 'src/components/video/video_scenes/Scene6.tsx' },
};
