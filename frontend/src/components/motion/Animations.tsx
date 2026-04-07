import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export const FadeIn = ({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInUp = ({
  children,
  delay = 0,
  duration = 0.4,
  y = 20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInDown = ({
  children,
  delay = 0,
  duration = 0.4,
  y = -20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInLeft = ({
  children,
  delay = 0,
  duration = 0.4,
  x = -20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const FadeInRight = ({
  children,
  delay = 0,
  duration = 0.4,
  x = 20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({
  children,
  delay = 0,
  duration = 0.3,
  scale = 0.95,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  scale?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay, ease: [0.34, 1.56, 0.64, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    transition={{ staggerChildren: staggerDelay, delayChildren: delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const HoverLift = ({
  children,
  lift = -4,
  className,
}: {
  children: React.ReactNode;
  lift?: number;
  className?: string;
}) => (
  <motion.div
    whileHover={{ y: lift, transition: { duration: 0.2 } }}
    className={className}
  >
    {children}
  </motion.div>
);

export const HoverScale = ({
  children,
  scale = 1.02,
  className,
}: {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}) => (
  <motion.div
    whileHover={{ scale, transition: { duration: 0.2 } }}
    className={className}
  >
    {children}
  </motion.div>
);

export const TapScale = ({
  children,
  scale = 0.98,
  className,
}: {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}) => (
  <motion.div
    whileTap={{ scale, transition: { duration: 0.1 } }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Pulse = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    animate={{ opacity: [1, 0.5, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Bounce = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideIn = ({
  children,
  direction = 'left',
  delay = 0,
  duration = 0.4,
  className,
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  const initial = {
    left: { x: '-100%' },
    right: { x: '100%' },
    up: { y: '100%' },
    down: { y: '-100%' },
  }[direction];

  return (
    <motion.div
      initial={{ ...initial, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { AnimatePresence };
