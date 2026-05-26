import {
  assertReadmoreServerConfig,
  clearUnlockCookie,
  getReadmoreServerConfig,
  readCookie,
  requestReadmoreApi,
  unpackUnlockToken
} from '@/lib/readmore/server'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const config = getReadmoreServerConfig()
  const configError = assertReadmoreServerConfig(config)
  if (configError) {
    return res.status(500).json({ ok: false, message: configError })
  }

  const blogId = String(req.query?.blogId || req.body?.blogId || '').trim()
  if (!blogId) {
    return res.status(400).json({ ok: false, message: '博客 ID 未配置' })
  }

  const packedToken = readCookie(req, config.cookieName)
  const token = unpackUnlockToken(packedToken, config.cookieSecret)
  if (!token) {
    return res.status(200).json({ ok: true, data: { unlocked: false } })
  }

  try {
    const { response, data } = await requestReadmoreApi(config, '/api/readmore/token/validate', {
      blogId,
      token
    })
    const unlocked = response.ok && data.ok !== false && data.data?.valid === true
    if (!unlocked) {
      clearUnlockCookie(res, {
        name: config.cookieName,
        secure: config.isProduction
      })
    }
    return res.status(200).json({
      ok: true,
      data: {
        unlocked,
        expiresAt: data.data?.expiresAt || null
      }
    })
  } catch (error) {
    console.error('[readmore][status]', error)
    return res.status(500).json({ ok: false, message: '解锁状态校验服务暂时不可用' })
  }
}
