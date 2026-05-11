/**
 * ThemeToggle — 导航栏主题切换按钮
 * ☀ / 🌙 图标，点击切换 light ↔ dark
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useAppStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm leading-none"
          >
            ☀
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm leading-none"
          >
            🌙
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
