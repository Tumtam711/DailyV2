// ========== MANAGEMENT PAGE JAVASCRIPT ==========

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function () {
    renderFooter();
    initializeManagePage();
});

function renderFooter() {
    const f = document.getElementById("footerArea");
    if (!f) return;

    const _y = [169, 32, 50, 48, 50, 53];
    const _v = [118, 50, 46, 48];
    const _n = [84, 84, 55, 49];

    const LINK = "https://line.me/ti/p/5OUKiBw3Ti";

    const year = String.fromCharCode(..._y);
    const ver = String.fromCharCode(..._v);
    const name = String.fromCharCode(..._n);


    const hashNow = btoa(LINK).slice(3, 11);


    const expected = hashNow;


    window.__CRED = (hashNow === expected);

    f.innerHTML = `
        <div class="credit">
            ${year} ${ver}
            <a href="${LINK}" data-hash="${hashNow}" target="_blank"><u>${name}</u></a>
        </div>
    `;
}



function initializeManagePage() {
    console.log('🔄 กำลังเตรียมหน้าจัดการสาขา...');
    loadBranchesList();
    setupManageEventListeners();
    updateUIState();
}

// ========== UI RENDERING ==========
function loadBranchesList() {
    const branchesList = document.getElementById('branchesList');
    const noBranchesMessage = document.getElementById('noBranchesMessage');

    if (!branchesList || !noBranchesMessage) {
        console.error('❌ ไม่พบ element branches list หรือ no branches message');
        return;
    }

    // 1. เรียงลำดับรายการสาขาตามค่า 'order' ล่าสุดก่อนเรนเดอร์
    // หาก userBranches มี property 'order' อยู่แล้ว 
    userBranches.sort((a, b) => a.order - b.order); 

    branchesList.innerHTML = '';

    if (userBranches.length === 0) {
        noBranchesMessage.classList.remove('hidden');
        console.log('📭 ไม่มีสาขาในระบบ');
        return;
    }

    noBranchesMessage.classList.add('hidden');

    userBranches.forEach((branch, index) => {
        const branchItem = createBranchItem(branch, index);
        
        // ⭐️ 2. เพิ่มการตั้งค่า Event Listener สำหรับการลากและวาง
        // ต้องมั่นใจว่าฟังก์ชัน setupBranchItemDragEvents ได้ถูกสร้างไว้แล้ว
        setupBranchItemDragEvents(branchItem); 
        
        branchesList.appendChild(branchItem);
    });

    console.log(`✅ เรนเดอร์รายการสาขา ${userBranches.length} สาขาเรียบร้อย`);
}
function createBranchItem(branch, index) {
    const branchItem = document.createElement('div');
    branchItem.className = 'branch-item';
    branchItem.dataset.branchId = branch.id;


    branchItem.setAttribute('draggable', 'true');
    branchItem.dataset.initialIndex = index;

    branchItem.innerHTML = `
        <div class="branch-info">
            <div class="branch-name">${index + 1}. ${branch.name}</div>
            <span class="branch-region">${branch.region}</span>
        </div>
        <div class="branch-actions">
            <button class="edit-btn" onclick="editBranch(${branch.id})">
                ✏️ แก้ไข
            </button>
            <button class="delete-btn" onclick="confirmDeleteBranch(${branch.id})">
                🗑️ ลบ
            </button>
        </div>
    `;

    return branchItem;
}

// ในส่วนของ UI RENDERING หรือ BRANCH MANAGEMENT 

// ========== DRAG AND DROP LOGIC (เพิ่มใหม่) ==========

function setupBranchItemDragEvents(branchItem) {
    branchItem.addEventListener('dragstart', handleDragStart);
    branchItem.addEventListener('dragover', handleDragOver);
    branchItem.addEventListener('dragleave', handleDragLeave);
    branchItem.addEventListener('drop', handleDrop);
    branchItem.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    // ⭐️ เก็บ ID ของสาขาที่ถูกลาก
    e.dataTransfer.setData('text/plain', e.target.dataset.branchId);
    e.target.classList.add('dragging'); // เพิ่ม class เพื่อทำไฮไลต์
}

