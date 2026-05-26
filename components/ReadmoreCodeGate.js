import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const hasValue = value => value !== undefined && value !== null && value !== ''

const getFirstConfig = (keys, defaultVal = null) => {
  for (const key of keys) {
    const value = siteConfig(key)
    if (hasValue(value)) {
      return value
    }
  }
  return defaultVal
}

const toBool = value => value === true || value === 'true' || value === 1 || value === '1'

const normalizePreviewHeight = height => {
  if (!height || String(height).toLowerCase() === 'auto') {
    return null
  }
  const raw = String(height).trim()
  return /^\d+$/.test(raw) ? `${raw}px` : raw
}

const waitForContentReady = contentId =>
  new Promise(resolve => {
    let attempts = 0
    const maxAttempts = 60
    const timer = setInterval(() => {
      const target = document.getElementById(contentId)
      if (target && target.childElementCount > 0) {
        clearInterval(timer)
        resolve(target)
        return
      }
      attempts += 1
      if (attempts >= maxAttempts) {
        clearInterval(timer)
        resolve(null)
      }
    }, 200)
  })

function isPathInList(path, listStr) {
  if (!path || !listStr) {
    return false
  }
  const processedPath = path
    .replace(/\?.*$/, '')
    .replace(/.*\/([^/]+)(?:\.html)?$/, '$1')

  const tokens = String(listStr)
    .split(/[,\n\r\s]+/)
    .map(t => t.trim())
    .filter(Boolean)

  if (tokens.includes(processedPath)) {
    return true
  }

  return tokens.some(token => {
    if (!token.includes('*')) {
      return false
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return processedPath.includes(token.slice(1, -1))
    }
    if (token.endsWith('*')) {
      return processedPath.startsWith(token.slice(0, -1))
    }
    if (token.startsWith('*')) {
      return processedPath.endsWith(token.slice(1))
    }
    return false
  })
}

function ensureReadmoreTarget(contentId) {
  const targetId = 'readmore-code-target'
  const articleRoot = document.getElementById('article-wrapper') || document
  const existed = articleRoot.querySelector?.(`#${targetId}`)
  if (existed) {
    return existed
  }

  const contentNode = articleRoot.querySelector?.(`#${contentId}`) || document.getElementById(contentId)
  if (!contentNode?.parentElement) {
    return null
  }

  const wrapper = document.createElement('div')
  wrapper.id = targetId
  wrapper.style.position = 'relative'
  contentNode.parentElement.insertBefore(wrapper, contentNode)
  wrapper.appendChild(contentNode)
  return wrapper
}

function toggleTocItems(selector, disable) {
  if (!selector) {
    return
  }
  document.querySelectorAll(selector).forEach(item => {
    item.style.pointerEvents = disable ? 'none' : 'auto'
    item.style.opacity = disable ? '0.5' : '1'
  })
}

