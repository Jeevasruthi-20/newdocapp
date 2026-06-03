import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { getBlogCoverFallback, getAuthorAvatarUrl } from '../utils/blogImages';

const Placeholder = ({ alt, className, category, type }) => (
  <div
    className={cn(
      'flex items-center justify-center bg-gradient-to-br from-medical-600 to-sky-400 text-white/90',
      className
    )}
    role="img"
    aria-label={alt}
  >
    <div className="text-center px-4">
      {type === 'avatar' ? (
        <span className="text-xl font-bold">{alt?.charAt(0) || 'D'}</span>
      ) : (
        <>
          <span className="text-4xl block mb-2">🏥</span>
          {category && <span className="text-sm font-medium opacity-90">{category}</span>}
        </>
      )}
    </div>
  </div>
);

/**
 * Blog cover / avatar with automatic fallback when external CDN fails.
 */
const BlogImage = ({
  src,
  alt,
  className,
  seed = 'default',
  category,
  type = 'cover',
}) => {
  const fallback = type === 'avatar' ? getAuthorAvatarUrl(alt) : getBlogCoverFallback(seed);
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallback);
    setUsePlaceholder(false);
  }, [src, fallback]);

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      return;
    }
    setUsePlaceholder(true);
  };

  if (usePlaceholder) {
    return <Placeholder alt={alt} className={className} category={category} type={type} />;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
};

export default BlogImage;
