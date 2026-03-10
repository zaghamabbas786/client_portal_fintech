/** Slugify category for URL (e.g. "Getting Started" → "getting-started") */
export function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** Find category from slug given a list of categories */
export function slugToCategory(slug: string, categories: string[]): string | null {
  const found = categories.find((c) => categoryToSlug(c) === slug)
  return found ?? null
}
