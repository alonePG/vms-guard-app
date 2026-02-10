/**
 * js/app.js
 * Version: 2.2 (Production Ready - Text Print)
 */

const App = {
    data: { vehicle: null, id_card: null, vehicle_out: null, currentId: null },

    init: async () => {
        console.log("App Initializing v2.2...");

        if (typeof CONFIG === 'undefined') {
            Swal.fire('Error', 'ไม่พบไฟล์ js/config.js', 'error');
            return;
        }

        try {
            const serverConfig = await API.send('getConfig');
            if (serverConfig) {
                if (serverConfig.VISITOR_TYPES?.length) CONFIG.VISITOR_TYPES = serverConfig.VISITOR_TYPES;
                if (serverConfig.UNITS?.length) CONFIG.UNITS = serverConfig.UNITS;
            }
        } catch (e) {
            console.warn("Config sync failed", e);
        }

        App.setupDropdowns();
        App.navTo('dashboard');
    },

    getDirectUrl: (url) => {
        if (!url) return "";
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
        return url;
    },

    // ✅ ฟังก์ชันพิมพ์ใบเสร็จ (Text Mode) - ทำงานได้ทันทีบนแอปฟรี
    printToRawbt: (data) => {
        let text = "";

        // --- Header (หัวบิล) ---
        text += "[c][b]VMS GUARD[/b][/c]\n";
        text += "[c]VISITOR PASS[/c]\n";
        text += "[c]--------------------------------[/c]\n";
        text += "\n";

        // --- Body Info (ข้อมูลหลัก) ---
        // ใช้ [b] ตัวหนา เพื่อให้อ่านง่าย
        text += "[l]ติดต่อบ้านเลขที่:[/l]\n";
        text += "[c][b]" + data.target_unit + "[/b][/c]\n"; 
        text += "\n";
        
        text += "[l]ทะเบียนรถ:[/l]\n";
        text += "[c][b]" + data.license_plate + "[/b][/c]\n";
        text += "\n";

        // --- Details (รายละเอียด) ---
        text += "[l]ประเภท:   " + data.visitor_type + "[/l]\n";
        text += "[l]เวลาเข้า: " + new Date().toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) + "[/l]\n";
        text += "[l]Ticket ID: " + data.id + "[/l]\n";
        text += "\n";

        // --- Footer (ส่วนท้ายและลายเซ็น) ---
        text += "[c]--------------------------------[/c]\n";
        text += "\n";
        text += "[l]ลายเซ็นลูกบ้าน (Sign):[/l]\n";
        text += "\n\n\n"; // เว้นบรรทัดให้เซ็น
        text += "[c]................................[/c]\n";
        text += "\n";
        
        // --- Note ---
        text += "[c]*โปรดคืนบัตรเมื่อออก*[/c]\n";
        text += "[c]PDPA: เพื่อความปลอดภัย[/c]\n";
        text += "\n\n\n"; // Feed กระดาษให้ฉีกง่าย

        // ส่งคำสั่งไป Rawbt
        window.location.href = "rawbt:" + encodeURIComponent(text);
    },

    setupDropdowns: () => {
        const typeSelect = document.getElementById('in-type');
        if (typeSelect) {
            typeSelect.innerHTML = '';
            CONFIG.VISITOR_TYPES.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type.value;
                opt.innerText = type.label + (type.alert ? ` (${type.alert})` : '');
                typeSelect.appendChild(opt);
            });
        }

        const unitList = document.getElementById('units-list');
        if (unitList) {
            unitList.innerHTML = '';
            CONFIG.UNITS.forEach(unit => {
                const opt = document.createElement('option');
                opt.value = unit;
                unitList.appendChild(opt);
            });
        }
    },

    navTo: (viewId) => {
        document.querySelectorAll('main > div').forEach(el => el.classList.add('hidden-view'));
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.remove('hidden-view');
        
        if (viewId === 'dashboard') {
            App.resetForms();
            App.loadDashboardStatus(); 
        }
    },

    resetForms: () => {
        document.querySelectorAll('input').forEach(el => el.value = '');
        const typeSelect = document.getElementById('in-type');
        if (typeSelect) typeSelect.selectedIndex = 0;
        
        App.data = { vehicle: null, id_card: null, vehicle_out: null, currentId: null };
        
        document.querySelectorAll('[id^="preview-"]').forEach(el => {
            el.src = '';
            el.classList.add('hidden-view');
            if(el.parentElement) el.parentElement.classList.remove('opacity-50');
        });

        const resArea = document.getElementById('checkout-result-area');
        if(resArea) resArea.classList.add('hidden-view');
        
        const imgBox = document.getElementById('out-res-img-box');
        const imgEl = document.getElementById('out-res-img');
        if(imgBox) imgBox.classList.add('hidden-view');
        if(imgEl) imgEl.src = '';

        const searchList = document.getElementById('search-list');
        if(searchList) searchList.innerHTML = '<div class="text-center text-gray-400 py-10">พิมพ์ทะเบียนเพื่อค้นหา</div>';
    },

    loadDashboardStatus: async () => {
        const listEl = document.getElementById('dashboard-live-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="text-center text-gray-400 py-4 text-xs">กำลังอัปเดต...</div>';

        try {
            const result = await API.send('searchLogs', [{ status: 'IN' }]);

            if (result && result.items && result.items.length > 0) {
                listEl.innerHTML = ''; 
                result.items.forEach(item => {
                    const timeIn = new Date(item.timestamp_in);
                    const now = new Date();
                    const diffHrs = (now - timeIn) / 3600000;
                    const diffMins = Math.floor(((now - timeIn) % 3600000) / 60000);

                    const typeConfig = CONFIG.VISITOR_TYPES.find(t => t.value === item.visitor_type);
                    const maxHours = typeConfig ? (typeConfig.max_hours || 0) : 0;
                    const isOverstay = maxHours > 0 && diffHrs > maxHours;

                    const card = document.createElement('div');
                    card.className = `p-3 rounded-lg border flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all ${isOverstay ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`;
                    
                    card.onclick = () => {
                        App.navTo('checkout');
                        setTimeout(() => {
                            const input = document.getElementById('out-plate');
                            if(input) { input.value = item.license_plate; App.searchForCheckout(); }
                        }, 100);
                    };

                    card.innerHTML = `
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-lg ${isOverstay ? 'text-red-700' : 'text-gray-800'}">${item.license_plate}</span>
                                ${isOverstay ? '<span class="bg-red-500 text-white text-[10px] px-1 rounded animate-pulse">เกินเวลา</span>' : ''}
                            </div>
                            <div class="text-xs text-gray-500 flex gap-2"><span>🏠 ${item.target_unit}</span><span>👤 ${item.visitor_type}</span></div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-mono text-gray-400">${timeIn.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}</div>
                            <div class="text-sm font-bold ${isOverstay ? 'text-red-600' : 'text-green-600'}">${Math.floor(diffHrs)}h ${diffMins}m</div>
                        </div>`;
                    listEl.appendChild(card);
                });
            } else {
                listEl.innerHTML = `<div class="flex flex-col items-center justify-center py-8 text-gray-300"><span class="text-xs">ไม่มีรถในโครงการ</span></div>`;
            }
        } catch (err) {
            console.error(err);
            listEl.innerHTML = '<div class="text-center text-red-400 py-4 text-xs">โหลดล้มเหลว</div>';
        }
    },

    submitCheckIn: async () => {
        const plate = document.getElementById('in-plate').value.trim().toUpperCase().replace(/\s+/g, '');
        const unit = document.getElementById('in-unit').value.trim();
        const type = document.getElementById('in-type').value;
        const note = document.getElementById('in-note').value.trim();

        if (!plate || !unit) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกทะเบียนและบ้านเลขที่', 'warning');
        if (!App.data.vehicle) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณาถ่ายรูปรถ', 'warning');
        if (!App.data.id_card) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณาถ่ายรูปบัตร (PDPA)', 'warning');

        Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const res = await API.send('createCheckin', [{
            license_plate: plate, 
            visitor_type: type, 
            target_unit: unit, 
            note: note,
            images: { vehicle: App.data.vehicle, id_card: App.data.id_card, id_card_is_watermarked: true }
        }]);

        if (res) {
            // ✅ สั่งพิมพ์ทันที (ไม่ต้องมีปุ่ม Test)
            App.printToRawbt({
                id: res.id,
                target_unit: unit,
                license_plate: plate,
                visitor_type: type
            });

            Swal.fire({
                title: '✅ บันทึก & กำลังพิมพ์',
                html: `Ticket: <b>${res.id}</b><br>ทะเบียน: ${res.license_plate}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => App.navTo('dashboard'));
        }
    },

    searchForCheckout: async () => {
        const plate = document.getElementById('out-plate').value.trim().replace(/\s+/g, '');
        if (!plate) return Swal.fire('ระบุทะเบียน', '', 'info');

        Swal.fire({ title: 'กำลังค้นหา...', didOpen: () => Swal.showLoading() });
        const res = await API.send('searchLogs', [{ license_plate: plate, status: 'IN' }]);
        Swal.close();

        const resArea = document.getElementById('checkout-result-area');
        
        if (res && res.items.length > 0) {
            const item = res.items[0];
            App.data.currentId = item.id;
            
            const diffHrs = (new Date() - new Date(item.timestamp_in)) / 3600000;
            const typeConfig = CONFIG.VISITOR_TYPES.find(t => t.value === item.visitor_type);
            const maxHours = typeConfig ? (typeConfig.max_hours || 0) : 0;
            
            let alertHtml = "";
            if (maxHours > 0 && diffHrs > maxHours) {
                alertHtml = `<div class="bg-red-100 text-red-700 p-2 mt-2 text-sm rounded">🚨 <b>เกินเวลา!</b></div>`;
            }
            
            document.getElementById('out-res-plate').innerText = item.license_plate;
            document.getElementById('out-res-info').innerHTML = 
                `${item.visitor_type} -> ${item.target_unit}<br>
                 <span class="text-xs text-gray-500">เข้า: ${new Date(item.timestamp_in).toLocaleTimeString('th-TH')}</span>
                 ${alertHtml}`;
            
            document.getElementById('out-res-id').value = item.id;

            const imgBox = document.getElementById('out-res-img-box');
            const imgEl = document.getElementById('out-res-img');
            
            if (item.image_url_in) {
                imgEl.src = App.getDirectUrl(item.image_url_in);
                imgBox.classList.remove('hidden-view');
            } else {
                imgBox.classList.add('hidden-view');
                imgEl.src = '';
            }

            resArea.classList.remove('hidden-view');
        } else {
            Swal.fire('ไม่พบข้อมูล', 'รถอาจจะออกไปแล้ว หรือพิมพ์ผิด', 'question');
            resArea.classList.add('hidden-view');
        }
    },

    submitCheckOut: async () => {
        const id = document.getElementById('out-res-id').value;
        if (!id) return;

        Swal.fire({ title: 'กำลังบันทึกออก...', didOpen: () => Swal.showLoading() });
        const res = await API.send('checkout', [{ id: id }, "MANUAL", { vehicle_out: App.data.vehicle_out || null }, "GUARD"]);
        
        if (res) {
            Swal.fire({
                title: '✅ รถออกสำเร็จ', 
                text: `ทะเบียน: ${res.license_plate}`, 
                icon: 'success'
            }).then(() => App.navTo('dashboard'));
        }
    },

    doSearch: async () => {
        const q = document.getElementById('search-query').value.trim();
        Swal.fire({ didOpen: () => Swal.showLoading() });
        const res = await API.send('searchLogs', [{ license_plate: q }]);
        Swal.close();
        
        const list = document.getElementById('search-list');
        list.innerHTML = '';
        
        if (res && res.items.length > 0) {
            res.items.forEach(item => {
                const isIN = item.status === 'IN';
                list.innerHTML += `
                    <div class="border rounded-lg p-3 mb-2 flex justify-between items-center ${isIN ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div>
                            <div class="font-bold text-lg text-gray-800">${item.license_plate}</div>
                            <div class="text-sm text-gray-600">${item.visitor_type} → ${item.target_unit}</div>
                        </div>
                        <div class="font-bold ${isIN?'text-green-600':'text-gray-500'}">${item.status}</div>
                    </div>
                `;
            });
        } else { 
            list.innerHTML = '<div class="text-center text-gray-400 py-10">ไม่พบข้อมูล</div>'; 
        }
    }
};

window.app = App;
window.addEventListener('DOMContentLoaded', () => { setTimeout(App.init, 100); });