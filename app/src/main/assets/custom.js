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

// ==================== 全屏开屏广告（仅APP启动显示）====================
function showSplash() {
  // 标记：是否是APP首次启动（用sessionStorage，关闭APP后重置）
  const isAppFirstStart = sessionStorage.getItem('isAppFirstStart')
  if (isAppFirstStart) return // 非首次启动，不显示开屏图

  // 标记为已启动，后续跳转不再显示
  sessionStorage.setItem('isAppFirstStart', 'true')

  const splash = document.createElement('div')
  splash.id = 'splash'
  splash.style.cssText = `
    position:fixed !important; 
    z-index:9999999 !important; 
    left:0; top:0;
    width:100vw !important; 
    height:100vh !important;
    background:#000 !important;
    display:flex !important; 
    align-items:center !important; 
    justify-content:center !important;
    overflow:hidden !important;
  `
  // ↓↓↓ 替换成你的开屏图链接 ↓↓↓
  splash.innerHTML = `
    <img src="https://welovejosuhan.com/yeka/app/start.jpg" 
         style="position:absolute !important; width:100% !important; height:100% !important; object-fit:cover !important;">
    <div id="skip" 
         style="position:absolute;top:20px;right:20px;background:rgba(0,0,0,0.6);color:#fff;padding:6px 12px;border-radius:20px;font-size:14px;">
         跳过 10
    </div>
  `
  document.body.insertBefore(splash, document.body.firstChild)

  let sec = 10
  const skipBtn = document.getElementById('skip')
  const timer = setInterval(() => {
    sec--
    skipBtn.innerText = '跳过 ' + sec
    if (sec <= 0) {
      clearInterval(timer)
      splash.remove()
    }
  }, 1000)

  skipBtn.onclick = () => {
    clearInterval(timer)
    splash.remove()
  }
}

// ==================== 长按保存弹窗（最终完美版）====================
let timer = null
let currentImg = null
let isModalShow = false

document.addEventListener('touchstart', e => {
  if (e.target.tagName === 'IMG') {
    currentImg = e.target
    timer = setTimeout(() => {
      if (!isModalShow) showSaveModal()
    }, 500)
  }
}, false)

document.addEventListener('touchend', () => clearTimeout(timer), false)
document.addEventListener('touchmove', () => clearTimeout(timer), false)

document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault()
    currentImg = e.target
    if (!isModalShow) showSaveModal()
  }
}, false)

function showSaveModal() {
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

// 延迟100ms启动开屏，仅首次启动显示
setTimeout(showSplash, 100)