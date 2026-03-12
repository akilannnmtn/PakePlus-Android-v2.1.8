window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what you are doing, don't touch it
const hookClick = (e) => {
  const origin = e.target.closest('a')
  const isBaseTargetBlank = document.querySelector('head base[target="_blank"]')

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

// ==================== 长按弹窗（防重复·最终版）====================
let timer = null
let currentImg = null
let isModalShow = false

// 触摸开始
document.addEventListener('touchstart', e => {
  if (e.target.tagName === 'IMG') {
    currentImg = e.target
    timer = setTimeout(() => {
      if (!isModalShow) {
        showSaveModal()
      }
    }, 500)
  }
}, false)

// 取消长按
document.addEventListener('touchend', () => {
  clearTimeout(timer)
}, false)

document.addEventListener('touchmove', () => {
  clearTimeout(timer)
}, false)

// 电脑右键
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault()
    currentImg = e.target
    if (!isModalShow) {
      showSaveModal()
    }
  }
}, false)

// 弹窗（全局只允许同时存在一个）
function showSaveModal() {
  // 强制只允许一个弹窗
  if (isModalShow) return
  isModalShow = true

  const old = document.getElementById('save-modal')
  if (old) old.remove()

  const modal = document.createElement('div')
  modal.id = 'save-modal'
  modal.style.cssText = `
    position:fixed; z-index:999999; left:0; top:0; width:100%; height:100%;
    display:flex; align-items:center; justify-content:center;
  `
  modal.innerHTML = `
    <div style="background:rgba(0,0,0,0.5); width:100%; height:100%; position:absolute;"></div>
    <div style="background:#fff; border-radius:12px; width:270px; padding:20px; text-align:center; z-index:10;">
      <div style="font-size:16px; margin-bottom:20px;">是否保存图片到本地？</div>
      <div style="display:flex; gap:10px;">
        <button id="btn-yes" style="flex:1; padding:10px; background:#007AFF; color:#fff; border:none; border-radius:8px;">保存</button>
        <button id="btn-no" style="flex:1; padding:10px; background:#f2f2f2; border:none; border-radius:8px;">取消</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  document.getElementById('btn-yes').onclick = () => {
    const a = document.createElement('a')
    a.href = currentImg.src
    a.download = 'image'
    a.click()
    modal.remove()
    isModalShow = false
  }

  document.getElementById('btn-no').onclick = () => {
    modal.remove()
    isModalShow = false
  }

  modal.children[0].onclick = () => {
    modal.remove()
    isModalShow = false
  }
}