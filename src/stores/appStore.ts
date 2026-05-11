import { create } from 'zustand';

type Theme = 'light' | 'dark';

// ── 从 localStorage 读取或跟随系统偏好 ──
function getInitialTheme(): Theme {
  const stored = localStorage.getItem('s-corner-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── 同步 data-theme 到 <html> ──
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('s-corner-theme', theme);
}

// 初始化时立即应用
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

interface AppState {
  // Sidebar / mobile nav
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  // Reading preferences
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  setFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  fontSize: 'base',
  setFontSize: (size) => set({ fontSize: size }),

  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    }),
}));
