export const DEFAULT_CATEGORIES = [
  { name: 'Food', slug: 'food', icon: 'utensils', color: '#f97316' },
  { name: 'Transportation', slug: 'transportation', icon: 'car', color: '#3b82f6' },
  { name: 'Shopping', slug: 'shopping', icon: 'shopping-bag', color: '#a855f7' },
  { name: 'Utilities', slug: 'utilities', icon: 'zap', color: '#eab308' },
  { name: 'Healthcare', slug: 'healthcare', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Entertainment', slug: 'entertainment', icon: 'film', color: '#ec4899' },
  { name: 'Investments', slug: 'investments', icon: 'trending-up', color: '#22c55e' },
  { name: 'Housing', slug: 'housing', icon: 'home', color: '#6366f1' },
  { name: 'Education', slug: 'education', icon: 'graduation-cap', color: '#14b8a6' },
  { name: 'Travel', slug: 'travel', icon: 'plane', color: '#06b6d4' },
  { name: 'Others', slug: 'others', icon: 'more-horizontal', color: '#64748b' },
] as const;

export const CATEGORIZATION_RULES = [
  { pattern: 'SWIGGY', categorySlug: 'food' },
  { pattern: 'ZOMATO', categorySlug: 'food' },
  { pattern: 'UBER', categorySlug: 'transportation' },
  { pattern: 'OLA', categorySlug: 'transportation' },
  { pattern: 'AMAZON', categorySlug: 'shopping' },
  { pattern: 'FLIPKART', categorySlug: 'shopping' },
  { pattern: 'NETFLIX', categorySlug: 'entertainment' },
  { pattern: 'SPOTIFY', categorySlug: 'entertainment' },
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const;
