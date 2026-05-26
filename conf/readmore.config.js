/**
 * 自研公众号验证码解锁配置
 * - 普通展示配置可在 Notion Config 页面用同名键覆盖
 * - READMORE_API_BASE / READMORE_SERVICE_TOKEN / READMORE_COOKIE_SECRET 必须放服务端环境变量
 */
module.exports = {
  READMORE_ENABLED:
    process.env.NEXT_PUBLIC_READMORE_ENABLED ||
    process.env.READMORE_ENABLED ||
    false,
  READMORE_BLOG_ID:
    process.env.NEXT_PUBLIC_READMORE_BLOG_ID ||
    process.env.READMORE_BLOG_ID ||
    '',
  READMORE_WECHAT_NAME:
    process.env.NEXT_PUBLIC_READMORE_WECHAT_NAME ||
    process.env.READMORE_WECHAT_NAME ||
    '',
  READMORE_KEYWORD:
    process.env.NEXT_PUBLIC_READMORE_KEYWORD ||
    process.env.READMORE_KEYWORD ||
    '验证码',
  READMORE_QRCODE:
    process.env.NEXT_PUBLIC_READMORE_QRCODE ||
    process.env.READMORE_QRCODE ||
    '',
  READMORE_BTN_TEXT:
    process.env.NEXT_PUBLIC_READMORE_BTN_TEXT ||
    process.env.READMORE_BTN_TEXT ||
    '关注公众号，获取验证码，阅读全文',
  READMORE_CONTENT_ID:
    process.env.NEXT_PUBLIC_READMORE_CONTENT_ID ||
    process.env.READMORE_CONTENT_ID ||
    'notion-article',
  READMORE_HEIGHT:
    process.env.NEXT_PUBLIC_READMORE_HEIGHT ||
    process.env.READMORE_HEIGHT ||
    218,
  READMORE_WHITE_LIST:
    process.env.NEXT_PUBLIC_READMORE_WHITE_LIST ||
    process.env.READMORE_WHITE_LIST ||
    '',
  READMORE_YELLOW_LIST:
    process.env.NEXT_PUBLIC_READMORE_YELLOW_LIST ||
    process.env.READMORE_YELLOW_LIST ||
    '',
  READMORE_LOCK_TOC:
    process.env.NEXT_PUBLIC_READMORE_LOCK_TOC ||
    process.env.READMORE_LOCK_TOC ||
    'yes',
  READMORE_TOC_SELECTOR:
    process.env.NEXT_PUBLIC_READMORE_TOC_SELECTOR ||
    process.env.READMORE_TOC_SELECTOR ||
    'a.catalog-item',
  READMORE_DEBUG:
    process.env.NEXT_PUBLIC_READMORE_DEBUG ||
    process.env.READMORE_DEBUG ||
    false
}
