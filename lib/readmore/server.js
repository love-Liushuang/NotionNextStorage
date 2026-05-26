import crypto from 'crypto'

const DEFAULT_COOKIE_NAME = 'readmore_unlock'

export function getReadmoreServerConfig() {
  return {
    apiBase: (process.env.READMORE_API_BASE || '').replace(/\/$/, ''),
    serviceToken: process.env.READMORE_SERVICE_TOKEN || '',
    cookieSecret: process.env.READMORE_COOKIE_SECRET || '',
    cookieName: process.env.READMORE_COOKIE_NAME || DEFAULT_COOKIE_NAME,
    isProduction: process.env.NODE_ENV === 'production'
  }
}

export function assertReadmoreServerConfig(config) {
  if (!config.apiBase) {
    return 'READMORE_API_BASE 未配置'
  }
  if (!config.serviceToken) {
    return 'READMORE_SERVICE_TOKEN 未配置'
  }
  if (!config.cookieSecret) {
    return 'READMORE_COOKIE_SECRET 未配置'
  }
  return null
}

function base64UrlEncode(value) {
  return Buffer.from(String(value), 'utf8').toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(String(value), 'base64url').toString('utf8')
}

function signValue(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''))
  const rightBuffer = Buffer.from(String(right || ''))
  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function packUnlockToken(token, secret) {
  const encoded = base64UrlEncode(token)
  return `${encoded}.${signValue(encoded, secret)}`
}

export function unpackUnlockToken(value, secret) {
  const [encoded, signature] = String(value || '').split('.')
  if (!encoded || !signature) {
    return ''
  }
  if (!safeEqual(signature, signValue(encoded, secret))) {
    return ''
  }
  return base64UrlDecode(encoded)
}

export function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || ''
  const cookies = cookieHeader.split(';').map(item => item.trim())
  for (const cookie of cookies) {
    const index = cookie.indexOf('=')
    if (index === -1) {
      continue
    }
    const key = cookie.slice(0, index)
    const value = cookie.slice(index + 1)
    if (key === name) {
      return decodeURIComponent(value)
    }
  }
  return ''
}

export function setUnlockCookie(res, { name, value, expiresAt, secure }) {
  const expires = new Date(expiresAt)
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000))
  res.setHeader(
    'Set-Cookie',
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${
      secure ? '; Secure' : ''
    }`
  )
}

export function clearUnlockCookie(res, { name, secure }) {
  res.setHeader(
    'Set-Cookie',
    `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
  )
}

export async function requestReadmoreApi(config, path, body) {
  const response = await fetch(`${config.apiBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.serviceToken}`
    },
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}
