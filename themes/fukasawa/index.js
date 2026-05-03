'use client'

import AlgoliaSearchModal from '@/components/AlgoliaSearchModal'
import { AdSlot } from '@/components/GoogleAdsense'
import replaceSearchResult from '@/components/Mark'
import WWAds from '@/components/WWAds'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import { Transition } from '@headlessui/react'
import dynamic from 'next/dynamic'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import ArticleDetail from './components/ArticleDetail'
import ArticleLock from './components/ArticleLock'
import AsideLeft from './components/AsideLeft'
import BlogListPage from './components/BlogListPage'
import BlogListScroll from './components/BlogListScroll'
import BlogArchiveItem from './components/BlogPostArchive'
import Header from './components/Header'
import TagItemMini from './components/TagItemMini'
import CONFIG from './config'
import { Style } from './style'

const Live2D = dynamic(() => import('@/components/Live2D'))

// 主题全局状态
const ThemeGlobalFukasawa = createContext()
export const useFukasawaGlobal = () => useContext(ThemeGlobalFukasawa)

/**
 * 基础布局 采用左右两侧布局，移动端使用顶部导航栏
 * @param children
 * @param layout
 * @param tags
 * @param meta
 * @param post
 * @param currentSearch
 * @param currentCategory
 * @param currentTag
 * @param categories
 * @returns {JSX.Element}
 * @constructor
 */
const LayoutBase = props => {
  const { children, headerSlot } = props
  const leftAreaSlot = <Live2D />
  const { onLoading, fullWidth } = useGlobal()
  const searchModal = useRef(null)
  return (
    <ThemeGlobalFukasawa.Provider value={{ searchModal }}>
      <div
        id='theme-fukasawa'
        className={`${siteConfig('FONT_STYLE')} dark:bg-black scroll-smooth`}>
        <Style />
        {/* 页头导航，此主题只在移动端生效 */}
        <Header {...props} />

        <div
          className={
            (JSON.parse(siteConfig('LAYOUT_SIDEBAR_REVERSE'))
              ? 'flex-row-reverse'
              : '') + ' flex'
          }>
          {/* 侧边抽屉 */}
          <AsideLeft {...props} slot={leftAreaSlot} />

          <main
            id='wrapper'
            className='relative flex w-full py-8 justify-center bg-day dark:bg-night'>
            <div
              id='container-inner'
              className={`${fullWidth ? '' : '2xl:max-w-6xl md:max-w-4xl'} w-full relative z-10`}>
              <Transition
                show={!onLoading}
                appear={true}
                className='w-full'
                enter='transition ease-in-out duration-700 transform order-first'
                enterFrom='opacity-0 translate-y-16'
                enterTo='opacity-100'
                leave='transition ease-in-out duration-300 transform'
                leaveFrom='opacity-100 translate-y-0'
                leaveTo='opacity-0 -translate-y-16'
                unmount={false}>
                <div> {headerSlot} </div>
                <div> {children} </div>
              </Transition>

              <div className='mt-2'>
                <AdSlot type='native' />
              </div>
            </div>
          </main>
        </div>

        <AlgoliaSearchModal cRef={searchModal} {...props} />
      </div>
    </ThemeGlobalFukasawa.Provider>
  )
}
// /**
//  * 首页
//  * @param {*} props notion数据
//  * @returns 首页就是一个博客列表
//  */
// const LayoutIndex = props => {
//     return <LayoutPostList {...props} />
// }

/**
 * 首页
 * @returns 首页搜索
 */
const LayoutIndex = () => {
  return <HomeSearch />
}

