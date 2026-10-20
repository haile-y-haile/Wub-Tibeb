import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';
import { EASE, img } from '../shared';

function Card({ n, tag, chips, side, liked, likeLabel, joined, split }: {
  n: number; tag: string; chips: string; side: -1 | 1; liked: boolean; likeLabel: string; joined: boolean; split: boolean;
}) {
  const restX = joined ? side * 15 : side * 22;
  return (
    <motion.div className="absolute" style={{ left: '50%', top: '33%', width: '27vmin', height: '58%', marginLeft: '-13.5vmin' }}
      initial={{ x: `${side * 70}vw`, rotate: side * 18 }}
      animate={{ x: split ? `${side * 70}vw` : `${restX}vw`, rotate: joined ? side * 3 : side * 8 }}
      transition={split ? { duration: 0.6, ease: [0.6, 0, 0.8, 0.4] } : { type: 'spring', stiffness: 170, damping: 22, delay: side < 0 ? 0.3 : 0.75 }}>
      <div className="absolute inset-0" style={{ transform: 'translate(1.2vmin,1.6vmin)', background: 'rgba(31,74,54,.18)', borderRadius: '2vmin', filter: 'blur(1.2vmin)' }} />
      <div className="absolute inset-0 overflow-hidden" style={{ background: '#fbf6ea', borderRadius: '2vmin', border: '0.25vmin solid rgba(201,161,74,.8)' }}>
        <img src={img(n)} className="w-full object-cover" style={{ height: '78%' }} />
        <div style={{ padding: '1.4vmin 1.8vmin' }}>
          <div className="eyebrow" style={{ fontSize: '1.9vmin', color: 'var(--forest)' }}>{tag}</div>
          <div className="f-body" style={{ fontSize: '1.9vmin', color: 'var(--color-text-secondary)', marginTop: '0.6vmin' }}>{chips}</div>
        </div>
      </div>
      <motion.div className="absolute flex items-center gap-[1vmin]" style={{ top: '-3vmin', [side < 0 ? 'left' : 'right']: '-3vmin', background: 'var(--clay)', color: 'var(--ivory)', borderRadius: '5vmin', padding: '1vmin 1.8vmin' } as React.CSSProperties}
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: liked ? 1 : 0, rotate: liked ? 0 : -20 }} transition={{ type: 'spring', stiffness: 380, damping: 16 }}>
        <Heart style={{ width: '3vmin', height: '3vmin' }} fill="currentColor" />
        <span className="f-body" style={{ fontSize: '2vmin', fontWeight: 600 }}>{likeLabel}</span>
      </motion.div>
    </motion.div>
  );
}

export function Scene3() {
  const [b, setB] = useState(0);
  useSceneTimer([
    { time: 1600, callback: () => setB(1) },
    { time: 2300, callback: () => setB(2) },
    { time: 2900, callback: () => setB(3) },
    { time: 3300, callback: () => setB(4) },
    { time: 4000, callback: () => setB(5) },
    { time: 4700, callback: () => setB(6) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden grain" style={{ background: 'var(--ivory)' }}
      initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.2 } }}>
      <div className="absolute inset-0" style={{ opacity: 0.18, backgroundImage: 'linear-gradient(45deg, var(--gold) 1px, transparent 1px), linear-gradient(-45deg, var(--gold) 1px, transparent 1px)', backgroundSize: '6vmin 6vmin' }} />
      <div className="absolute text-center" style={{ left: 0, right: 0, top: '7%' }}>
        <div style={{ overflow: 'hidden' }}>
          <motion.div className="f-display" style={{ fontSize: '7.4vmin', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1 }}
            initial={{ y: '110%' }} animate={{ y: b >= 4 ? '0%' : '110%' }} transition={{ duration: 0.55, ease: EASE }}>
            A match is <span className="italic" style={{ color: 'var(--forest)' }}>two dresses.</span>
          </motion.div>
        </div>
        <motion.div className="f-am" style={{ fontSize: '3.4vmin', color: 'var(--clay)', fontWeight: 600, marginTop: '0.4vmin' }}
          initial={{ opacity: 0 }} animate={{ opacity: b >= 4 ? 1 : 0 }} transition={{ duration: 0.4, delay: 0.2 }}>ሁለት ቀሚሶች፣ አንድ ግጥሚያ</motion.div>
      </div>
      <Card n={2} tag="Your dress" chips="Bust 92 cm · Length 148 cm" side={-1} liked={b >= 2} likeLabel="They liked yours" joined={b >= 3} split={b >= 6} />
      <Card n={4} tag="Their dress" chips="Bust 88 cm · Length 152 cm" side={1} liked={b >= 1} likeLabel="You liked it" joined={b >= 3} split={b >= 6} />
      <motion.svg className="absolute" viewBox="0 0 40 40" style={{ left: '50%', top: '58%', width: '9vmin', height: '9vmin', marginLeft: '-4.5vmin' }}
        initial={{ scale: 0, rotate: -90 }} animate={{ scale: b >= 3 && b < 6 ? 1 : 0, rotate: b >= 3 ? 0 : -90 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
        <path d="M20 2 38 20 20 38 2 20Z" fill="var(--forest)" stroke="var(--gold)" strokeWidth="2.5" />
        <path d="M20 11 29 20 20 29 11 20Z" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      </motion.svg>
      <motion.div className="absolute f-body text-center" style={{ left: 0, right: 0, bottom: '3.5%', fontSize: '3.1vmin', color: 'var(--forest)', fontWeight: 500 }}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: b >= 5 && b < 6 ? 1 : 0, y: b >= 5 ? 0 : 14 }} transition={{ duration: 0.4, ease: EASE }}>
        Likes go to garments, never to profiles.
      </motion.div>
    </motion.section>
  );
}
