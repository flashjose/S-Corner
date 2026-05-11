import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useArticles } from '@/hooks/useArticles';
import { rssApi } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RssFeed } from '@/types/article';

const CATEGORIES = ['all', 'news', 'literature', 'science', 'tech', 'culture', 'philosophy', 'life'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const ArticleListPage = () => {
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [showRssPanel, setShowRssPanel] = useState(false);

  const params: Record<string, string> = { status: 'published' };
  if (category !== 'all') params.category = category;
  if (difficulty !== 'all') params.difficulty = difficulty;

  const { data, isLoading } = useArticles(params);
  const articles = data?.articles || [];

  return (
    <div className="min-h-screen font-['Manrope'] selection:bg-[var(--selection-bg)]"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-['Instrument_Serif'] text-4xl md:text-5xl italic mb-4"
              style={{ color: 'var(--text-primary)' }}>
            Articles
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
             style={{ color: 'var(--text-muted)' }}>
            外刊精读 · 选择一篇文章开始阅读
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-2"
               style={{ color: 'var(--text-muted)' }}>Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors ${
                    category === cat
                      ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'border hover:border-[var(--border-hover)]'
                  }`}
                  style={category !== cat ? { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : undefined}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-2"
               style={{ color: 'var(--text-muted)' }}>Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors ${
                    difficulty === diff
                      ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                      : 'border hover:border-[var(--border-hover)]'
                  }`}
                  style={difficulty !== diff ? { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : undefined}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowRssPanel(!showRssPanel)}
              className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors border hover:border-[var(--border-hover)]"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              {showRssPanel ? 'Hide' : 'RSS Feeds'}
            </button>
          </div>
        </div>

        {/* RSS Panel */}
        {showRssPanel && <RssPanel />}

        {/* Article list */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse p-6" style={{ borderColor: 'var(--border)' }}>
                <div className="h-3 w-20 mb-4" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-5 w-3/4 mb-3" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-full mb-2" style={{ backgroundColor: 'var(--surface)' }} />
                <div className="h-3 w-1/2" style={{ backgroundColor: 'var(--surface)' }} />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
               style={{ color: 'var(--text-muted)' }}>
              No articles found
            </p>
            <p className="text-sm mt-2"
               style={{ color: 'var(--text-muted)' }}>
              Try fetching articles from RSS feeds, or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {articles.map((article: any, index: number) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <Link
                  to={`/articles/${article.id}`}
                  className="block p-6 border border-transparent transition-all group"
                  style={{ }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1"
                            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
                        {article.category}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1"
                            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
                        {article.difficulty}
                      </span>
                      {article.isFromRss && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1"
                              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
                          RSS
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] tracking-wide"
                          style={{ color: 'var(--text-muted)' }}>
                      {article._count?.paragraphs || 0} paragraphs
                    </span>
                  </div>

                  <h3 className="font-['Instrument_Serif'] text-lg md:text-xl italic mb-2 group-hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--text-primary)' }}>
                    {article.title}
                  </h3>

                  <p className="text-sm leading-relaxed line-clamp-2 mb-3"
                     style={{ color: 'var(--text-secondary)' }}>
                    {article.content?.slice(0, 180)}
                    {article.content?.length > 180 && '...'}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.15em]"
                       style={{ color: 'var(--text-muted)' }}>
                      {article.source}
                      {article.author && ` · ${article.author}`}
                    </p>
                    {article.progress?.[0] && (
                      <span className="text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--text-muted)' }}>
                        {article.progress[0].isCompleted ? '✓ completed' : `${article.progress[0].lastParagraph}/${article._count.paragraphs} read`}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** RSS Feed management panel */
const RssPanel = () => {
  const qc = useQueryClient();
  const { data: feeds = [] } = useQuery<RssFeed[]>({
    queryKey: ['rss-feeds'],
    queryFn: () => rssApi.listFeeds(),
  });

  const fetchMutation = useMutation({
    mutationFn: (id: string) => rssApi.fetchFeed(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  const addMutation = useMutation({
    mutationFn: () => rssApi.createFeed({ name: newName, url: newUrl, category: 'news' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rss-feeds'] });
      setNewUrl('');
      setNewName('');
    },
  });

  return (
    <div className="mb-8 p-6 border" style={{ borderColor: 'var(--border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4"
         style={{ color: 'var(--text-secondary)' }}>
        RSS Feed Sources
      </p>

      <div className="space-y-3 mb-6">
        {feeds.map((feed) => (
          <div key={feed.id} className="flex items-center justify-between py-2 border-b last:border-0"
               style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{feed.name}</p>
              <p className="text-[10px] truncate max-w-xs"
                 style={{ color: 'var(--text-muted)' }}>{feed.url}</p>
              {feed.lastFetchedAt && (
                <p className="text-[9px] mt-1"
                   style={{ color: 'var(--text-muted)' }}>
                  Last fetched: {new Date(feed.lastFetchedAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={() => fetchMutation.mutate(feed.id)}
              disabled={fetchMutation.isPending}
              className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors disabled:opacity-50 border hover:border-[var(--border-hover)]"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              {fetchMutation.isPending ? 'Fetching...' : 'Fetch Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Add new feed */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Feed name"
            className="w-full text-sm bg-transparent border-b focus:border-[var(--border-hover)] outline-none py-1.5 px-0 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex-1">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="RSS URL"
            className="w-full text-sm bg-transparent border-b focus:border-[var(--border-hover)] outline-none py-1.5 px-0 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <button
          onClick={() => addMutation.mutate()}
          disabled={!newName || !newUrl || addMutation.isPending}
          className="text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 transition-colors disabled:opacity-50"
          style={{ color: 'var(--bg)', backgroundColor: 'var(--text-primary)' }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ArticleListPage;