const HomeSearch = () => {
  const { locale } = useGlobal()
  const { searchModal } = useFukasawaGlobal()
  const router = useRouter()
  const inputRef = useRef(null)
  const [onLoading, setLoadingState] = useState(false)
  const algoliaEnabled = siteConfig('ALGOLIA_APP_ID')
  const title = siteConfig('TITLE')
  const description = siteConfig('DESCRIPTION')

  const getPreservedQuery = () => {
    const query = {}
    const keys = ['theme', 'mode', 'lite']
    keys.forEach(key => {
      if (router.query?.[key]) {
        query[key] = router.query[key]
      }
    })
    return query
  }

  const handleSearch = e => {
    e?.preventDefault()

    if (algoliaEnabled) {
      searchModal?.current?.openSearch()
      return
    }

    const keyword = inputRef.current?.value?.trim()
    if (!keyword) {
      inputRef.current?.focus()
      return
    }

    setLoadingState(true)
    router
      .push({
        pathname: '/search/[keyword]',
        query: {
          keyword,
          ...getPreservedQuery()
        }
      })
      .finally(() => setLoadingState(false))
  }

  const handleFocus = () => {
    if (algoliaEnabled) {
      searchModal?.current?.openSearch()
    }
  }

  return (
    <section className='flex min-h-[65vh] w-full items-center justify-center px-4 py-16 md:px-10'>
      <div className='w-full max-w-3xl'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-black leading-tight text-gray-900 dark:text-gray-100 md:text-5xl'>
            {title}
          </h1>
          {description && (
            <p className='mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-500 dark:text-gray-400 md:text-lg'>
              {description}
            </p>
          )}
        </div>

        <form onSubmit={handleSearch} className='w-full'>
          <div className='flex h-16 w-full items-center border-2 border-gray-900 bg-white px-5 shadow-md transition focus-within:shadow-xl dark:border-gray-200 dark:bg-hexo-black-gray md:h-20'>
            <i className='fas fa-search mr-4 text-xl text-gray-400 md:text-2xl' />
            <input
              ref={inputRef}
              type='search'
              autoComplete='off'
              aria-label={locale.SEARCH.ARTICLES}
              placeholder={locale.SEARCH.ARTICLES}
              onFocus={handleFocus}
              className='h-full min-w-0 flex-1 bg-transparent text-lg font-light text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 md:text-2xl'
            />
            <button
              type='submit'
              aria-label={locale.NAV.SEARCH}
              className='ml-4 flex h-11 w-11 flex-none items-center justify-center bg-gray-900 text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-black dark:hover:bg-gray-300 md:h-12 md:w-12'>
              <i
                className={`fas ${onLoading ? 'fa-spinner animate-spin' : 'fa-arrow-right'}`}
              />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

/**
 * 博客列表
 * @param {*} props
 */
const LayoutPostList = props => {
  const POST_LIST_STYLE = siteConfig('POST_LIST_STYLE')
  return (
    <>
      <div className='w-full p-2'>
        <WWAds className='w-full' orientation='horizontal' />
      </div>
      { POST_LIST_STYLE=== 'page' ? (
        <BlogListPage {...props} />
      ) : (
        <BlogListScroll {...props} />
      )}
    </>
  )
}

/**
 * 文章详情
 * @param {*} props
 * @returns
 */
const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000
  useEffect(() => {
    // 404
    if (!post) {
      setTimeout(
        () => {
          if (isBrowser) {
            const article = document.querySelector('#article-wrapper #notion-article')
            if (!article) {
              router.push('/404').then(() => {
                console.warn('找不到页面', router.asPath)
              })
            }
          }
        },
        waiting404
      )
    }
  }, [post])
  return (
    <>
      {lock ? (
        <ArticleLock validPassword={validPassword} />
      ) : post && (
        <ArticleDetail {...props} />
      )}
    </>
  )
}

/**
 * 搜索页
 */
const LayoutSearch = props => {
  const { keyword } = props
  const router = useRouter()
  useEffect(() => {
    if (isBrowser) {
      replaceSearchResult({
        doms: document.getElementById('posts-wrapper'),
        search: keyword,
        target: {
          element: 'span',
          className: 'text-red-500 border-b border-dashed'
        }
      })
    }
  }, [router])
  return <LayoutPostList {...props} />
}

/**
 * 归档页面
 */
const LayoutArchive = props => {
  const { archivePosts } = props
  return (
    <>
      <div className='mb-10 pb-20 bg-white md:p-12 p-3 dark:bg-gray-800 shadow-md min-h-full'>
        {Object.keys(archivePosts).map(archiveTitle => (
          <BlogArchiveItem
            key={archiveTitle}
            posts={archivePosts[archiveTitle]}
            archiveTitle={archiveTitle}
          />
        ))}
      </div>
    </>
  )
}

/**
 * 404
 * @param {*} props
 * @returns
 */
const Layout404 = props => {
  const router = useRouter()
  const { locale } = useGlobal()
  useEffect(() => {
    // 延时3秒如果加载失败就返回首页
    setTimeout(() => {
      const article = isBrowser && document.getElementById('article-wrapper')
      if (!article) {
        router.push('/').then(() => {
          // console.log('找不到页面', router.asPath)
        })
      }
    }, 3000)
  }, [])

  return <>
        <div className='md:-mt-20 text-black w-full h-screen text-center justify-center content-center items-center flex flex-col'>
            <div className='dark:text-gray-200'>
                <h2 className='inline-block border-r-2 border-gray-600 mr-2 px-3 py-2 align-top'><i className='mr-2 fas fa-spinner animate-spin' />404</h2>
                <div className='inline-block text-left h-32 leading-10 items-center'>
                    <h2 className='m-0 p-0'>{locale.NAV.PAGE_NOT_FOUND_REDIRECT}</h2>
                </div>
            </div>
        </div>
    </>
}

/**
 * 分类列表
 * @param {*} props
 * @returns
 */
const LayoutCategoryIndex = props => {
  const { locale } = useGlobal()
  const { categoryOptions } = props
  return (
    <>
      <div className='bg-white dark:bg-gray-700 px-10 py-10 shadow'>
        <div className='dark:text-gray-200 mb-5'>
          <i className='mr-4 fas fa-th' />
          {locale.COMMON.CATEGORY}:
        </div>
        <div id='category-list' className='duration-200 flex flex-wrap'>
          {categoryOptions?.map(category => {
            return (
              <SmartLink
                key={category.name}
                href={`/category/${category.name}`}
                passHref
                legacyBehavior>
                <div
                  className={
                    'hover:text-black dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-600 px-5 cursor-pointer py-2 hover:bg-gray-100'
                  }>
                  <i className='mr-4 fas fa-folder' />
                  {category.name}({category.count})
                </div>
              </SmartLink>
            )
          })}
        </div>
      </div>
    </>
  )
}

/**
 * 标签列表
 * @param {*} props
 * @returns
 */
const LayoutTagIndex = props => {
  const { locale } = useGlobal()
  const { tagOptions } = props
  return <></>
//   return (
//     <>
//       <div className='bg-white dark:bg-gray-700 px-10 py-10 shadow'>
//         <div className='dark:text-gray-200 mb-5'>
//           <i className='mr-4 fas fa-tag' />
//           {locale.COMMON.TAGS}:
//         </div>
//         <div id='tags-list' className='duration-200 flex flex-wrap ml-8'>
//           {tagOptions.map(tag => {
//             return (
//               <div key={tag.name} className='p-2'>
//                 <TagItemMini key={tag.name} tag={tag} />
//               </div>
//             )
//           })}
//         </div>
//       </div>
//     </>
//   )
}

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
