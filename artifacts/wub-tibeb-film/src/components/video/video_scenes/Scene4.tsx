import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useSceneTimer } from '@/lib/video';
import { EASE } from '../shared';

const BUBBLES = [
  { t: 'ሰላም! ቀሚሱ ለመስቀል ይደርሳል?', me: false, am: true, at: 0.3 },
  { t: 'Yes. Swap on Saturday?', me: true, am: false, at: 0.9 },
  { t: 'Plan agreed: Saturday, 10:00', me: false, am: false, at: 1.5, plan: true },
];
const STEPS = ['Private chat', 'Agree an exchange plan', 'Both of you confirm'];

export function Scene4() {
  const [s, setS] = useState(0);
  const [seal, setSeal] = useState(0);
  useSceneTimer([
    { time: 600, callback: () => setS(1) },
    { time: 1400, callback: () => setS(2) },
    { time: 2200, callback: () => setS(3) },
    { time: 2900, callback: () => setSeal(1) },
    { time: 4100, callback: () => setSeal(2) },
  ]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden" style={{ background: 'var(--ivory)' }} exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.15 } }}>
      <motion.div className="absolute top-0 bottom-0 left-0" style={{ width: '46%', background: 'var(--forest)' }}
        initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 0.55, ease: EASE }}>
        <div className="absolute eyebrow" style={{ left: '12%', top: '10%', color: 'var(--gold)' }}>Private chat</div>
        <div className="absolute flex flex-col gap-[2.4vmin]" style={{ left: '12%', right: '10%', top: '22%' }}>
          {BUBBLES.map((b, i) => (
            <motion.div key={i} className={b.am ? 'f-am' : 'f-body'}
              style={{ alignSelf: b.me ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '1.8vmin 2.4vmin', fontSize: '3.1vmin', fontWeight: 500,
                borderRadius: b.me ? '2.6vmin 2.6vmin 0.6vmin 2.6vmin' : '2.6vmin 2.6vmin 2.6vmin 0.6vmin',
                background: b.plan ? 'var(--gold)' : b.me ? 'var(--ivory)' : 'rgba(246,239,224,.12)',
                color: b.plan ? 'var(--ink)' : b.me ? 'var(--ink)' : 'var(--ivory)',
                border: b.plan ? 'none' : '0.2vmin solid rgba(201,161,74,.45)', transformOrigin: b.me ? 'right bottom' : 'left bottom' }}
              initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: b.at, type: 'spring', stiffness: 300, damping: 22 }}>{b.t}</motion.div>
          ))}
        </div>
      </motion.div>
      <div className="absolute" style={{ left: '53%', top: '12%', right: '6%' }}>
        <motion.div className="f-display" style={{ fontSize: '8vmin', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.05 }}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease: EASE }}>
          Talk. Plan.<br /><span className="italic" style={{ color: 'var(--forest)' }}>Confirm.</span>
        </motion.div>
        <div className="relative" style={{ marginTop: '5vmin' }}>
          <div className="absolute" style={{ left: '2.4vmin', top: '2vmin', bottom: '2vmin', width: '0.3vmin', background: 'rgba(31,74,54,.2)' }} />
          <motion.div className="absolute" style={{ left: '2.4vmin', top: '2vmin', width: '0.3vmin', height: '80%', background: 'var(--gold)', transformOrigin: 'top' }}
            animate={{ scaleY: Math.max(0, (s - 1) / 2) }} transition={{ duration: 0.5, ease: EASE }} />
          {STEPS.map((t, i) => (
            <div key={i} className="relative flex items-center gap-[2.4vmin]" style={{ height: '8vmin' }}>
              <motion.div className="flex items-center justify-center" style={{ width: '5vmin', height: '5vmin', borderRadius: '50%', border: '0.3vmin solid var(--forest)' }}
                animate={{ backgroundColor: s > i ? 'rgba(31,74,54,1)' : 'rgba(246,239,224,1)', scale: s === i + 1 ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.35 }}>
                <motion.span initial={{ scale: 0 }} animate={{ scale: s > i ? 1 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} style={{ display: 'flex' }}>
                  <Check style={{ width: '3vmin', height: '3vmin', color: 'var(--gold)' }} strokeWidth={3} />
                </motion.span>
              </motion.div>
              <motion.span className="f-body" style={{ fontSize: '3.4vmin', fontWeight: 600 }} animate={{ color: s > i ? '#14261d' : 'rgba(20,38,29,.35)' }}>{t}</motion.span>
            </div>
          ))}
        </div>
      </div>
      <motion.div className="absolute flex flex-col items-center justify-center text-center" style={{ right: '8%', bottom: '7%', width: '24vmin', height: '24vmin', marginLeft: 0, borderRadius: '50%', background: 'var(--gold)' }}
        initial={{ scale: 0, rotate: -30 }}
        animate={seal === 2 ? { scale: 9, rotate: 0 } : seal === 1 ? { scale: 1, rotate: -8 } : { scale: 0, rotate: -30 }}
        transition={seal === 2 ? { duration: 0.7, ease: [0.7, 0, 0.3, 1] } : { type: 'spring', stiffness: 280, damping: 15 }}>
        <motion.div animate={{ opacity: seal === 2 ? 0 : 1 }} transition={{ duration: 0.15 }}>
          <div className="f-display" style={{ fontSize: '3.6vmin', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.05 }}>Exchange<br />complete</div>
          <div className="f-am" style={{ fontSize: '2.2vmin', color: 'var(--forest)', fontWeight: 600, marginTop: '0.8vmin' }}>ልውውጡ ተጠናቋል</div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