function handleDragOver(e) {
    e.preventDefault(); // ⭐️ สำคัญมาก! เพื่อให้ drop ทำงานได้
    const draggedElement = document.querySelector('.dragging');
    const targetElement = e.currentTarget;

    if (draggedElement && draggedElement !== targetElement) {
        // หาตำแหน่งที่ควรวาง
        const rect = targetElement.getBoundingClientRect();
        const next = (e.clientY - rect.top) / targetElement.offsetHeight > 0.5;

        // ลบ highlight เก่าออก
        document.querySelectorAll('.branch-item').forEach(item => {
            item.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        // เพิ่ม highlight ใหม่ เพื่อแสดงตำแหน่งที่จะวาง
        if (next) {
            targetElement.classList.add('drag-over-bottom');
        } else {
            targetElement.classList.add('drag-over-top');
        }
    }
}

function handleDragLeave(e) {
    // ลบ highlight เมื่อเมาส์ออก
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');

    const draggedId = e.dataTransfer.getData('text/plain');
    const targetId = e.currentTarget.dataset.branchId;

    if (draggedId !== targetId) {
        // ⭐️ เรียกใช้ฟังก์ชันสลับตำแหน่ง
        swapBranchOrder(Number(draggedId), Number(targetId), e.currentTarget.classList.contains('drag-over-bottom'));
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging'); // ลบ class dragging ออก
    // ลบ highlight ที่อาจค้างอยู่
    document.querySelectorAll('.branch-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

function swapBranchOrder(draggedId, targetId, insertAfter) {
    // 1. หา Index ของสาขาที่เกี่ยวข้อง
    const draggedIndex = userBranches.findIndex(b => b.id === draggedId);
    const targetIndex = userBranches.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 2. ดึงสาขาที่ถูกลากออก
    const [draggedBranch] = userBranches.splice(draggedIndex, 1);

    // 3. คำนวณ Index ใหม่ที่จะใส่สาขาเข้าไป
    let newIndex = targetIndex;
    if (insertAfter) {
        newIndex = targetIndex + 1;
    }
    
    // ปรับ Index ในกรณีที่ดึงออกจากด้านหน้า
    if (!insertAfter && draggedIndex < targetIndex) {
         newIndex -= 1;
    }

    // 4. ใส่สาขาที่ถูกลากเข้าไปในตำแหน่งใหม่
    userBranches.splice(newIndex, 0, draggedBranch);

    // 5. อัพเดทลำดับ (order) ใหม่ และบันทึก
    updateBranchOrderAndSave();
}

function updateBranchOrderAndSave() {
    // อัพเดท property 'order' ใน object ตาม index ใหม่
    userBranches.forEach((branch, index) => {
        branch.order = index + 1;
    });

    if (saveAllData()) {
        loadBranchesList(); // ⭐️ เรนเดอร์ UI ใหม่
        // showDialog('✅ สลับตำแหน่งสาขาสำเร็จ!', 'info'); // จะแสดงหรือไม่ก็ได้
    } else {
        showDialog('❌ ไม่สามารถบันทึกการสลับตำแหน่งได้', 'error');
    }
}

function updateUIState() {
    const exportBtn = document.getElementById('exportBranchesBtn');
    const resetBtn = document.getElementById('resetSystemBtn');

    if (exportBtn) {
        exportBtn.disabled = userBranches.length === 0;
    }

    if (resetBtn) {
        resetBtn.disabled = userBranches.length === 0;
    }
}

// ========== BRANCH MANAGEMENT ==========
function addNewBranch() {
    if (!window.__CRED) {
        showDialog(
            `⚠️ ระบบตรวจพบการแก้ไข
            <br>นี่ไม่ใช่ไฟล์ต้นฉบับ
            <br><br><a href="https://line.me/ti/p/5OUKiBw3Ti" target="_blank">
            ติดต่อผู้พัฒนา</a>`,
            "error"
        );
        return;
    }
    const nameInput = document.getElementById('newBranchName');
    const regionSelect = document.getElementById('newBranchRegion');

    if (!nameInput || !regionSelect) {
        console.error('❌ ไม่พบ element ฟอร์มเพิ่มสาขา');
        return;
    }

    const name = nameInput.value.trim();
    const region = regionSelect.value;

    // ตรวจสอบข้อมูล
    const validation = validateBranchName(name);

    if (!validation.isValid) {
        showDialog(validation.message, 'warning');
        nameInput.focus();
        return;
    }

    // ตรวจสอบชื่อซ้ำ
    if (validation.isDuplicate()) {
        showDialog('⚠️ มีสาขานี้ในระบบแล้ว', 'warning');
        nameInput.focus();
        nameInput.select();
        return;
    }

    // สร้างสาขาใหม่
    const newBranch = {
        id: Date.now() + Math.random(), // ID แบบ unique
        name: validation.trimmedName,
        region: region,
        order: userBranches.length + 1,
        createdAt: new Date().toISOString()
    };

    userBranches.push(newBranch);

    // บันทึกข้อมูล
    if (saveAllData()) {
        // รีเซ็ตฟอร์ม
        nameInput.value = '';
        regionSelect.value = 'เหนือ';

        // อัพเดท UI
        loadBranchesList();
        updateUIState();

        showDialog(`เพิ่มสาขา "${newBranch.name}" สำเร็จ`, 'success');

        // Focus กลับไปที่ช่องกรอกชื่อ
        nameInput.focus();
    } else {
        showDialog('❌ ไม่สามารถเพิ่มสาขาได้', 'error');
    }
}

function editBranch(branchId) {
    const branch = userBranches.find(b => b.id === branchId);

    if (!branch) {
        showDialog('❌ ไม่พบสาขาที่ต้องการแก้ไข', 'error');
        return;
    }

    showDialog(
        `✏️ แก้ไขสาขา "${branch.name}"`,
        'edit',
        (newName, newRegion) => {
            handleEditBranch(branchId, newName, newRegion);
        },
        'บันทึก',
        {
            currentName: branch.name,
            currentRegion: branch.region
        }
    );
}

function handleEditBranch(branchId, newName, newRegion) {
    const branch = userBranches.find(b => b.id === branchId);

    if (!branch) {
        showDialog('❌ ไม่พบสาขาที่ต้องการแก้ไข', 'error');
        return;
    }

    const validation = validateBranchName(newName);

    if (!validation.isValid) {
        showDialog(validation.message, 'warning');
        return;
    }

    // ตรวจสอบชื่อซ้ำ (ไม่นับตัวเอง)
    if (validation.isDuplicate(branchId)) {
        showDialog('⚠️ มีสาขานี้ในระบบแล้ว', 'warning');
        return;
    }

    // อัพเดทข้อมูล
    branch.name = validation.trimmedName;
    branch.region = newRegion;
    branch.updatedAt = new Date().toISOString();

    // บันทึกข้อมูล
    if (saveAllData()) {
        // อัพเดท UI
        loadBranchesList();

        showDialog(`✅ แก้ไขสาขา "${branch.name}" สำเร็จ`, 'success');
    } else {
        showDialog('❌ ไม่สามารถแก้ไขสาขาได้', 'error');
    }
}

function confirmDeleteBranch(branchId) {
    const branch = userBranches.find(b => b.id === branchId);

    if (!branch) {
        showDialog('❌ ไม่พบสาขาที่ต้องการลบ', 'error');
        return;
    }

    // ตรวจสอบว่ามีข้อมูลยอดขายหรือไม่
    const hasSalesData = userSalesData[branchId] &&
        userSalesData[branchId].sales &&
        Number(userSalesData[branchId].sales) > 0;

    let message = `⚠️ ยืนยันการลบสาขา "${branch.name}"?`;

    if (hasSalesData) {
        message += `<br><br><small>• สาขานี้มีข้อมูลยอดขาย<br>• ข้อมูลยอดขายจะถูกลบไปด้วย</small>`;
    }

    showDialog(
        message,
        'confirm',
        () => {
            deleteBranch(branchId);
        },
        'ลบสาขา'
    );
}

function deleteBranch(branchId) {
    const branchIndex = userBranches.findIndex(b => b.id === branchId);

    if (branchIndex === -1) {
        showDialog('❌ ไม่พบสาขาที่ต้องการลบ', 'error');
        return;
    }

    const branchName = userBranches[branchIndex].name;

    // ลบสาขา
    userBranches.splice(branchIndex, 1);

    // ลบข้อมูลยอดขาย
    delete userSalesData[branchId];

    // อัพเดทลำดับ
    userBranches.forEach((branch, index) => {
        branch.order = index + 1;
    });

    // บันทึกข้อมูล
    if (saveAllData()) {
        // อัพเดท UI
        loadBranchesList();
        updateUIState();

        showDialog(`✅ ลบสาขา "${branchName}" สำเร็จ`, 'success');
    } else {
        showDialog('❌ ไม่สามารถลบสาขาได้', 'error');
    }
}

// ========== SYSTEM MANAGEMENT ==========
function handleExportBranches() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ไม่มีข้อมูลสาขาให้ Export', 'warning');
        return;
    }

    exportBranches();
}

function handleImportBranches() {
    const fileInput = document.getElementById('importFileInput');

    if (!fileInput) {
        console.error('❌ ไม่พบ file input');
        return;
    }

    fileInput.click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.name.endsWith('.json')) {
        showDialog('❌ กรุณาเลือกไฟล์ JSON เท่านั้น', 'error');
        return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 1MB)
    if (file.size > 1024 * 1024) {
        showDialog('❌ ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 1MB)', 'error');
        return;
    }

    importBranches(file);

    // รีเซ็ต input
    event.target.value = '';
}

function handleResetSystem() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ไม่มีข้อมูลในระบบ', 'warning');
        return;
    }

    resetSystem();
}

