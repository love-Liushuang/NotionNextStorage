import {
  buildTitleSearchHref,
  filterPostsByTitle,
  getTitleSearchPreservedQuery,
  paginatePosts
} from '@/lib/search/titleSearch'

describe('titleSearch', () => {
  test('filters posts by title only', () => {
    const posts = [
      { title: 'Notion database guide', summary: 'React notes' },
      { title: 'React performance', summary: 'Notion appears only here' },
      { title: 'Next.js search patterns', tags: ['notion'] }
    ]

    expect(filterPostsByTitle(posts, 'notion')).toEqual([
      { title: 'Notion database guide', summary: 'React notes' }
    ])
  })

  test('preserves only supported query params', () => {
    expect(
      getTitleSearchPreservedQuery({
        theme: 'fukasawa',
        mode: 'dark',
        lite: 'true',
        keyword: 'old',
        s: 'old'
      })
    ).toEqual({
      theme: 'fukasawa',
      mode: 'dark',
      lite: 'true'
    })
  })

  test('builds the title-search route href', () => {
    expect(
      buildTitleSearchHref('  Notion  ', {
        theme: 'fukasawa',
        s: 'ignored'
      })
    ).toEqual({
      pathname: '/search/title/[keyword]',
      query: {
        theme: 'fukasawa',
        keyword: 'Notion'
      }
    })
  })

  test('paginates title search results', () => {
    const posts = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]

    expect(paginatePosts(posts, 2, 2)).toEqual([{ id: 3 }, { id: 4 }])
  })
})
