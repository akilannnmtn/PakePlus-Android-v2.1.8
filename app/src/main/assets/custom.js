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
document.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
        hookClick(e);
    }
}, { passive: true });

// 2. 禁用原生图片上下文菜单（避免和自定义弹窗冲突）
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
        e.preventDefault(); // 阻止原生长按菜单
    }
}, { capture: true });

// 3. 自定义长按弹窗核心逻辑
let touchTimer = null;
let currentImgUrl = ''; // 存储当前长按的图片链接

// 创建自定义弹窗（仅创建一次，复用）
const createImgDownloadModal = () => {
    // 避免重复创建
    if (document.getElementById('pake-img-modal')) return;

    // 弹窗样式（适配移动端/桌面端，可自定义）
    const modalStyle = `
        position: fixed;
        z-index: 999999; // 最高层级，避免被遮挡
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        width: 280px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        text-align: center;
        font-family: sans-serif;
    `;
    const btnBoxStyle = `
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
    `;
    const btnStyle = `
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
    `;
    const saveBtnStyle = `
        ${btnStyle}
        background: #007aff;
        color: #fff;
    `;
    const cancelBtnStyle = `
        ${btnStyle}
        background: #f5f5f5;
        color: #333;
    `;

    // 弹窗DOM结构
    const modal = document.createElement('div');
    modal.id = 'pake-img-modal';
    modal.style = modalStyle;
    modal.innerHTML = `
        <div style="font-size: 16px; color: #333; margin-bottom: 8px;">保存图片</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">是否将图片保存到本地？</div>
        <div style="${btnBoxStyle}">
            <button id="pake-save-img" style="${saveBtnStyle}">保存</button>
            <button id="pake-cancel-img" style="${cancelBtnStyle}">取消</button>
        </div>
    `;

    // 添加遮罩层
    const mask = document.createElement('div');
    mask.id = 'pake-img-mask';
    mask.style = `
        position: fixed;
        z-index: 999998;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
    `;

    // 插入到页面
    document.body.appendChild(mask);
    document.body.appendChild(modal);

    // 保存按钮点击事件
    document.getElementById('pake-save-img').addEventListener('click', () => {
        if (currentImgUrl) {
            // 触发图片下载
            const a = document.createElement('a');
            a.href = currentImgUrl;
            a.download = `pake_img_${Date.now()}.${currentImgUrl.split('.').pop()}`;
            a.click();
            
            // PakePlus原生提示（可选）
            if (window.__TAURI__?.dialog) {
                window.__TAURI__.dialog.message('图片已开始下载');
            }
        }
        // 关闭弹窗
        closeImgModal();
    });

    // 取消按钮点击事件
    document.getElementById('pake-cancel-img').addEventListener('click', closeImgModal);

    // 点击遮罩层关闭弹窗
    mask.addEventListener('click', closeImgModal);
};

// 关闭弹窗函数
const closeImgModal = () => {
    const modal = document.getElementById('pake-img-modal');
    const mask = document.getElementById('pake-img-mask');
    if (modal) modal.remove();
    if (mask) mask.remove();
    currentImgUrl = ''; // 清空图片链接
};

// 监听图片长按事件
document.addEventListener('touchstart', (e) => {
    const target = e.target;
    if (target.tagName === 'IMG' && e.touches.length === 1) {
        // 存储当前图片链接
        currentImgUrl = target.src;
        // 长按500ms弹出弹窗
        touchTimer = setTimeout(() => {
            createImgDownloadModal(); // 创建并显示弹窗
        }, 500);
    }
}, { passive: true });

// 触摸结束/离开取消长按
document.addEventListener('touchend', () => {
    if (touchTimer) clearTimeout(touchTimer);
}, { passive: true });
document.addEventListener('touchmove', () => {
    if (touchTimer) clearTimeout(touchTimer);
}, { passive: true });

// 桌面端兼容：右键图片也弹出自定义弹窗
document.addEventListener('mousedown', (e) => {
    if (e.button === 2 && e.target.tagName === 'IMG') { // 右键（2）点击图片
        e.preventDefault();
        currentImgUrl = e.target.src;
        createImgDownloadModal();
    }
}, { capture: true });