//แจ้งเตือนtaost

function showToast(message, type = 'success') {
    // สร้าง Toast Container ถ้ายังไม่มี
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style = "position:fixed; top:20px; right:20px; z-index:10000;";
        document.body.appendChild(container);
    }

    // สร้างตัว Toast
    const toast = document.createElement('div');
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };

    toast.style = `
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: sans-serif;
        font-weight: bold;
        min-width: 200px;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    toast.innerText = message;

    container.appendChild(toast);

    // Slide in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Slide out and Remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
//cloud backup function

const SP_URL = 'https://yiegmtvjpmbreqjqhnsr.supabase.co';
const SP_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWdtdHZqcG1icmVxanFobnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzk0MzQsImV4cCI6MjA4MzcxNTQzNH0.tNXhf--Jk7TPuvKalauoC1Phmz0_x_K1vCKhlbEpjGU';
const sp = supabase.createClient(SP_URL, SP_KEY);

function createCloudModal(title, contentHtml) {
    const modalHtml = `
        <div id="cloudModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; font-family:sans-serif;">
            <div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="margin-top:0; color:#333; border-bottom:2px solid #eee; padding-bottom:10px;">${title}</h3>
                <div style="margin:20px 0;">${contentHtml}</div>
                <div style="text-align:right;">
                    <button onclick="document.getElementById('cloudModal').remove()" style="padding:8px 15px; border:none; background:#eee; border-radius:5px; cursor:pointer;">ยกเลิก</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== BACKUP LOGIC ==========
