'use client';
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion
} from "framer-motion";
import { useState } from "react";

export const FloatingDock = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string, onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; }[];
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-center gap-3 py-3",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer key={item.title} {...item} />
      ))}
    </div>
  );
};
 
function IconContainer({
  title,
  icon,
  href,
  onClick
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [hovered, setHovered] = useState(false);
 
  return (
    <a 
      href={href} 
      onClick={onClick}
      className="dock-button relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-shadow duration-300 w-12 h-12 md:w-14 md:h-14",
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
              className="absolute -top-10 md:-top-12 left-1/2 w-fit px-2 md:px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs rounded-md whitespace-nowrap pointer-events-none"
              style={{ zIndex: 9999 }}
            >
              {title}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black dark:border-t-white"></div>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8" // Static icon container
        >
          {icon}
        </div>
      </div>
    </a>
  );
} 