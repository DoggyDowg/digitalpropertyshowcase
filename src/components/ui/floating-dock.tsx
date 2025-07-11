'use client';
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const FloatingDock = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string, onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; }[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <div className="w-full flex justify-center">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "flex h-16 items-end gap-1 sm:gap-4 rounded-2xl px-6 pb-3",
          className,
        )}
      >
        {items.map((item) => (
          <IconContainer mouseX={mouseX} key={item.title} {...item} />
        ))}
      </motion.div>
    </div>
  );
};
 
function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isLargeScreen = useMediaQuery('(min-width: 601px)');

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
 
    return val - bounds.x - bounds.width / 2;
  });
 
  // Responsive sizing
  const baseSize = isLargeScreen ? 60 : 40;
  const hoverSize = isLargeScreen ? 96 : 72;
  const baseIconSize = isLargeScreen ? 30 : 20;
  const hoverIconSize = isLargeScreen ? 48 : 36;

  const widthTransform = useTransform(distance, [-150, 0, 150], [baseSize, hoverSize, baseSize]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [baseSize, hoverSize, baseSize]);
 
  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [baseIconSize, hoverIconSize, baseIconSize]);
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [baseIconSize, hoverIconSize, baseIconSize],
  );
 
  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
 
  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
 
  const [hovered, setHovered] = useState(false);
 
  return (
    <a 
      href={href} 
      onClick={onClick}
      className="dock-button relative"
      style={{ transform: 'none' }}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-shadow duration-300",
          hovered ? "shadow-xl" : "shadow-md"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 10, x: "-50%" }}
              transition={{ duration: 0.15 }}
              className="absolute -top-12 left-1/2 w-fit px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs rounded-md whitespace-nowrap pointer-events-none"
              style={{ zIndex: 9999 }}
            >
              {title}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black dark:border-t-white"></div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center text-black dark:text-white"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
} 