async function cloudBackup() {
    const content = `
        <p style="font-size:14px; color:#666;">ใส่รหัสผ่านแอดมินเพื่อสำรองข้อมูลขึ้น Cloud</p>
        <input type="password" id="cloudPass" placeholder="รหัสลับ..." style="width:100%; padding:10px; box-sizing:border-box; border:1px solid #ddd; border-radius:5px; margin-bottom:15px;">
        <button id="confirmBackup" style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">🚀 เริ่มสำรองข้อมูล</button>
    `;
    createCloudModal('☁️ Cloud Backup', content);

    document.getElementById('confirmBackup').onclick = async () => {
        const pass = document.getElementById('cloudPass').value;
        const btn = document.getElementById('confirmBackup');
        
        btn.disabled = true;
        btn.innerText = '⌛ กำลังเช็ครหัส...';

        const { data: isOk } = await sp.rpc('verify_admin_key', { input_key: pass });
        if (!isOk) {
            showToast('❌ รหัสผ่านไม่ถูกต้อง!', 'error');
            btn.disabled = false;
            btn.innerText = '🚀 เริ่มสำรองข้อมูล';
            return;
        }

        try {
            // 🚨 ลอก Logic จาก exportBranches มาเป๊ะๆ
            const exportData = {
                version: "2.0",
                exportDate: new Date().toISOString(),
                exportType: "branches",
                branches: userBranches,
                settings: {
                    regions: ["เหนือ", "อีสานบน", "อีสานล่าง", "กลาง", "ตะวันออก", "ตะวันตก", "ใต้"]
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });

            // ระบบ 2 ไฟล์วนลูป
            const { data: files } = await sp.storage.from('branch-backups').list('', {
                sortBy: { column: 'created_at', order: 'asc' }
            });

            if (files && files.length >= 2) {
                const filesToDelete = files.slice(0, files.length - 1).map(f => f.name);
                await sp.storage.from('branch-backups').remove(filesToDelete);
            }

            const fileName = `backup_${Date.now()}.json`;
            await sp.storage.from('branch-backups').upload(fileName, blob);

            document.getElementById('cloudModal').remove();
            showToast('✅ สำรองขึ้น Cloud เรียบร้อย😉');
        } catch (err) {
            showToast('❌ พัง!: ' + err.message, 'error');
            btn.disabled = false;
        }
    };
}

