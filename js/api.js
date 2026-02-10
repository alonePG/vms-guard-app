const API = {
    getUrl: () => CONFIG.API_URL,
    send: async (action, args = []) => {
        const url = API.getUrl();
        if (!url || url.includes("EXEC_URL_HERE")) {
            Swal.fire('Config Error', 'กรุณาระบุ API URL ในไฟล์ config.js', 'error');
            throw new Error("No URL configured");
        }
        try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, args }) });
            const text = await res.text();
            let json; try { json = JSON.parse(text); } catch(e) { console.error("Bad JSON", text); return null; }
            if (!json || !json.ok) { API.handleError(json ? json.error : null); return null; }
            return json.data;
        } catch (err) { console.error(err); Swal.fire('Error', 'เชื่อมต่อ Server ไม่ได้', 'error'); return null; }
    },
    handleError: (err) => {
        if (!err) err = { code: "UNKNOWN", message: "Server error" };
        let title = "เกิดข้อผิดพลาด", text = `${err.code}: ${err.message}`, icon = "error";
        if (err.code === 'DUPLICATE_IN') { title = "รถเข้ามาแล้ว"; text = "ต้องทำการ Check-out ก่อน"; icon = "warning"; }
        if (err.code === 'BLACKLISTED') { title = "⛔ ห้ามเข้า"; text = `Blacklist: ${err.details?.blacklist?.note}`; icon = "error"; }
        Swal.fire(title, text, icon);
    }
};