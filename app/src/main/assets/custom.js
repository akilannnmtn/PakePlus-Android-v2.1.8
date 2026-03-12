window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
  const origin = e.target.closest('a')
  const isBaseTargetBlank = document.querySelector(
    'head base[target="_blank"]'
  )

  const isDownloadLink = origin && origin.href && (
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(origin.href) ||
    origin.download ||
    /\.(zip|pdf|docx|xlsx)$/i.test(origin.href)
  )

  if (
    (origin && origin.href && origin.target === '_blank' && !isDownloadLink) ||
    (origin && origin.href && isBaseTargetBlank && !isDownloadLink)
  ) {
    e.preventDefault()
    location.href = origin.href
  }
}

window.open = function (url, target, features) {
  const isDownloadUrl = url && (
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|zip|pdf|docx|xlsx)$/i.test(url)
  )
  if (isDownloadUrl) {
    return window.__TAURI_INTERNALS__.window.open(url, target, features)
  } else {
    location.href = url
  }
}

document.addEventListener('click', hookClick, { capture: true })

// ==================== 手机长按弹窗（极简稳定版）====================
let timer
let currentImg

// 长按触发
document.addEventListener('touchstart', e => {
  if (e.target.tagName === 'IMG') {
    currentImg = e.target
    timer = setTimeout(showModal, 500)
  }
}, false)

// 取消长按
document.addEventListener('touchend', () => clearTimeout(timer), false)
document.addEventListener('touchmove', () => clearTimeout(timer), false)

// 弹窗
function showModal() {
  if (confirm('保存图片到本地？')) {
    const a = document.createElement('a')
    a.href = currentImg.src
    a.download = 'image'
    a.click()
  }
}

// 电脑右键
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault()
    currentImg = e.target
    showModal()
  }
}, false)