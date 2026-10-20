import { motion } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;
export const img = (n: number) => `${import.meta.env.BASE_URL}images/kemis-${n}.webp`;
export const LOGO = `${import.meta.env.BASE_URL}images/logo.svg`;

export function TibebRule({ delay = 0, className = '', style }: { delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`tibeb-thin ${className}`}
      style={{ height: '0.7vmin', transformOrigin: 'left center', ...style }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    />
  );
}
