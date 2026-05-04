import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { filterPostsByTitle, paginatePosts } from '@/lib/search/titleSearch'
import { DynamicLayout } from '@/themes/theme'

const TitleSearchPage = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

export async function getStaticProps({ params: { keyword, page }, locale }) {
  const props = await fetchGlobalAllData({
    from: 'search-title-page-props',
    locale
  })

  const allPosts = props.allPages?.filter(
    item => item.type === 'Post' && item.status === 'Published'
  )
  const matchedPosts = filterPostsByTitle(allPosts, keyword)
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  props.posts = paginatePosts(matchedPosts, page, POSTS_PER_PAGE)
  props.postCount = matchedPosts.length
  props.keyword = keyword
  props.page = page
  props.searchScope = 'title'

  delete props.allPages

  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export function getStaticPaths() {
  return {
    paths: [{ params: { keyword: 'NotionNext', page: '1' } }],
    fallback: true
  }
}

export default TitleSearchPage
