import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NoiseOverlay from '@/components/NoiseOverlay';
import InkFilters from '@/components/InkFilters';
import ThemeToggle from '@/components/ThemeToggle';
import HomePage from '@/pages/HomePage';
import CategoryPage from '@/pages/CategoryPage';
import PaperViewer from '@/pages/PaperViewer';
import VocabularyPage from '@/pages/VocabularyPage';

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

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)] overflow-x-hidden"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <NoiseOverlay />
      <InkFilters />

      {/* Top nav - transparent on homepage, fixed on other pages */}
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
                location.pathname.startsWith(item.to)
                  ? 'line-through'
                  : 'opacity-50'
              }`}
              style={location.pathname.startsWith(item.to) ? { color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile menu hint */}
        <div className="text-[10px] font-bold uppercase tracking-[0.4em] md:hidden">
          <Link to="/cet4">真题</Link>
        </div>
      </nav>

      {/* Page transition animation */}
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
            <Route path="/:categorySlug/:paperSlug/*" element={<PaperViewer />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {/* Footer - only on homepage, fades out when scrolled */}
      {isHomePage && (
        <footer className="fixed bottom-0 w-full p-6 md:p-10 flex justify-between items-end z-50 pointer-events-none">
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 max-w-[200px]">
            英语真题在线 · 按试卷排版设计
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
            <span className="inline-block animate-bounce">↓</span>
            Scroll to explore
          </div>
        </footer>
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
