const Camera = {
    trigger: (type) => {
        const input = document.getElementById(`file-${type}`);
        if (input) {
            input.value = ''; // ✅ เพิ่มบรรทัดนี้: เคลียร์ค่าเก่าเพื่อให้กดถ่ายซ้ำได้
            input.click();
        }
    },
    handleFile: (input, type, isWatermark = false) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let w = img.width, h = img.height;
                const max = CONFIG.IMAGE.MAX_WIDTH;
                if(w > max) { h = Math.round(h * max / w); w = max; }
                canvas.width = w; canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                if(isWatermark) {
                    ctx.save(); ctx.globalAlpha = 0.6; ctx.font = "bold 24px Sarabun"; ctx.fillStyle = "red";
                    ctx.translate(w/2, h/2); ctx.rotate(-Math.PI/4); ctx.fillText(CONFIG.PDPA_TEXT, 0, 0); ctx.restore();
                }
                const base64 = canvas.toDataURL('image/jpeg', CONFIG.IMAGE.QUALITY);
                const prev = document.getElementById(`preview-${type}`);
                prev.src = base64; prev.classList.remove('hidden-view');
                if(prev.parentElement) prev.parentElement.classList.remove('opacity-50');
                
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