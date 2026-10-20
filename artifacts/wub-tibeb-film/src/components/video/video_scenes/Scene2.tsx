import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, img } from '../shared';

const COLS = [
  { x: '4%', imgs: [2, 3, 4, 5], dir: -1 },
  { x: '37%', imgs: [6, 2, 5, 3], dir: 1 },
  { x: '70%', imgs: [4, 6, 3, 2], dir: -1 },
];

export function Scene2() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 3700, callback: () => setBeat(1) },
    { time: 4400, callback: () => setBeat(2) },
  ]);
  const words = ['ቀሚስ', 'በቀሚስ'];
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--forest)' }}
      initial={{ clipPath: 'circle(0% at 50% 50%)', scale: 1.5, filter: 'blur(10px)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)', scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.8, ease: EASE }}>
      {COLS.map((c, ci) => (
        <motion.div key={ci} className="absolute top-0 flex flex-col gap-[2vmin]" style={{ left: c.x, width: '26%' }}
          initial={{ y: c.dir > 0 ? '-45%' : '0%', opacity: 0 }}
          animate={{ y: c.dir > 0 ? '0%' : '-45%', opacity: beat >= 1 ? 0.62 : 0.34 }}
          transition={{ y: { duration: 5.4, ease: 'linear' }, opacity: { duration: 0.5, delay: beat ? 0 : 0.3 } }}>
          {[...c.imgs, ...c.imgs].map((n, i) => (
            <div key={i} style={{ height: '52vh', borderRadius: '1.4vmin', overflow: 'hidden', border: '0.3vmin solid rgba(201,161,74,.5)' }}>
              <img src={img(n)} className="w-full h-full object-cover" />
            </div>
          ))}
        </motion.div>
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(20,38,29,.92), rgba(20,38,29,.35))' }} />
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center"
        animate={beat >= 2 ? { scale: 0.82, opacity: 0 } : {}} transition={{ duration: 0.55, ease: EASE }}>
        <div className="flex gap-[3vmin]">
          {words.map((w, i) => (
            <div key={i} style={{ overflow: 'hidden', padding: '0 1vmin' }}>
              <motion.div className="f-am" style={{ fontSize: '17vmin', fontWeight: 700, color: 'var(--ivory)', lineHeight: 1.2 }}
                initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ delay: 0.6 + i * 0.18, duration: 0.6, ease: EASE }}>{w}</motion.div>
            </div>
          ))}
        </div>
        <motion.div className="f-display italic" style={{ fontSize: '7vmin', color: 'var(--gold)', fontWeight: 500, marginTop: '0.5vmin' }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ delay: 1.4, duration: 0.7, ease: EASE }}>
          Dress for dress.
        </motion.div>
        <motion.div className="tibeb-thin" style={{ height: '0.6vmin', width: '30vmin', marginTop: '3vmin' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 2.2, duration: 0.6, ease: EASE }} />
        <motion.div className="f-body" style={{ fontSize: '3.3vmin', color: 'rgba(246,239,224,.88)', marginTop: '2.6vmin', fontWeight: 500 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.8, duration: 0.5, ease: EASE }}>
          No payments. Just an exchange of kemis.
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
