// ========== MANAGEMENT PAGE JAVASCRIPT ==========

// ========== INITIALIZATION ==========
function initializeManagePage() {
    console.log('🔄 กำลังเตรียมหน้าจัดการสาขา...');
    
    // โหลดรายชื่อสาขาและผูกตัวนำเข้าโซน
    loadBranchesList();
    setupZonePillSelector();
    setupManageEventListeners();
    updateUIState();
    
    // แสดงเครดิตใต้หน้าและเช็คไลเซนส์
    renderManageFooter();
}

function renderManageFooter() {
    // Write credit to manageFooterArea (NOT footerArea, which has the copy button)
    const f = document.getElementById('manageFooterArea');
    if (!f) return;

    const _y = [169, 32, 50, 48, 50, 53];
    const _v = [118, 50, 46, 48];
    const _n = [84, 84, 55, 49];

    const LINK = 'https://line.me/ti/p/5OUKiBw3Ti';

    const year = String.fromCharCode(..._y);
    const ver = String.fromCharCode(..._v);
    const name = String.fromCharCode(..._n);

    const hashNow = btoa(LINK).slice(3, 11);
    window.__CRED = true; // hashNow === expected always (same string)

    f.innerHTML = `
        <div class="credit" style="padding:12px 0 16px 0;text-align:center;">
            ${year} ${ver}
            <a href="${LINK}" data-hash="${hashNow}" target="_blank"><u>${name}</u></a>
        </div>
    `;
}

// ========== Pill Selector โซนภาค ==========
function setupZonePillSelector() {
    const pills = document.querySelectorAll('#zonePillSelector .zone-pill');
    pills.forEach(pill => {
        // Use onclick (not addEventListener) to prevent stacking on re-init
        pill.onclick = function() {
            pills.forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
        };
    });
}

function getSelectedZone() {
    const activePill = document.querySelector('#zonePillSelector .zone-pill.selected');
    return activePill ? activePill.dataset.zone : 'เหนือ';
}

function setSelectedZone(zoneName) {
    const pills = document.querySelectorAll('#zonePillSelector .zone-pill');
    pills.forEach(pill => {
        if (pill.dataset.zone === zoneName) {
            pill.classList.add('selected');
        } else {
            pill.classList.remove('selected');
        }
    });
}

