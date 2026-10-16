// Storage keys
export const STORAGE_KEYS = {
  cart: 'mora-cart-v1',
  favorites: 'mora-favorites-v1',
  filter: 'mora-filter-v1',
  promo: 'mora-promo-v1',
  theme: 'mora-theme-v1',
  searchHistory: 'mora-search-history-v1',
  ordersStatus: 'mora-orders-status-v1',
  ordersSearch: 'mora-orders-search-v1',
  ordersSeen: 'mora-orders-seen-v1',
  recentlyViewed: 'mora-recently-viewed-v1',
  productDraft: 'mora-product-draft-v1',
} as const;

// Animation timings (ms)
export const ANIMATIONS = {
  quick: 200,
  normal: 300,
  slow: 500,
  quickViewDelay: 500,
  addedFeedback: 1200,
  toastDuration: 2800,
  preloaderMinTime: 800,
} as const;

// Limits
export const LIMITS = {
  maxCartQuantity: 99,
  maxProductImages: 8,
  maxSearchHistory: 6,
  maxRecentlyViewed: 8,
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxProductNameLength: 100,
  maxProductDescriptionLength: 1000,
  maxReviewLength: 1000,
  maxCategoryNameLength: 50,
  pageSize: 20,
} as const;

// Formatting
export const priceFormatter = new Intl.NumberFormat('ru-RU');
export const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
export const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Allowed file types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;