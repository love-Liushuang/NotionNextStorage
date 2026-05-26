import {
  assertReadmoreServerConfig,
  getReadmoreServerConfig,
  packUnlockToken,
  requestReadmoreApi,
  setUnlockCookie
} from '@/lib/readmore/server'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const config = getReadmoreServerConfig()
  const configError = assertReadmoreServerConfig(config)
  if (configError) {
    return res.status(500).json({ ok: false, message: configError })
  }

  const blogId = String(req.body?.blogId || '').trim()
  const code = String(req.body?.code || '')
  if (!blogId) {
    return res.status(400).json({ ok: false, message: '博客 ID 未配置' })
  }
  if (!/^\d{8}$/.test(code)) {
    return res.status(400).json({ ok: false, message: '验证码必须是 8 位数字' })
  }

  try {
    const { response, data } = await requestReadmoreApi(config, '/api/readmore/code/verify', {
      blogId,
      code
    })
    if (!response.ok || data.ok === false) {
      return res.status(response.status || 400).json({
        ok: false,
        message: data.message || '验证码校验失败'
      })
    }

    const token = data.data?.token
    const expiresAt = data.data?.expiresAt
    if (!token || !expiresAt) {
      return res.status(502).json({ ok: false, message: '解锁服务返回异常' })
    }

    setUnlockCookie(res, {
      name: config.cookieName,
      value: packUnlockToken(token, config.cookieSecret),
      expiresAt,
      secure: config.isProduction
    })
    return res.status(200).json({ ok: true, data: { expiresAt } })
  } catch (error) {
    console.error('[readmore][verify]', error)
    return res.status(500).json({ ok: false, message: '验证码校验服务暂时不可用' })
  }
}