// ========== RESTORE LOGIC ==========
async function cloudRestore() {
    createCloudModal('📂 กู้คืนจาก Cloud', '<p id="loadingMsg">⌛ กำลังดึงข้อมูล...</p><div id="fileContainer"></div>');
    
    try {
        const { data: files, error } = await sp.storage.from('branch-backups').list('', {
            sortBy: { column: 'created_at', order: 'desc' }
        });

        const container = document.getElementById('fileContainer');
        if (document.getElementById('loadingMsg')) document.getElementById('loadingMsg').remove();

        if (error || !files || files.length === 0) {
            container.innerHTML = '<p style="color:red; text-align:center;">ไม่พบไฟล์สำรอง</p>';
            return;
        }

        files.forEach((f, i) => {
            const date = new Date(f.created_at).toLocaleString('th-TH', { 
                day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' 
            });

            //Badge ไฟล์ล่าสุด
            const badge = (i === 0) ? ' <span style="background:#4CAF50; color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">ล่าสุด</span>' : '';
            
            const btn = document.createElement('button');
            btn.innerHTML = `<div><b>ไฟล์ที่ ${i + 1}${badge}</b></div><div style="font-size:12px; color:#666;">สำรองเมื่อ: ${date}</div>`;
            btn.style = "width:100%; padding:12px; margin-bottom:10px; border:1px solid #4CAF50; border-radius:8px; background:white; color:#2E7D32; cursor:pointer; text-align:left;";
            
            btn.onclick = () => {
                document.getElementById('cloudModal').remove();
                askConfirmRestore(f.name, date); // เรียกตัวยืนยันที่เราทำไว้
            };
            container.appendChild(btn);
        });
    } catch (err) {
        showToast('❌ ผิดพลาด: ' + err.message, 'error');
    }
}

