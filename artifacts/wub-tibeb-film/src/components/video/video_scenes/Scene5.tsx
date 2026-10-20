import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, img } from '../shared';

const WORDS = [
  { en: 'Wear.', am: 'ይልበሱ።' },
  { en: 'Share.', am: 'ያጋሩ።' },
  { en: 'Repeat.', am: 'ይድገሙ።' },
];

export function Scene5() {
  const [w, setW] = useState(0);
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 650, callback: () => setW(1) },
    { time: 1250, callback: () => setW(2) },
    { time: 2100, callback: () => setPhase(1) },
    { time: 3400, callback: () => setPhase(2) },
    { time: 4500, callback: () => setPhase(3) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--gold)' }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}>
      <div className="absolute inset-x-0 bottom-0 tibeb-band" style={{ height: '2.4vmin', opacity: 0.9 }} />
      <div className="absolute inset-x-0 top-0 tibeb-band" style={{ height: '2.4vmin', opacity: 0.9 }} />
      {/* burst stage */}
      <AnimatePresence mode="sync">
        {phase === 0 && (
          <motion.div key={w} className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ scale: 1.6, opacity: 0, filter: 'blur(12px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.18 } }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
            <div className="f-display" style={{ fontSize: '26vmin', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{WORDS[w].en}</div>
            <div className="f-am" style={{ fontSize: '7vmin', fontWeight: 700, color: 'var(--ivory)', marginTop: '1vmin' }}>{WORDS[w].am}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* settled column */}
      <motion.div className="absolute" style={{ left: '8%', top: '20%' }} animate={{ opacity: phase >= 1 && phase < 3 ? 1 : 0 }} transition={{ duration: 0.25 }}>
        {WORDS.map((x, i) => (
          <div key={i} style={{ overflow: 'hidden' }}>
            <motion.div className="f-display" style={{ fontSize: '10vmin', fontWeight: 700, color: i === 2 ? 'var(--ivory)' : 'var(--ink)', lineHeight: 1.05 }}
              initial={{ y: '110%' }} animate={{ y: phase >= 1 ? '0%' : '110%' }} transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}>{x.en}</motion.div>
          </div>
        ))}
        <motion.div className="f-am" style={{ fontSize: '4.4vmin', fontWeight: 700, color: 'var(--forest)', marginTop: '2vmin' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: phase >= 1 ? 1 : 0, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>ይልበሱ። ያጋሩ። ይድገሙ።</motion.div>
      </motion.div>
      {/* ring of dresses */}
      <motion.div className="absolute" style={{ right: '9%', top: '50%', width: '62vmin', height: '62vmin', marginTop: '-31vmin' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase === 3 ? { scale: 0.05, opacity: 0, x: '-55%', rotate: 45 } : phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: phase === 3 ? 0.7 : 0.7, ease: EASE }}>
        <motion.div className="absolute inset-0" animate={{ rotate: phase >= 2 ? 300 : 90 }} transition={{ duration: phase >= 2 ? 2.2 : 3.4, ease: phase >= 2 ? 'easeIn' : 'linear' }}>
          <div className="absolute inset-[12%] rounded-full" style={{ border: '0.35vmin dashed rgba(20,38,29,.45)' }} />
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <div key={n} className="absolute overflow-hidden rounded-full" style={{ width: '19vmin', height: '19vmin', left: `calc(50% + ${Math.cos(a) * 38}% - 9.5vmin)`, top: `calc(50% + ${Math.sin(a) * 38}% - 9.5vmin)`, border: '0.6vmin solid var(--ivory)' }}>
                <img src={img(n)} className="w-full h-full object-cover" style={{ objectPosition: 'center 25%' }} />
              </div>
            );
          })}
        </motion.div>
        <svg className="absolute" viewBox="0 0 40 40" style={{ left: '50%', top: '50%', width: '14vmin', height: '14vmin', marginLeft: '-7vmin', marginTop: '-7vmin' }}>
          <path d="M20 2 38 20 20 38 2 20Z" fill="var(--forest)" stroke="var(--ivory)" strokeWidth="2" />
          <path d="M20 11 29 20 20 29 11 20Z" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        </svg>
      </motion.div>
    </motion.section>
  );
}
