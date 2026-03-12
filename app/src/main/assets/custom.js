window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
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
    const isDownloadUrl = url && /\.(jpg|jpeg|png|gif|webp|svg|bmp|zip|pdf|docx|xlsx)$/i.test(url)
    if (isDownloadUrl) {
        return window.__TAURI_INTERNALS__.window.open(url, target, features)
    } else {
        location.href = url
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
        hookClick(e);
    }
}, { passive: true });

// ========== 核心：精准区分轻触/长按（保留轻触点开图片） ==========
let pressTimer = null;
let isLongPressTriggered = false; // 标记是否触发了长按
let currentImgSrc = '';

// 1. 保存弹窗（极简稳定版）
function showSaveModal() {
    // 移除旧弹窗
    const oldModal = document.getElementById('img-save-modal');
    if (oldModal) oldModal.remove();

    // 弹窗DOM（层级拉满，避免遮挡）
    const modal = document.createElement('div');
    modal.id = 'img-save-modal';
    modal.style = `
        position: fixed; top:0; left:0; width:100%; height:100%; z-index:999999;
        display:flex; justify-content:center; align-items:center;
        pointer-events: auto;
    `;
    modal.innerHTML = `
        <div style="width:100%; height:100%; background:rgba(0,0,0,0.5); position:absolute;"></div>
        <div style="background:#fff; padding:24px; border-radius:12px; z-index:1000000; width:280px; text-align:center;">
            <div style="font-size:17px; color:#1a1a1a; margin-bottom:12px;">保存图片</div>
            <div style="font-size:14px; color:#666; margin-bottom:20px;">是否保存到本地？</div>
            <div style="display:flex; gap:12px;">
                <button onclick="downloadCurrentImg()" style="flex:1; padding:10px 0; background:#007aff; color:#fff; border:none; border-radius:8px; font-size:16px;">保存</button>
                <button onclick="closeSaveModal()" style="flex:1; padding:10px 0; background:#f5f5f7; color:#333; border:none; border-radius:8px; font-size:16px;">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 2. 关闭弹窗
window.closeSaveModal = function() {
    const modal = document.getElementById('img-save-modal');
    if (modal) modal.remove();
    isLongPressTriggered = false;
};

// 3. 下载当前图片
window.downloadCurrentImg = function() {
    if (!currentImgSrc) return;
    const a = document.createElement('a');
    a.href = currentImgSrc;
    a.download = `img_${Date.now()}.${currentImgSrc.split('.').pop()}`;
    a.click();
    closeSaveModal();
    // PakePlus原生提示
    if (window.__TAURI__?.dialog) {
        window.__TAURI__.dialog.message('图片已开始下载');
    }
};

// 4. 核心：监听图片的触摸事件（精准区分轻触/长按）
document.addEventListener('touchstart', function(e) {
    // 只处理图片，且单指触摸
    if (e.target.tagName === 'IMG' && e.touches.length === 1) {
        currentImgSrc = e.target.src;
        // 长按600ms触发弹窗（这个时长是移动端区分轻触/长按的黄金值）
        pressTimer = setTimeout(() => {
            isLongPressTriggered = true; // 标记：触发了长按
            showSaveModal(); // 弹出保存弹窗
            // 阻止长按后触发轻触的“点开图片”行为
            e.preventDefault();
        }, 600);
    }
}, { passive: false }); // 关键：passive: false，允许阻止默认行为

// 5. 触摸结束：区分轻触/长按
document.addEventListener('touchend', function(e) {
    clearTimeout(pressTimer); // 清除长按定时器
    // 如果是轻触（没触发长按），保留“点开图片”的原有行为
    if (!isLongPressTriggered && e.target.tagName === 'IMG') {
        return; // 不做任何拦截，让图片正常点开
    }
    // 如果是长按后松开，关闭弹窗（避免误触）
    if (isLongPressTriggered) {
        e.preventDefault(); // 阻止长按后松开触发点开图片
        isLongPressTriggered = false;
    }
}, { passive: false });

// 6. 触摸移动：取消长按
document.addEventListener('touchmove', function() {
    clearTimeout(pressTimer);
    isLongPressTriggered = false;
    closeSaveModal(); // 移动手指时关闭弹窗
}, { passive: true });

// 7. 禁用原生图片右键菜单（桌面端兼容）
document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        currentImgSrc = e.target.src;
        showSaveModal();
    }
}, { passive: false });

// 8. 桌面端右键图片弹弹窗
document.addEventListener('mousedown', function(e) {
    if (e.button === 2 && e.target.tagName === 'IMG') {
        currentImgSrc = e.target.src;
        showSaveModal();
    }
}, { passive: false });