const ReadmoreCodeGate = ({ lock } = {}) => {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useGlobal()
  const [target, setTarget] = useState(null)
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  const enabled = toBool(getFirstConfig(['READMORE_ENABLED'], false))
  const blogId = String(getFirstConfig(['READMORE_BLOG_ID'], '') || '').trim()
  const wechatName = getFirstConfig(['READMORE_WECHAT_NAME'], '')
  const keyword = getFirstConfig(['READMORE_KEYWORD'], '验证码')
  const qrcode = getFirstConfig(['READMORE_QRCODE'], '')
  const btnText = getFirstConfig(['READMORE_BTN_TEXT'], '关注公众号，获取验证码，阅读全文')
  const contentId = getFirstConfig(['READMORE_CONTENT_ID'], 'notion-article')
  const height = getFirstConfig(['READMORE_HEIGHT'], 218)
  const whiteList = getFirstConfig(['READMORE_WHITE_LIST'], '')
  const yellowList = getFirstConfig(['READMORE_YELLOW_LIST'], '')
  const lockToc = getFirstConfig(['READMORE_LOCK_TOC'], 'yes')
  const tocSelector = getFirstConfig(['READMORE_TOC_SELECTOR'], 'a.catalog-item')
  const debug = toBool(getFirstConfig(['READMORE_DEBUG'], false))

  const shouldRun = useMemo(() => {
    if (!enabled || !blogId || lock) {
      return false
    }
    const inYellowList = isPathInList(router.asPath, yellowList)
    const inWhiteList = isPathInList(router.asPath, whiteList)
    if (yellowList && !inYellowList) {
      return false
    }
    if (!yellowList && inWhiteList) {
      return false
    }
    return true
  }, [blogId, enabled, lock, router.asPath, whiteList, yellowList])

  useEffect(() => {
    if (!shouldRun) {
      setUnlocked(true)
      return
    }
    if (isLoaded && isSignedIn) {
      setUnlocked(true)
      return
    }

    let cancelled = false
    const checkStatus = async () => {
      setChecking(true)
      setMessage('')
      setUnlocked(false)
      try {
        const response = await fetch(`/api/readmore/status?blogId=${encodeURIComponent(blogId)}`, {
          credentials: 'include'
        })
        const data = await response.json().catch(() => ({}))
        if (!cancelled) {
          setUnlocked(response.ok && data.ok !== false && data.data?.unlocked === true)
        }
      } catch (error) {
        if (debug) {
          console.warn('[Readmore][status]', error)
        }
        if (!cancelled) {
          setUnlocked(false)
        }
      } finally {
        if (!cancelled) {
          setChecking(false)
        }
      }
    }
    checkStatus()
    return () => {
      cancelled = true
    }
  }, [blogId, debug, isLoaded, isSignedIn, shouldRun])

  useEffect(() => {
    if (!shouldRun || unlocked) {
      if (target) {
        target.style.height = target.dataset.readmoreOriginalHeight || ''
        target.style.overflow = target.dataset.readmoreOriginalOverflow || ''
      }
      if (lockToc === 'yes') {
        toggleTocItems(tocSelector, false)
      }
      return
    }

    let cancelled = false
    waitForContentReady(contentId).then(() => {
      if (cancelled) {
        return
      }
      const wrapper = ensureReadmoreTarget(contentId)
      if (!wrapper) {
        if (debug) {
          console.warn(`[Readmore] 未找到正文容器: #${contentId}`)
        }
        return
      }
      if (!wrapper.dataset.readmoreOriginalHeight) {
        wrapper.dataset.readmoreOriginalHeight = wrapper.style.height || ''
      }
      if (!wrapper.dataset.readmoreOriginalOverflow) {
        wrapper.dataset.readmoreOriginalOverflow = wrapper.style.overflow || ''
      }
      const previewHeight = normalizePreviewHeight(height)
      if (previewHeight) {
        wrapper.style.height = previewHeight
        wrapper.style.overflow = 'hidden'
      }
      wrapper.style.position = 'relative'
      setTarget(wrapper)
      if (lockToc === 'yes') {
        toggleTocItems(tocSelector, true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [contentId, debug, height, lockToc, shouldRun, target, tocSelector, unlocked])

  async function submitCode(event) {
    event.preventDefault()
    setMessage('')
    setMessageType('error')
    if (!/^\d{8}$/.test(code)) {
      setMessage('请输入 8 位数字验证码')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/readmore/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blogId,
          code
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || '验证码错误')
      }
      setUnlocked(true)
      setMessageType('success')
      setMessage('文章已解锁')
    } catch (error) {
      setMessage(error.message || '验证码校验失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!shouldRun || unlocked || !target) {
    return null
  }

  return createPortal(
    <div className='readmore-code-mask'>
      <div className='readmore-code-panel'>
        <div className='readmore-code-main'>
          <h3>{btnText}</h3>
          <p>
            发送关键词
            <strong> {keyword} </strong>
            {wechatName ? `到公众号「${wechatName}」` : '到公众号'}，获取本月验证码。
          </p>
          <form
            onSubmit={event => {
              void submitCode(event)
            }}
            className='readmore-code-form'>
            <input
              type='text'
              inputMode='numeric'
              maxLength={8}
              placeholder='输入 8 位验证码'
              value={code}
              onChange={event => setCode(event.target.value)}
              disabled={submitting || checking}
            />
            <button type='submit' disabled={submitting || checking}>
              {submitting ? '校验中...' : '解锁'}
            </button>
          </form>
          {message ? (
            <div className={`readmore-code-message ${messageType}`}>{message}</div>
          ) : null}
        </div>
        {qrcode ? (
          <div className='readmore-code-qrcode'>
            <img src={qrcode} alt={wechatName || '公众号二维码'} />
          </div>
        ) : null}
      </div>
      <style jsx global>{`
        .readmore-code-mask {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          display: flex;
          justify-content: center;
          padding: 120px 16px 24px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.96) 34%,
            rgba(255, 255, 255, 1)
          );
        }
        .dark .readmore-code-mask {
          background: linear-gradient(
            to bottom,
            rgba(16, 16, 20, 0),
            rgba(16, 16, 20, 0.96) 34%,
            rgba(16, 16, 20, 1)
          );
        }
        .readmore-code-panel {
          width: min(680px, 100%);
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          border: 1px solid rgba(80, 96, 116, 0.18);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 0 50px rgba(22, 34, 48, 0.34);
          padding: 18px;
        }
        .dark .readmore-code-panel {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(32, 34, 39, 0.96);
        }
        .readmore-code-main h3 {
          margin: 0 0 8px;
          color: #172334;
          font-size: 18px;
          font-weight: 800;
        }
        .dark .readmore-code-main h3 {
          color: #f4f7fb;
        }
        .readmore-code-main p {
          margin: 0 0 14px;
          color: #607086;
          line-height: 1.7;
        }
        .dark .readmore-code-main p {
          color: #c5cbd5;
        }
        .readmore-code-main strong {
          color: #0f5ead;
        }
        .readmore-code-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }
        .readmore-code-form input {
          min-width: 0;
          border: 1px solid #cbd7e4;
          border-radius: 8px;
          background: #fff;
          color: #172334;
          outline: none;
          padding: 10px 12px;
        }
        .readmore-code-form input:focus {
          border-color: #0f5ead;
          box-shadow: 0 0 0 3px rgba(15, 94, 173, 0.12);
        }
        .readmore-code-form button {
          border: 1px solid #0f5ead;
          border-radius: 8px;
          background: #0f5ead;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
          padding: 10px 16px;
        }
        .readmore-code-form button:disabled,
        .readmore-code-form input:disabled {
          cursor: not-allowed;
          opacity: 0.68;
        }
        .readmore-code-message {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 700;
        }
        .readmore-code-message.error {
          color: #b3261e;
        }
        .readmore-code-message.success {
          color: #147a3d;
        }
        .readmore-code-qrcode img {
          width: 112px;
          height: 112px;
          border-radius: 10px;
          object-fit: cover;
        }
        @media (max-width: 640px) {
          .readmore-code-panel {
            grid-template-columns: 1fr;
          }
          .readmore-code-form {
            grid-template-columns: 1fr;
          }
          .readmore-code-qrcode {
            display: flex;
            justify-content: center;
          }
        }
      `}</style>
    </div>,
    target
  )
}

export default ReadmoreCodeGate
