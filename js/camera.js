/**
 * js/camera.js
 * จัดการเรื่องกล้องและการย่อรูป (Fixed Version)
 */
const Camera = {
    trigger: (type) => {
        const input = document.getElementById(`file-${type}`);
        if (input) {
            input.value = ''; // ✅ เคลียร์ค่าเก่าเพื่อให้กดถ่ายซ้ำได้เสมอ
            input.click();
        }
    },
    handleFile: (input, type, isWatermark = false) => {
        const file = input.files[0];
        if (!file) return;
        
        // แสดงสถานะ Loading (ถ้ามี)
        const prev = document.getElementById(`preview-${type}`);
        if(prev) prev.style.opacity = 0.5;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Config ค่า Default ถ้ายังโหลดไม่เสร็จ
                const MAX_W = (typeof CONFIG !== 'undefined' && CONFIG.IMAGE) ? CONFIG.IMAGE.MAX_WIDTH : 800;
                const QUALITY = (typeof CONFIG !== 'undefined' && CONFIG.IMAGE) ? CONFIG.IMAGE.QUALITY : 0.7;

                let w = img.width, h = img.height;
                if(w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
                
                canvas.width = w; canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                
                if(isWatermark && typeof CONFIG !== 'undefined') {
                    ctx.save(); ctx.globalAlpha = 0.6; ctx.font = "bold 24px Sarabun, sans-serif"; ctx.fillStyle = "red";
                    ctx.translate(w/2, h/2); ctx.rotate(-Math.PI/4); 
                    ctx.fillText(CONFIG.PDPA_TEXT || "PDPA", 0, 0); 
                    ctx.restore();
                }
                
                const base64 = canvas.toDataURL('image/jpeg', QUALITY);
                
                // แสดงผล
                if(prev) {
                    prev.src = base64; 
                    prev.classList.remove('hidden-view');
                    prev.style.opacity = 1;
                    if(prev.parentElement) {
                        prev.parentElement.classList.remove('opacity-50');
                        // ซ่อน Placeholder
                        const ph = prev.parentElement.querySelector('.placeholder');
                        if(ph) ph.classList.add('hidden-view');
                    }
                }
                
                // เก็บข้อมูลลงตัวแปรหลัก
                if (window.app && window.app.data) {
                     window.app.data[type] = base64.split(',')[1];
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};