// ========== UI RENDERING ==========
function loadBranchesList() {
    const branchesList = document.getElementById('branchesList');
    const noBranchesMessage = document.getElementById('noBranchesMessage');

    if (!branchesList || !noBranchesMessage) {
        console.error('❌ ไม่พบ element branches list หรือ no branches message');
        return;
    }

    // เรียงลำดับรายการสาขาตามลำดับ 'order'
    userBranches.sort((a, b) => a.order - b.order); 

    branchesList.innerHTML = '';

    if (userBranches.length === 0) {
        noBranchesMessage.classList.remove('hidden');
        return;
    }

    noBranchesMessage.classList.add('hidden');

    userBranches.forEach((branch, index) => {
        const branchItem = createBranchItem(branch, index);
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
            <span class="branch-drag-handle">≡</span>
            <div class="branch-name">${index + 1}. ${branch.name}</div>
            <span class="zone-badge zone-${branch.region || 'เหนือ'}">${branch.region || 'เหนือ'}</span>
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

// ========== DRAG AND DROP LOGIC ==========
function setupBranchItemDragEvents(branchItem) {
    branchItem.addEventListener('dragstart', handleDragStart);
    branchItem.addEventListener('dragover', handleDragOver);
    branchItem.addEventListener('dragleave', handleDragLeave);
    branchItem.addEventListener('drop', handleDrop);
    branchItem.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.branchId);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault(); 
    const draggedElement = document.querySelector('.dragging');
    const targetElement = e.currentTarget;

    if (draggedElement && draggedElement !== targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const next = (e.clientY - rect.top) / targetElement.offsetHeight > 0.5;

        document.querySelectorAll('.branch-item').forEach(item => {
            item.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        if (next) {
            targetElement.classList.add('drag-over-bottom');
        } else {
            targetElement.classList.add('drag-over-top');
        }
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');

    const draggedId = e.dataTransfer.getData('text/plain');
    const targetId = e.currentTarget.dataset.branchId;

    if (draggedId !== targetId) {
        swapBranchOrder(Number(draggedId), Number(targetId), e.currentTarget.classList.contains('drag-over-bottom'));
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.branch-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

function swapBranchOrder(draggedId, targetId, insertAfter) {
    const draggedIndex = userBranches.findIndex(b => b.id === draggedId);
    const targetIndex = userBranches.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedBranch] = userBranches.splice(draggedIndex, 1);

    let newIndex = targetIndex;
    if (insertAfter) {
        newIndex = targetIndex + 1;
    }
    
    if (!insertAfter && draggedIndex < targetIndex) {
         newIndex -= 1;
    }

    userBranches.splice(newIndex, 0, draggedBranch);
    updateBranchOrderAndSave();
}

function updateBranchOrderAndSave() {
    userBranches.forEach((branch, index) => {
        branch.order = index + 1;
    });

    if (saveAllData()) {
        loadBranchesList(); 
        showToast('✅ สลับตำแหน่งสาขาสำเร็จ!', 'success');
    } else {
        showToast('❌ ไม่สามารถบันทึกตำแหน่งใหม่ได้', 'error');
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

// ========== BRANCH CRUD ACTIONS ==========
function addNewBranch() {
    if (!window.__CRED) {
        showDialog(
            `ระบบตรวจพบการแก้ไขลิขสิทธิ์<br>กรุณาติดต่อผู้พัฒนาจริงเพื่อขอรับสิทธิ์ใช้งานแอปพลิเคชัน`,
            "error"
        );
        return;
    }
    
    const nameInput = document.getElementById('newBranchName');
    if (!nameInput) return;

    const name = nameInput.value.trim();
    const region = getSelectedZone();

    // ตรวจสอบข้อมูลสาขา
    const validation = validateBranchName(name);

    if (!validation.isValid) {
        showToast(validation.message, 'warning');
        nameInput.focus();
        return;
    }

    // ตรวจสอบชื่อซ้ำ
    if (validation.isDuplicate()) {
        showToast('มีชื่อสาขานี้อยู่ในระบบแล้ว', 'warning');
        nameInput.focus();
        nameInput.select();
        return;
    }

    // สร้างสาขาใหม่
    const newBranch = {
        id: Date.now() + Math.random(),
        name: validation.trimmedName,
        region: region,
        order: userBranches.length + 1,
        createdAt: new Date().toISOString()
    };

    userBranches.push(newBranch);

    if (saveAllData()) {
        nameInput.value = '';
        setSelectedZone('เหนือ'); // รีเซ็ตสลักตัวเลือก

        loadBranchesList();
        updateUIState();

        showToast(`เพิ่มสาขา "${newBranch.name}" สำเร็จ`, 'success');
        nameInput.focus();
    } else {
        showToast('❌ ไม่สามารถเพิ่มสาขาได้', 'error');
    }
}

function editBranch(branchId) {
    const branch = userBranches.find(b => b.id === branchId);

    if (!branch) {
        showToast('❌ ไม่พบสาขาที่ต้องการแก้ไข', 'error');
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
        showToast('❌ ไม่พบสาขาที่ต้องการแก้ไข', 'error');
        return;
    }

    const validation = validateBranchName(newName);

    if (!validation.isValid) {
        showToast(validation.message, 'warning');
        return;
    }

    if (validation.isDuplicate(branchId)) {
        showToast('มีชื่อสาขานี้อยู่ในระบบแล้ว', 'warning');
        return;
    }

    branch.name = validation.trimmedName;
    branch.region = newRegion;
    branch.updatedAt = new Date().toISOString();

    if (saveAllData()) {
        loadBranchesList();
        showToast(`✅ แก้ไขสาขา "${branch.name}" สำเร็จ`, 'success');
    } else {
        showToast('❌ ไม่สามารถบันทึกข้อมูลสาขาได้', 'error');
    }
}

function confirmDeleteBranch(branchId) {
    const branch = userBranches.find(b => b.id === branchId);

    if (!branch) {
        showToast('❌ ไม่พบสาขาที่ต้องการลบ', 'error');
        return;
    }

    const hasSalesData = userSalesData[branchId] &&
        userSalesData[branchId].sales &&
        Number(userSalesData[branchId].sales) > 0;

    let message = `⚠️ ยืนยันการลบสาขา "${branch.name}"?`;

    if (hasSalesData) {
        message += `<br><br><small>• ตรวจพบข้อมูลยอดขายค้างอยู่<br>• ข้อมูลยอดขายจะถูกลบออกด้วย</small>`;
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
        showToast('❌ ไม่พบสาขาที่ต้องการลบ', 'error');
        return;
    }

    const branchName = userBranches[branchIndex].name;

    userBranches.splice(branchIndex, 1);
    delete userSalesData[branchId];

    userBranches.forEach((branch, index) => {
        branch.order = index + 1;
    });

    if (saveAllData()) {
        loadBranchesList();
        updateUIState();
        showToast(`✅ ลบสาขา "${branchName}" สำเร็จ`, 'success');
    } else {
        showToast('❌ ไม่สามารถลบสาขาได้', 'error');
    }
}

// ========== CLOUD BACKUP & RESTORE MODAL SYSTEM ==========
const SP_URL = 'https://yiegmtvjpmbreqjqhnsr.supabase.co';
const SP_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWdtdHZqcG1icmVxanFobnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzk0MzQsImV4cCI6MjA4MzcxNTQzNH0.tNXhf--Jk7TPuvKalauoC1Phmz0_x_K1vCKhlbEpjGU';
const sp = supabase.createClient(SP_URL, SP_KEY);

function createCloudModal(title, contentHtml) {
    const oldModal = document.getElementById('cloudModal');
    if (oldModal) oldModal.remove();

    const modalHtml = `
        <div id="cloudModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display:flex; align-items:center; justify-content:center; z-index:9999; font-family:sans-serif;">
            <div style="background:var(--bg-card); border: 1.5px solid var(--border-glass); color:var(--text-primary); padding:25px; border-radius:18px; width:90%; max-width:380px; box-shadow:var(--shadow-premium);">
                <h3 style="margin-top:0; color:var(--text-primary); border-bottom:1px solid var(--border-glass); padding-bottom:10px;">${title}</h3>
                <div style="margin:20px 0; font-size: 14px; line-height: 1.5;">${contentHtml}</div>
                <div style="text-align:right; display: flex; justify-content: flex-end; gap: 8px;">
                    <button onclick="document.getElementById('cloudModal').remove()" style="padding:8px 16px; border:1px solid var(--border-glass); background:var(--bg-input); color:var(--text-muted); border-radius:8px; font-weight:600; cursor:pointer;">ปิด</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== BACKUP LOGIC ==========
async function cloudBackup() {
    const content = `
        <p style="font-size:13px; color:var(--text-muted); margin-bottom: 12px;">ระบุรหัสผ่านระบบสำรองข้อมูลเพื่อเริ่มอัปโหลดประวัติและสาขาขึ้น Cloud</p>
        <input type="password" id="cloudPass" placeholder="ป้อนรหัสแอดมิน..." style="width:100%; padding:12px; box-sizing:border-box; border:1px solid var(--border-glass); background:var(--bg-input); color:var(--text-primary); border-radius:8px; margin-bottom:15px; font-size: 15px;">
        <button id="confirmBackup" style="width:100%; padding:12px; background:var(--accent-teal-gradient); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size: 14px;">🚀 เริ่มกระบวนการสำรองข้อมูล</button>
    `;
    createCloudModal('☁️ Cloud Backup', content);

    const confirmBtn = document.getElementById('confirmBackup');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const pass = document.getElementById('cloudPass').value;
            confirmBtn.disabled = true;
            confirmBtn.innerText = '⌛ กำลังยืนยันรหัสผ่าน...';

            const { data: isOk } = await sp.rpc('verify_admin_key', { input_key: pass });
            if (!isOk) {
                showToast('❌ รหัสแอดมินไม่ถูกต้อง!', 'error');
                confirmBtn.disabled = false;
                confirmBtn.innerText = '🚀 เริ่มกระบวนการสำรองข้อมูล';
                return;
            }

            try {
                // จัดเตรียมสำรองข้อมูลแบบเวอร์ชัน 3.0 (รวมประวัติย้อนหลังด้วย)
                const exportData = {
                    version: "3.0",
                    exportDate: new Date().toISOString(),
                    exportType: "daily2-full-backup",
                    branches: userBranches,
                    salesHistory: salesHistory,
                    settings: {
                        regions: ["เหนือ", "อีสานบน", "อีสานล่าง", "กลาง", "ตะวันออก", "ตะวันตก", "ใต้"]
                    }
                };

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });

                // ลบสำรองข้อมูลเก่าหากมีมากกว่า 2 ชุด
                const { data: files } = await sp.storage.from('branch-backups').list('', {
                    sortBy: { column: 'created_at', order: 'asc' }
                });

                if (files && files.length >= 2) {
                    const filesToDelete = files.slice(0, files.length - 1).map(f => f.name);
                    await sp.storage.from('branch-backups').remove(filesToDelete);
                }

                const fileName = `backup_${Date.now()}.json`;
                await sp.storage.from('branch-backups').upload(fileName, blob);

                const modal = document.getElementById('cloudModal');
                if (modal) modal.remove();
                
                showToast('✅ สำรองข้อมูลขึ้น Cloud สำเร็จ!', 'success');
            } catch (err) {
                showToast('❌ การสำรองพัง: ' + err.message, 'error');
                confirmBtn.disabled = false;
            }
        };
    }
}

// ========== RESTORE LOGIC ==========
async function cloudRestore() {
    createCloudModal('📂 กู้คืนจาก Cloud', '<p id="loadingMsg">⌛ กำลังเชื่อมต่อเพื่อดึงรายการไฟล์...</p><div id="fileContainer"></div>');
    
    try {
        const { data: files, error } = await sp.storage.from('branch-backups').list('', {
            sortBy: { column: 'created_at', order: 'desc' }
        });

        const container = document.getElementById('fileContainer');
        const loadingMsg = document.getElementById('loadingMsg');
        if (loadingMsg) loadingMsg.remove();

        if (error || !files || files.length === 0) {
            container.innerHTML = '<p style="color:var(--accent-rose); text-align:center;">ไม่พบไฟล์สำรองในระบบ</p>';
            return;
        }

        files.forEach((f, i) => {
            const date = new Date(f.created_at).toLocaleString('th-TH', { 
                day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' 
            });

            const badge = (i === 0) ? ' <span style="background:var(--accent-teal); color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">ล่าสุด</span>' : '';
            
            const btn = document.createElement('button');
            btn.innerHTML = `<div><b>ไฟล์ชุดที่ ${i + 1}${badge}</b></div><div style="font-size:11px; color:var(--text-muted); margin-top: 2px;">บันทึกเมื่อ: ${date}</div>`;
            btn.style = "width:100%; padding:12px; margin-bottom:10px; border:1px solid var(--accent-primary); border-radius:10px; background:var(--bg-input); color:var(--text-primary); cursor:pointer; text-align:left; transition: transform 0.2s;";
            
            btn.onclick = () => {
                const modal = document.getElementById('cloudModal');
                if (modal) modal.remove();
                askConfirmRestore(f.name, date);
            };
            container.appendChild(btn);
        });
    } catch (err) {
        showToast('❌ การดึงข้อมูลพัง: ' + err.message, 'error');
    }
}

function askConfirmRestore(fileName, dateLabel) {
    const content = `
        <div style="text-align:center;">
            <p style="color:var(--accent-rose); font-weight:bold; font-size:16px; margin-bottom: 10px;">🚨 คำเตือนความปลอดภัย 🚨</p>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom: 20px;">ข้อมูลสาขา ยอดขายวันนี้ และประวัติเดิมย้อนหลังทั้งหมดจะถูกเขียนทับด้วยชุดข้อมูลวันที่:<br><b>${dateLabel}</b></p>
            <div style="display:flex; gap:10px;">
                <button id="cancelRestore" style="flex:1; padding:10px; border:1px solid var(--border-glass); background:var(--bg-input); color:var(--text-muted); border-radius:8px; font-weight:600; cursor:pointer;">ไม่กู้คืน</button>
                <button id="confirmRestoreFinal" style="flex:1; padding:10px; border:none; background:var(--accent-rose-gradient); color:white; border-radius:8px; font-weight:bold; cursor:pointer;">ใช่, กู้คืนเลย</button>
            </div>
        </div>
    `;
    createCloudModal('ยืนยันการเขียนทับ', content);

    const cancelBtn = document.getElementById('cancelRestore');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            const modal = document.getElementById('cloudModal');
            if (modal) modal.remove();
            cloudRestore(); 
        };
    }

    const confirmFinalBtn = document.getElementById('confirmRestoreFinal');
    if (confirmFinalBtn) {
        confirmFinalBtn.onclick = () => {
            confirmFinalBtn.disabled = true;
            confirmFinalBtn.innerText = '⌛ กู้คืนประวัติ...';
            executeCloudRestore(fileName);
        };
    }
}

async function executeCloudRestore(fileName) {
    try {
        const { data } = await sp.storage.from('branch-backups').download(fileName);
        const text = await data.text();
        const importedData = JSON.parse(text);

        if (!importedData.branches || !Array.isArray(importedData.branches)) {
            throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
        }

        // เขียนข้อมูลสาขาใหม่
        userBranches = importedData.branches.map((branch, index) => ({
            ...branch,
            id: branch.id || Date.now() + index,
            order: index + 1
        }));

        // คืนประวัติย้อนหลัง (ถ้ามีในชุดสำรอง)
        if (importedData.salesHistory && Array.isArray(importedData.salesHistory)) {
            salesHistory = importedData.salesHistory;
            saveHistoryData();
        } else {
            salesHistory = [];
            saveHistoryData();
        }

        userSalesData = {};

        if (saveAllData()) {
            const modal = document.getElementById('cloudModal');
            if (modal) modal.remove();
            showToast('✅ กู้คืนระบบสำเร็จ!', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        }
    } catch (error) {
        console.error("❌ Cloud Restore error:", error);
        showToast('❌ ข้อมูลล้มเหลวหรือเสียหาย', 'error');
    }
}

// ========== EVENT HANDLERS ==========
function setupManageEventListeners() {
    console.log('🔧 ตั้งค่าตัวตรวจจับอีเวนต์หน้าจัดการ...');

    // ปุ่มเพิ่มสาขา
    const addBtn = document.getElementById('addBranchBtn');
    if (addBtn) {
        // แทนที่เพื่อล้างแอดเดอร์ซ้ำ
        addBtn.replaceWith(addBtn.cloneNode(true));
        document.getElementById('addBranchBtn').addEventListener('click', addNewBranch);
    }

    // กด Enter ในช่องป้อนชื่อ
    const nameInput = document.getElementById('newBranchName');
    if (nameInput) {
        nameInput.replaceWith(nameInput.cloneNode(true));
        const cleanInput = document.getElementById('newBranchName');
        cleanInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                addNewBranch();
            }
        });
        cleanInput.addEventListener('input', function () {
            if (this.value.trim().length > 50) {
                this.value = this.value.substring(0, 50);
                showToast('จำกัดชื่อสาขาไม่เกิน 50 ตัวอักษร', 'warning');
            }
        });
    }

    // ปุ่มกระทำการระบบ
    const exportBtn = document.getElementById('exportBranchesBtn');
    if (exportBtn) {
        exportBtn.replaceWith(exportBtn.cloneNode(true));
        document.getElementById('exportBranchesBtn').addEventListener('click', cloudBackup);
    }

    const importBtn = document.getElementById('importBranchesBtn');
    if (importBtn) {
        importBtn.replaceWith(importBtn.cloneNode(true));
        document.getElementById('importBranchesBtn').addEventListener('click', cloudRestore);
    }

    const resetBtn = document.getElementById('resetSystemBtn');
    if (resetBtn) {
        resetBtn.replaceWith(resetBtn.cloneNode(true));
        document.getElementById('resetSystemBtn').addEventListener('click', resetSystem);
    }
}