// ========== CUSTOM CONFIRM MODAL ==========
function askConfirmRestore(fileName, dateLabel) {
    const content = `
        <div style="text-align:center;">
            <p style="color:#f44336; font-weight:bold; font-size:18px;">⚠️ ยืนยันการกู้คืน?</p>
            <p style="font-size:14px; color:#666;">ข้อมูลปัจจุบันจะถูกเขียนทับด้วยข้อมูลจากวันที่:<br><b>${dateLabel}</b></p>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button id="cancelRestore" style="flex:1; padding:10px; border:none; background:#eee; border-radius:5px; cursor:pointer;">ไม่กู้คืน</button>
                <button id="confirmRestoreFinal" style="flex:1; padding:10px; border:none; background:#f44336; color:white; border-radius:5px; font-weight:bold; cursor:pointer;">ใช่, กู้คืนเลย</button>
            </div>
        </div>
    `;
    createCloudModal('🚨 ยืนยันการเขียนทับ', content);

    document.getElementById('cancelRestore').onclick = () => {
        document.getElementById('cloudModal').remove();
        cloudRestore(); // กลับไปหน้าเลือกไฟล์ใหม่
    };

    document.getElementById('confirmRestoreFinal').onclick = () => {
        const btn = document.getElementById('confirmRestoreFinal');
        btn.disabled = true;
        btn.innerText = '⌛ กำลังกู้คืน...';
        executeCloudRestore(fileName);
    };
}

async function executeCloudRestore(fileName) {
    try {
        const { data } = await sp.storage.from('branch-backups').download(fileName);
        const text = await data.text();
        const importedData = JSON.parse(text);

        // 🚨 ลอก Logic การตรวจสอบจาก importBranches
        if (!importedData.branches || !Array.isArray(importedData.branches)) {
            throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
        }

        // ทำการ Import ตาม Logic เดิมของมึงเป๊ะ
        userBranches = importedData.branches.map((branch, index) => ({
            ...branch,
            id: branch.id || Date.now() + index,
            order: index + 1
        }));

        // รีเซ็ตยอดขายตาม Shared JS มึงเลย
        userSalesData = {};

        if (saveAllData()) {
            document.getElementById('cloudModal').remove();
            showToast(`✅ Import สำเร็จ! นำเข้า ${userBranches.length} สาขา`, 'success');
            
            // โหลดใหม่ตาม shared.js
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        console.error("❌ Cloud Restore error:", error);
        showToast('❌ ไฟล์ไม่ถูกต้องหรือเสียหาย', 'error');
    }
}
// ========== EVENT HANDLERS ==========
function setupManageEventListeners() {
    console.log('🔧 กำลังตั้งค่า event listeners...');

    // ปุ่มเพิ่มสาขา
    const addBtn = document.getElementById('addBranchBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewBranch);
    }

    // Enter ในช่องกรอกชื่อสาขา
    const nameInput = document.getElementById('newBranchName');
    if (nameInput) {
        nameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                addNewBranch();
            }
        });

        // Input validation real-time
        nameInput.addEventListener('input', function () {
            validateNameInputRealTime(this);
        });
    }

    // ปุ่มจัดการระบบ
    const exportBtn = document.getElementById('exportBranchesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', cloudBackup);
    }

    const importBtn = document.getElementById('importBranchesBtn');
    if (importBtn) {
        importBtn.addEventListener('click', cloudRestore);
    }

    const resetBtn = document.getElementById('resetSystemBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetSystem);
    }

    // File input
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleManageKeyboardShortcuts);

    console.log('✅ ตั้งค่า event listeners เรียบร้อย');
}

function validateNameInputRealTime(input) {
    const value = input.value.trim();

    if (value.length > 50) {
        input.value = value.substring(0, 50);
        showInputLengthWarning();
    }
}

function showInputLengthWarning() {
    // แสดงการเตือนแบบ subtle
    const inputGroup = document.querySelector('.input-group');
    if (inputGroup) {
        const existingWarning = inputGroup.querySelector('.length-warning');
        if (!existingWarning) {
            const warning = document.createElement('div');
            warning.className = 'length-warning error-message';
            warning.textContent = '⚠️ จำกัด 50 ตัวอักษร';
            warning.style.animation = 'fadeIn 0.3s ease';
            inputGroup.appendChild(warning);

            setTimeout(() => {
                if (warning.parentNode) {
                    warning.remove();
                }
            }, 3000);
        }
    }
}

