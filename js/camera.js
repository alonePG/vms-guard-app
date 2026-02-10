const Camera = {
    trigger: (type) => document.getElementById(`file-${type}`).click(),
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
                App.data[type] = base64;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};