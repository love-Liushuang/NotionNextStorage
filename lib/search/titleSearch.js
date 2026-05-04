export const TITLE_SEARCH_ROUTE = '/search/title/[keyword]'

const PRESERVED_QUERY_KEYS = ['theme', 'mode', 'lite']

export const normalizeSearchKeyword = keyword => {
  const rawKeyword = Array.isArray(keyword) ? keyword[0] : keyword
  return typeof rawKeyword === 'string' ? rawKeyword.trim() : ''
}

const normalizeComparableText = value => {
  return String(value || '').trim().toLowerCase()
}

export const getTitleSearchPreservedQuery = query => {
  const preserved = {}

  PRESERVED_QUERY_KEYS.forEach(key => {
    if (query?.[key]) {
      preserved[key] = query[key]
    }
  })

  return preserved
}

export const buildTitleSearchHref = (keyword, currentQuery = {}) => {
  return {
    pathname: TITLE_SEARCH_ROUTE,
    query: {
      ...getTitleSearchPreservedQuery(currentQuery),
      keyword: normalizeSearchKeyword(keyword)
    }
  }
}

export const filterPostsByTitle = (posts = [], keyword) => {
  const normalizedKeyword = normalizeComparableText(normalizeSearchKeyword(keyword))
  if (!normalizedKeyword) {
    return []
  }

  return posts.filter(post => {
    return normalizeComparableText(post?.title).includes(normalizedKeyword)
  })
}

export const paginatePosts = (posts = [], page = 1, postsPerPage = 12) => {
  const currentPage = Number(page) || 1
  const pageSize = Number(postsPerPage) || 12
  const start = pageSize * (currentPage - 1)
  return posts.slice(start, start + pageSize)
}
