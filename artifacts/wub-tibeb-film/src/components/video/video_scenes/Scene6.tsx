import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, LOGO } from '../shared';

export function Scene6() {
  const [out, setOut] = useState(false);
  useSceneTimer([{ time: 3800, callback: () => setOut(true) }]);
  return (
    <motion.section className="absolute inset-0 overflow-hidden grain" style={{ background: 'var(--ivory)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center"
        animate={{ scale: out ? 0.94 : 1.04 }} transition={{ duration: out ? 0.5 : 3.8, ease: out ? EASE : 'linear' }}>
        <motion.img src={LOGO} style={{ width: '24vmin', height: '24vmin', borderRadius: '6vmin', boxShadow: '0 2vmin 4vmin rgba(31,74,54,.22)' }}
          initial={{ scale: 2.2, rotate: 45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 0.9, ease: EASE }} />
        <div style={{ overflow: 'hidden', marginTop: '3vmin' }}>
          <motion.div className="f-am" style={{ fontSize: '11vmin', fontWeight: 700, color: 'var(--forest)', lineHeight: 1.25 }}
            initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ delay: 0.7, duration: 0.6, ease: EASE }}>ውብ ጥበብ</motion.div>
        </div>
        <motion.div className="f-display" style={{ fontSize: '5vmin', fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.02em' }}
          initial={{ opacity: 0, y: 14, letterSpacing: '0.3em' }} animate={{ opacity: 1, y: 0, letterSpacing: '0.02em' }} transition={{ delay: 1.2, duration: 0.7, ease: EASE }}>Wub Tibeb</motion.div>
        <motion.div className="tibeb-band" style={{ height: '2.4vmin', width: '46vmin', marginTop: '3vmin' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.6, duration: 0.6, ease: EASE }} />
        <motion.div className="f-body" style={{ fontSize: '3.2vmin', fontWeight: 600, color: 'var(--forest)', marginTop: '3vmin' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1, duration: 0.5 }}>
          Wear. Share. Repeat. <span style={{ color: 'var(--gold)', margin: '0 1.2vmin' }}>◆</span><span className="f-am">ይልበሱ። ያጋሩ። ይድገሙ።</span>
        </motion.div>
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-0 tibeb-band" style={{ height: '100%', transformOrigin: 'bottom' }}
        initial={{ scaleY: 0 }} animate={{ scaleY: out ? 1 : 0 }} transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1] }} />
    </motion.section>
  );
}
