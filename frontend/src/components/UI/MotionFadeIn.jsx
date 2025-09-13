import React, { forwardRef, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Flexible MotionFadeIn
 *
 * Props:
 *  - delay, duration, ease, x, y, opacity: quick shorthand for common fade/slide
 *  - initial, animate, exit: full control if you want to override defaults
 *  - stagger: { staggerChildren, delayChildren } to propagate to children
 *  - as: component to render (default motion.div)
 *  - reducedMotionFallback: when reduced motion is true, render this wrapper (defaults to plain div)
 *  - className and rest are forwarded
 */
export const MotionFadeIn = forwardRef(function MotionFadeIn(
  {
    children,
    delay = 0,
    duration = 0.5,
    ease = "easeOut",
    x = 0,
    y = 12,
    opacity = 0,
    initial,
    animate,
    exit,
    stagger = null, // e.g. { staggerChildren: 0.08, delayChildren: 0.04 }
    as: Comp = motion.div,
    reducedMotionFallback: Fallback = "div",
    className = "",
    style,
    ...rest
  },
  ref
) {
  const shouldReduce = useReducedMotion();

  // Default variants (memoized)
  const variants = useMemo(() => {
    const baseInitial = initial ?? { opacity, x, y };
    const baseAnimate = animate ?? { opacity: 1, x: 0, y: 0 };
    const baseExit = exit ?? { opacity: 0, y: 6 };

    // if stagger provided, include it on animate transition
    const animateWithTransition = {
      ...baseAnimate,
      transition: {
        duration,
        ease,
        delay,
        ...(stagger
          ? {
              staggerChildren: stagger.staggerChildren,
              delayChildren: stagger.delayChildren,
            }
          : {}),
      },
    };

    return {
      initial: baseInitial,
      animate: animateWithTransition,
      exit: { ...baseExit, transition: { duration: Math.min(0.4, duration) } },
    };
  }, [initial, animate, exit, opacity, x, y, duration, ease, delay, stagger]);

  // If user prefers reduced motion, render a non-animated wrapper to avoid movement
  if (shouldReduce) {
    const F = Fallback;
    return (
      <F ref={ref} className={className} style={style} {...rest}>
        {children}
      </F>
    );
  }

  // Render motion component with computed variants
  return (
    <Comp
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={className}
      style={style}
      {...rest}>
      {children}
    </Comp>
  );
});

export default MotionFadeIn;
