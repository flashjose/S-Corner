import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen font-['Manrope'] flex items-center justify-center px-6 py-24"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md border p-8 md:p-10"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <Link
          to="/"
          className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-50 hover:opacity-100 transition-opacity mb-8 inline-block"
        >
          S-Corner
        </Link>
        <h1
          className="font-['Instrument_Serif'] text-3xl md:text-4xl italic mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </p>
        {children}
        <div className="mt-8 pt-6 border-t text-center text-sm" style={{ borderColor: 'var(--border)' }}>
          {footer}
        </div>
      </motion.div>
    </div>
  );
}