function handleManageKeyboardShortcuts(e) {
    // Ctrl + N หรือ Cmd + N: เพิ่มสาขาใหม่
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const nameInput = document.getElementById('newBranchName');
        if (nameInput) {
            nameInput.focus();
        }
    }

    // Escape: ยกเลิกการกระทำ
    if (e.key === 'Escape') {
        const nameInput = document.getElementById('newBranchName');
        if (nameInput && document.activeElement === nameInput) {
            nameInput.value = '';
        }
    }
}

// ========== BULK OPERATIONS ==========
function deleteMultipleBranches(branchIds) {
    if (!branchIds || branchIds.length === 0) {
        return;
    }

    const branchNames = branchIds.map(id => {
        const branch = userBranches.find(b => b.id === id);
        return branch ? branch.name : 'Unknown';
    });

    showDialog(
        `⚠️ ยืนยันการลบ ${branchIds.length} สาขา?<br><br>
        <small>${branchNames.join('<br>')}</small>`,
        'confirm',
        () => {
            performBulkDelete(branchIds);
        },
        `ลบ ${branchIds.length} สาขา`
    );
}

function performBulkDelete(branchIds) {
    let successCount = 0;

    branchIds.forEach(branchId => {
        const branchIndex = userBranches.findIndex(b => b.id === branchId);
        if (branchIndex !== -1) {
            userBranches.splice(branchIndex, 1);
            delete userSalesData[branchId];
            successCount++;
        }
    });

    // อัพเดทลำดับ
    userBranches.forEach((branch, index) => {
        branch.order = index + 1;
    });

    if (saveAllData()) {
        loadBranchesList();
        updateUIState();

        showDialog(`✅ ลบ ${successCount} สาขาสำเร็จ`, 'success');
    } else {
        showDialog('❌ เกิดข้อผิดพลาดในการลบสาขา', 'error');
    }
}

// ========== DATA VALIDATION ==========
function validateBranchesData() {
    const errors = [];

    userBranches.forEach((branch, index) => {
        // ตรวจสอบชื่อสาขา
        const nameValidation = validateBranchName(branch.name);
        if (!nameValidation.isValid) {
            errors.push(`สาขา #${index + 1}: ${nameValidation.message}`);
        }

        // ตรวจสอบโซน
        const validRegions = ['เหนือ', 'อีสานบน', 'อีสานล่าง', 'กลาง', 'ตะวันออก', 'ตะวันตก', 'ใต้'];
        if (!validRegions.includes(branch.region)) {
            errors.push(`สาขา #${index + 1}: โซน "${branch.region}" ไม่ถูกต้อง`);
        }

        // ตรวจสอบ ID
        if (!branch.id || typeof branch.id !== 'number') {
            errors.push(`สาขา #${index + 1}: ID ไม่ถูกต้อง`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ========== STATISTICS ==========
function getBranchStatistics() {
    const stats = {
        total: userBranches.length,
        byRegion: {},
        createdThisMonth: 0,
        hasSalesData: 0
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    userBranches.forEach(branch => {
        // นับตามโซน
        stats.byRegion[branch.region] = (stats.byRegion[branch.region] || 0) + 1;

        // นับสาขาที่สร้างเดือนนี้
        if (branch.createdAt) {
            const createdDate = new Date(branch.createdAt);
            if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
                stats.createdThisMonth++;
            }
        }

        // นับสาขาที่มีข้อมูลยอดขาย
        if (userSalesData[branch.id] && userSalesData[branch.id].sales) {
            stats.hasSalesData++;
        }
    });

    return stats;
}

// ========== EXPORT FOR TESTING ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addNewBranch,
        editBranch,
        deleteBranch,
        loadBranchesList,
        validateBranchesData,
        getBranchStatistics
    };
}