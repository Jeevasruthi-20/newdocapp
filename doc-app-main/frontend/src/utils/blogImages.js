/** Reliable blog image URLs — picsum + ui-avatars always load */

export const getBlogCoverFallback = (seed) =>
  `https://picsum.photos/seed/medconnect-${seed}/800/450`;

export const getAuthorAvatarUrl = (name) => {
  const n = encodeURIComponent(name || 'Doctor');
  return `https://ui-avatars.com/api/?name=${n}&background=0069c0&color=fff&size=128&bold=true`;
};

export const getUnsplashCover = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=450&q=80`;

export const articleImages = (slug, unsplashPhotoId, authorName) => ({
  coverImage: getUnsplashCover(unsplashPhotoId),
  coverFallback: getBlogCoverFallback(slug),
  authorAvatar: getAuthorAvatarUrl(authorName),
});
