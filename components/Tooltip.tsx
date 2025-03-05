import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-zinc-800 dark:bg-zinc-700 rounded shadow-lg whitespace-nowrap ${positionStyles[position]}`}
          >
            {content}
            <div
              className={`absolute ${
                position === 'top'
                  ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-zinc-800 dark:border-t-zinc-700 border-l-transparent border-r-transparent border-b-transparent'
                  : position === 'bottom'
                  ? 'top-[-4px] left-1/2 -translate-x-1/2 border-b-zinc-800 dark:border-b-zinc-700 border-l-transparent border-r-transparent border-t-transparent'
                  : position === 'left'
                  ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-zinc-800 dark:border-l-zinc-700 border-t-transparent border-b-transparent border-r-transparent'
                  : 'left-[-4px] top-1/2 -translate-y-1/2 border-r-zinc-800 dark:border-r-zinc-700 border-t-transparent border-b-transparent border-l-transparent'
              } border-4`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 