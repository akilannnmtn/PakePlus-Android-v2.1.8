window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    
    // 新增：判断是否是下载链接（排除图片/文件下载）
    const isDownloadLink = origin && origin.href && (
        // 匹配常见图片后缀
        /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(origin.href) ||
        // 匹配Content-Disposition为下载的链接（后端标记的下载链接）
        origin.download || 
        // 可添加其他文件后缀，比如zip/pdf等
        /\.(zip|pdf|docx|xlsx)$/i.test(origin.href)
    )

    // 修改判断逻辑：仅拦截非下载类的_blank链接
    if (
        (origin && origin.href && origin.target === '_blank' && !isDownloadLink) ||
        (origin && origin.href && isBaseTargetBlank && !isDownloadLink)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

// 重写window.open，但排除下载链接（统一后缀规则）
window.open = function (url, target, features) {
    console.log('open', url, target, features)
    // 统一下载链接后缀，和上面hookClick保持一致
    const isDownloadUrl = url && (
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|zip|pdf|docx|xlsx)$/i.test(url)
    )
    if (isDownloadUrl) {
        // PakePlus基于Tauri，直接调用原生open恢复下载
        return window.__TAURI_INTERNALS__.window.open(url, target, features)
    } else {
        location.href = url
    }
}

// ========== 核心修改部分 ==========
// 1. 移除全局capture: true，仅拦截<a>标签点击（避免阻断图片长按）
// 2. 添加passive: true，不阻断原生触摸事件
document.addEventListener('click', (e) => {
    // 只处理<a>标签的点击，其他元素（如图片）不触发hookClick
    if (e.target.closest('a')) {
        hookClick(e);
    }
}, { passive: true });

// 3. 强制放行图片的长按上下文菜单（PakePlus关键修复）
document.addEventListener('contextmenu', (e) => {
    // 仅允许图片的长按/右键菜单，不影响其他逻辑
    if (e.target.tagName === 'IMG') {
        return true; // 不阻止原生菜单弹出
    }
}, { capture: false });

// 4. 兜底：给图片添加自定义长按下载（防止PakePlus禁用原菜单时生效）
let touchTimer = null;
document.addEventListener('touchstart', (e) => {
    const target = e.target;
    if (target.tagName === 'IMG' && e.touches.length === 1) {
        // 长按500ms触发下载
        touchTimer = setTimeout(() => {
            const imgUrl = target.src;
            const a = document.createElement('a');
            a.href = imgUrl;
            a.download = `pake_img_${Date.now()}.${imgUrl.split('.').pop()}`;
            a.click();
            // PakePlus内置提示（可选）
            if (window.__TAURI__?.dialog) {
                window.__TAURI__.dialog.message('图片下载已触发');
            }
        }, 500);
    }
}, { passive: true });

// 触摸结束取消长按
document.addEventListener('touchend', () => {
    if (touchTimer) clearTimeout(touchTimer);
}, { passive: true });