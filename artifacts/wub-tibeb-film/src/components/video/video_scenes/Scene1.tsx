import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, img, TibebRule } from '../shared';

const HOLIDAYS = [
  { en: 'Enkutatash', am: 'እንቁጣጣሽ' },
  { en: 'Meskel', am: 'መስቀል' },
  { en: 'Genna', am: 'ገና' },
  { en: 'Timket', am: 'ጥምቀት' },
];

export function Scene1() {
  const [h, setH] = useState(-1);
  const [line, setLine] = useState(0);
  const [out, setOut] = useState(false);
  useSceneTimer([
    { time: 500, callback: () => setH(0) },
    { time: 950, callback: () => setH(1) },
    { time: 1400, callback: () => setH(2) },
    { time: 1850, callback: () => setH(3) },
    { time: 2450, callback: () => setLine(1) },
    { time: 2900, callback: () => setLine(2) },
    { time: 3600, callback: () => setOut(true) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden grain" style={{ background: 'var(--ivory)' }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      {/* arch photo */}
      <motion.div
        className="absolute"
        style={{ right: '7%', top: '6%', height: '88%', width: '34%', borderRadius: '50vmin 50vmin 1.5vmin 1.5vmin', overflow: 'hidden', willChange: 'transform, opacity, filter' }}
        initial={{ clipPath: 'inset(100% 0 0 0)' }}
        animate={out
          ? { clipPath: 'inset(0% 0 0 0)', scale: 2.6, x: '-60%', opacity: [1, 1, 0], filter: ['blur(0px)', 'blur(2px)', 'blur(14px)'] }
          : { clipPath: 'inset(0% 0 0 0)', scale: 1 }}
        transition={out ? { duration: 0.95, ease: [0.6, 0, 0.4, 1], times: [0, 0.55, 1] } : { duration: 0.9, ease: EASE }}
      >
        <motion.img src={img(1)} className="w-full h-full object-cover" initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: EASE }} />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 0.6vmin var(--gold)', borderRadius: 'inherit' }} />
      </motion.div>
      {/* tally */}
      <motion.div className="absolute flex gap-[1.4vmin]" style={{ right: '7%', bottom: '2.2%' }} animate={{ opacity: out ? 0 : 1 }}>
        {HOLIDAYS.map((_, i) => (
          <motion.span key={i} className="block rotate-45" style={{ width: '1.6vmin', height: '1.6vmin', border: '0.3vmin solid var(--gold)' }}
            animate={{ backgroundColor: i <= h ? 'rgba(201,161,74,1)' : 'rgba(201,161,74,0)', scale: i === h ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.3 }} />
        ))}
      </motion.div>
      {/* left column */}
      <motion.div className="absolute" style={{ left: '7%', top: '12%', width: '48%' }}
        animate={out ? { y: '-12%', opacity: 0 } : {}} transition={{ duration: 0.5, ease: EASE }}>
        <motion.div className="eyebrow" style={{ color: 'var(--forest)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: EASE }}>
          The holiday problem
        </motion.div>
        <TibebRule delay={0.3} style={{ width: '22vmin', marginTop: '1.6vmin' }} />
        <div className="relative" style={{ height: '24vmin', marginTop: '4vmin' }}>
          <AnimatePresence mode="sync">
            {h >= 0 && (
              <motion.div key={h} className="absolute left-0 top-0"
                initial={{ opacity: 0, scale: 1.25, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }} style={{ transformOrigin: 'left center' }}>
                <div className="f-display" style={{ fontSize: '11vmin', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{HOLIDAYS[h].en}</div>
                <div className="f-am" style={{ fontSize: '4.2vmin', color: 'var(--clay)', marginTop: '1.2vmin', fontWeight: 600 }}>{HOLIDAYS[h].am}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ marginTop: '3vmin' }}>
          <div style={{ overflow: 'hidden', paddingBottom: '0.6vmin' }}>
            <motion.div className="f-display" style={{ fontSize: '7.6vmin', fontWeight: 500, color: 'var(--forest)', lineHeight: 1.05 }}
              initial={{ y: '110%' }} animate={{ y: line >= 1 ? '0%' : '110%' }} transition={{ duration: 0.5, ease: EASE }}>Same dress.</motion.div>
          </div>
          <div style={{ overflow: 'hidden', paddingBottom: '1.4vmin' }}>
            <motion.div className="f-display italic" style={{ fontSize: '7.6vmin', fontWeight: 500, color: 'var(--clay)', lineHeight: 1.05 }}
              initial={{ y: '110%' }} animate={{ y: line >= 2 ? '0%' : '110%' }} transition={{ duration: 0.5, ease: EASE }}>Every photo.</motion.div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
