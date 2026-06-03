import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiClock, FiBookmark, FiShare2, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getArticleBySlug, getRelatedArticles } from '../data/blogArticles';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BlogImage from '../components/BlogImage';

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const article = getArticleBySlug(slug);
  const [bookmarked, setBookmarked] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('medconnect_bookmarks') || '[]');
    return saved.includes(slug);
  });

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-slate-500 mb-4">{t('common.share') === 'பகிர்' ? 'கட்டுரை கிடைக்கவில்லை' : 'Article not found'}</p>
        <Button onClick={() => navigate('/blog')}>{t('common.back')}</Button>
      </div>
    );
  }

  const related = getRelatedArticles(article);

  const toggleBookmark = () => {
    const saved = JSON.parse(localStorage.getItem('medconnect_bookmarks') || '[]');
    const next = bookmarked ? saved.filter((s) => s !== slug) : [...saved, slug];
    localStorage.setItem('medconnect_bookmarks', JSON.stringify(next));
    setBookmarked(!bookmarked);
    
    const msg = bookmarked 
      ? (t('common.share') === 'பகிர்' ? 'புக்மார்க்கிலிருந்து நீக்கப்பட்டது' : 'Removed from bookmarks')
      : (t('common.share') === 'பகிர்' ? 'புக்மார்க்கில் சேமிக்கப்பட்டது' : 'Saved to bookmarks');
    toast.success(msg);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const translatedTitle = t(`blog.articles.${article.id}.title`, article.title);
    if (navigator.share) {
      await navigator.share({ title: translatedTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      const msg = t('common.share') === 'பகிர்' ? 'இணைப்பு நகலெடுக்கப்பட்டது!' : 'Link copied!';
      toast.success(msg);
    }
  };

  const translatedContent = t(`blog.articles.${article.id}.content`, article.content);

  return (
    <article className="min-h-screen bg-white">
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <BlogImage
          src={article.coverImage}
          alt={t(`blog.articles.${article.id}.title`, article.title)}
          seed={article.slug}
          category={article.category}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-medical-500 text-white text-xs font-medium mb-3">
            {t(`blog.categoriesMap.${article.category}`, article.category)}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-white">{t(`blog.articles.${article.id}.title`, article.title)}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <BlogImage
              src={article.authorAvatar}
              alt={article.author}
              seed={article.slug}
              type="avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-slate-800">{article.author}</p>
              <p className="text-sm text-slate-500">{t(`blog.articles.${article.id}.authorRole`, article.authorRole)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><FiClock /> {t('blog.readingTime', { minutes: article.readingTime })}</span>
            <button type="button" onClick={toggleBookmark} className={`flex items-center gap-1 ${bookmarked ? 'text-medical-600' : ''}`}>
              <FiBookmark fill={bookmarked ? 'currentColor' : 'none'} /> {t('common.bookmark')}
            </button>
            <button type="button" onClick={handleShare} className="flex items-center gap-1 hover:text-medical-600">
              <FiShare2 /> {t('common.share')}
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-slate max-w-none">
          {translatedContent.split('\n\n').map((para, i) => (
            <p key={i} className="text-slate-600 leading-relaxed mb-4 text-lg">{para}</p>
          ))}
        </motion.div>

        <div className="flex flex-wrap gap-2 mt-8">
          {article.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-medical-50 text-medical-600 text-xs font-medium">#{tag}</span>
          ))}
        </div>

        <Link to="/blog" className="inline-flex items-center gap-2 mt-10 text-medical-600 font-medium hover:underline">
          <FiArrowLeft /> {t('common.back')} {t('common.share') === 'பகிர்' ? 'வலைப்பதிவிற்கு' : 'to blog'}
        </Link>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{t('blog.related')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`}>
                  <Card className="!p-0 overflow-hidden h-full">
                    <BlogImage
                      src={r.coverImage}
                      alt={t(`blog.articles.${r.id}.title`, r.title)}
                      seed={r.slug}
                      category={r.category}
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-sm text-slate-800 line-clamp-2">{t(`blog.articles.${r.id}.title`, r.title)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default BlogDetail;
