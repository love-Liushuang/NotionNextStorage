import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { buildTitleSearchHref } from '@/lib/search/titleSearch'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'

/**
 * Custom home search for this site.
 * It intentionally searches post titles only and avoids the global full-text search.
 */
const HomeTitleSearch = () => {
  const { locale } = useGlobal()
  const router = useRouter()
  const inputRef = useRef(null)
  const [onLoading, setLoadingState] = useState(false)
  const title = siteConfig('TITLE')
  const description = siteConfig('DESCRIPTION')

  const handleSearch = e => {
    e?.preventDefault()

    const keyword = inputRef.current?.value?.trim()
    if (!keyword) {
      inputRef.current?.focus()
      return
    }

    setLoadingState(true)
    router
      .push(buildTitleSearchHref(keyword, router.query))
      .finally(() => setLoadingState(false))
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

export default HomeTitleSearch
