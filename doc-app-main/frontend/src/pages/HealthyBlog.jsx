import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiBookmark, FiClock, FiTrendingUp } from 'react-icons/fi';
import { BLOG_ARTICLES, CATEGORIES } from '../data/blogArticles';
import Card from '../components/ui/Card';
import BlogImage from '../components/BlogImage';

const ITEMS_PER_PAGE = 6;

const HealthyBlog = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const bookmarks = JSON.parse(localStorage.getItem('medconnect_bookmarks') || '[]');

  const filtered = useMemo(() => {
    return BLOG_ARTICLES.filter((a) => {
      const matchCat = category === 'All' || a.category === category;
      const translatedTitle = t(`blog.articles.${a.id}.title`, a.title);
      const translatedExcerpt = t(`blog.articles.${a.id}.excerpt`, a.excerpt);
      const matchSearch = !search || 
        translatedTitle.toLowerCase().includes(search.toLowerCase()) || 
        translatedExcerpt.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category, t]);

  const featured = BLOG_ARTICLES.filter((a) => a.featured);
  const trending = BLOG_ARTICLES.filter((a) => a.trending);
  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white">
      {/* Hero */}
      <section className="bg-medical-gradient text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-bold mb-3">
            {t('blog.title')}
          </motion.h1>
          <p className="text-medical-100 max-w-xl mx-auto">{t('blog.subtitle')}</p>
          <div className="mt-8 max-w-lg mx-auto relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t('blog.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 rounded-medical-lg text-slate-800 shadow-medical-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Featured */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('blog.featured')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featured.slice(0, 2).map((article, i) => (
              <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={`/blog/${article.slug}`}>
                  <Card className="!p-0 overflow-hidden group h-full">
                    <div className="relative h-48 overflow-hidden">
                      <BlogImage
                        src={article.coverImage}
                        alt={t(`blog.articles.${article.id}.title`, article.title)}
                        seed={article.slug}
                        category={article.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2 py-1 bg-medical-600 text-white text-xs rounded-full">{t(`blog.categoriesMap.${article.category}`, article.category)}</span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-800 group-hover:text-medical-600 transition-colors">{t(`blog.articles.${article.id}.title`, article.title)}</h3>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{t(`blog.articles.${article.id}.excerpt`, article.excerpt)}</p>
                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1"><FiClock /> {t('blog.readingTime', { minutes: article.readingTime })}</p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FiTrendingUp className="text-medical-500" /> {t('blog.trending')}</h3>
              {trending.slice(0, 4).map((a) => (
                <Link key={a.id} to={`/blog/${a.slug}`} className="block py-2 border-b border-slate-50 last:border-0 hover:text-medical-600">
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">{t(`blog.articles.${a.id}.title`, a.title)}</p>
                </Link>
              ))}
            </Card>
            <Card>
              <h3 className="font-bold text-slate-800 mb-3">{t('blog.categories')}</h3>
              <div className="flex flex-wrap gap-2">
                {['All', ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); setPage(1); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      category === cat ? 'bg-medical-600 text-white' : 'bg-medical-50 text-medical-600 hover:bg-medical-100'
                    }`}
                  >
                    {t(`blog.categoriesMap.${cat}`, cat)}
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          {/* Articles grid */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="popLayout">
              <div className="grid sm:grid-cols-2 gap-5">
                {paginated.map((article) => (
                  <motion.div
                    key={article.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Link to={`/blog/${article.slug}`}>
                      <Card className="!p-0 overflow-hidden group h-full hover:shadow-medical-lg">
                        <div className="relative h-40 overflow-hidden">
                          <BlogImage
                        src={article.coverImage}
                        alt={t(`blog.articles.${article.id}.title`, article.title)}
                        seed={article.slug}
                        category={article.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                          {bookmarks.includes(article.slug) && (
                            <FiBookmark className="absolute top-2 right-2 text-medical-500 fill-medical-500" />
                          )}
                        </div>
                        <div className="p-4">
                          <span className="text-xs text-medical-600 font-medium">{t(`blog.categoriesMap.${article.category}`, article.category)}</span>
                          <h3 className="font-bold text-slate-800 mt-1 group-hover:text-medical-600 line-clamp-2">{t(`blog.articles.${article.id}.title`, article.title)}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t(`blog.articles.${article.id}.excerpt`, article.excerpt)}</p>
                          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                            <span>{article.author}</span>
                            <span>{t('blog.readingTime', { minutes: article.readingTime })}</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <p className="text-center text-slate-400 py-12">{t('blog.noArticles', 'No articles match your search.')}</p>
            )}

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-2.5 rounded-medical bg-medical-600 text-white font-semibold hover:bg-medical-700 transition-colors"
                >
                  {t('blog.loadMore', 'Load More')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthyBlog;
