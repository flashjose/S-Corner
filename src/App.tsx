import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import NoiseOverlay from '@/components/NoiseOverlay';
import InkFilters from '@/components/InkFilters';
import ThemeToggle from '@/components/ThemeToggle';
import { isPaperViewerPath } from '@/utils/routes';
import HomePage from '@/pages/HomePage';
import CategoryPage from '@/pages/CategoryPage';
import VocabularyPage from '@/pages/VocabularyPage';
import { useAppStore } from '@/stores/appStore';

const PaperViewer = lazy(() => import('@/pages/PaperViewer'));

const NAV_ITEMS = [
  { to: '/cet4', label: 'CET4' },
  { to: '/cet6', label: 'CET6' },
  { to: '/kaoyan', label: '考研' },
  { to: '/tem', label: '专四专八' },
  { to: '/vocabulary', label: 'Vocabulary' },
];

const AppLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isPaperViewer = isPaperViewerPath(location.pathname);
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)] overflow-x-hidden"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {!isPaperViewer && <NoiseOverlay />}
      <InkFilters />

      <nav
        className={`fixed top-0 w-full px-6 md:px-10 flex justify-between items-center z-50 ${
          isHomePage ? 'p-6 md:p-10' : 'py-4 backdrop-blur-sm border-b'
        }`}
        style={!isHomePage ? { backgroundColor: 'var(--nav-bg)', borderColor: 'var(--border)' } : undefined}
      >
        <Link
          to="/"
          className="text-[10px] font-bold uppercase tracking-[0.4em] hover:line-through transition-colors"
        >
          S-Corner
        </Link>

        <div className="flex gap-8 md:gap-10 items-center text-[10px] font-bold uppercase tracking-[0.4em]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`hover:line-through transition-colors hidden md:block ${
                location.pathname.startsWith(item.to) ? 'line-through' : 'opacity-50'
              }`}
              style={location.pathname.startsWith(item.to) ? { color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <button
            className="md:hidden hover:opacity-70"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="打开菜单"
            style={{ color: 'var(--text-secondary)' }}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-64 border-l flex flex-col pt-20 px-6 gap-6 md:hidden"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-[0.3em] hover:opacity-70"
                  style={{ color: location.pathname.startsWith(item.to) ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/:categorySlug" element={<CategoryPage />} />
            <Route
              path="/:categorySlug/:paperSlug/*"
              element={
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
                    <div className="animate-pulse text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>Loading...</div>
                  </div>
                }>
                  <PaperViewer />
                </Suspense>
              }
            />
            <Route path="/vocabulary" element={<VocabularyPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {isHomePage && (
        <footer className="fixed bottom-0 w-full p-4 sm:p-6 md:p-10 flex justify-between items-end z-50 pointer-events-none">
          <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 max-w-[140px] sm:max-w-[200px]">
            英语真题在线 · 按试卷排版设计
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 flex items-center gap-2">
            <span className="inline-block animate-bounce">↓</span>
            <span className="hidden sm:inline">Scroll to explore</span>
            <span className="sm:hidden">滑动探索</span>
          </div>
        </footer>
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppLayout />
  </BrowserRouter>
);

export default App;
