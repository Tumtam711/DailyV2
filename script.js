// ========== GLOBAL STATE ==========
let userBranches = [];
let userSalesData = {};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadAllData();
    setupEventListeners();
    checkEmptyState();
}

// ========== DATA MANAGEMENT ==========
function loadAllData() {
    // โหลดข้อมูลสาขา
    const savedBranches = localStorage.getItem('userBranches');
    userBranches = savedBranches ? JSON.parse(savedBranches) : [];
    
    // โหลดข้อมูลยอดขาย
    const savedSales = localStorage.getItem('salesData');
    userSalesData = savedSales ? JSON.parse(savedSales) : {};
    
    // เรนเดอร์ UI ตามข้อมูล
    renderSalesCards();
    updateSummary();
}

function saveAllData() {
    // บันทึกข้อมูลสาขา
    localStorage.setItem('userBranches', JSON.stringify(userBranches));
    
    // บันทึกข้อมูลยอดขาย
    const salesData = {};
    document.querySelectorAll('.branch-card').forEach((card, index) => {
        if (userBranches[index]) {
            const branchId = userBranches[index].id;
            
            // 🚩 แก้ตรงนี้ ยัดให้ครบ 6 หัวข้อ
            salesData[branchId] = {
                sales: card.querySelector('.branch-input').value || '',
                paid: card.querySelector('.chk-paid').checked,
                pos: card.querySelector('.chk-pos').checked,
                bill: card.querySelector('.chk-bill').checked,
                // เพิ่ม 3 พี่น้องตระกูลใหม่
                stock: card.querySelector('.chk-stock').checked,
                link: card.querySelector('.chk-link').checked,
                check: card.querySelector('.chk-check').checked
            };
        }
    });
    
    userSalesData = salesData; // อัปเดตตัวแปรใน memory ด้วยให้มันซิงค์กัน
    localStorage.setItem('salesData', JSON.stringify(salesData));
    console.log('💾 บันทึก 6 หัวข้อลง LocalStorage เรียบร้อย');
}

// ========== EMPTY STATE MANAGEMENT ==========
function checkEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const branchesContainer = document.getElementById('branchesContainer');
    const noBranchesMessage = document.getElementById('noBranchesMessage');
    
    // เช็คว่าอยู่หน้าไหน
    const isSalesPage = !document.getElementById('salesPage').classList.contains('hidden');
    
    if (isSalesPage && userBranches.length === 0) {
        // หน้า sales และไม่มีสาขา → แสดง state ว่าง
        emptyState.classList.remove('hidden');
        branchesContainer.classList.add('hidden');
    } else if (isSalesPage && userBranches.length > 0) {
        // หน้า sales และมีสาขา → ซ่อน state ว่าง
        emptyState.classList.add('hidden');
        branchesContainer.classList.remove('hidden');
    }
    
    // จัดการข้อความในหน้า management
    if (noBranchesMessage) {
        if (userBranches.length === 0) {
            noBranchesMessage.classList.remove('hidden');
        } else {
            noBranchesMessage.classList.add('hidden');
        }
    }
}

// ========== SALES PAGE FUNCTIONS ==========
function renderSalesCards() {
    const branchesContainer = document.getElementById('branches');
    branchesContainer.innerHTML = '';
    
    userBranches.forEach((branch, index) => {
        const card = document.createElement('div');
        card.className = 'branch-card';
        card.dataset.branchId = branch.id;
        
        // โหลดข้อมูลยอดขายจาก storage
        const salesData = userSalesData[branch.id] || { sales: '', paid: true, pos: true, bill: true };
        
        card.innerHTML = `
            <h3>${index + 1}. สาขา${branch.name}</h3>
            <div class="sales-row">
                💵 ยอดขายวันนี้ :
                <input type="number" class="branch-input" min="0" placeholder="กรอกยอดขาย" 
                       value="${salesData.sales}">
            </div>
            <div class="checkbox-row ${salesData.sales ? '' : 'hidden'}">
                <label><input type="checkbox" class="chk-paid" ${salesData.paid ? 'checked' : ''}> โอนครบ</label>
                <label><input type="checkbox" class="chk-pos" ${salesData.pos ? 'checked' : ''}> POS ครบ</label>
                <label><input type="checkbox" class="chk-bill" ${salesData.bill ? 'checked' : ''}> บิลครบ</label>
            </div>
        `;
        branchesContainer.appendChild(card);
    });
    
    updateSummary();
}

function updateSummary() {
    let total = 0;
    let filled = 0;

    document.querySelectorAll('.branch-card').forEach(card => {
        const input = card.querySelector('.branch-input');
        const val = input.value.trim();
        const num = Number(val);

        if (val !== "") filled++;
        if (!isNaN(num)) total += num;

        // แสดง/ซ่อน checkbox ตามยอดขาย
        const checkboxRow = card.querySelector('.checkbox-row');
        if (num > 0) {
            checkboxRow.classList.remove('hidden');
        } else {
            checkboxRow.classList.add('hidden');
        }
    });

    const countEl = document.getElementById('branchCount');
    const totalEl = document.getElementById('totalSales');
    
    countEl.textContent = `📋 ${filled}/${userBranches.length} สาขา`;
    totalEl.textContent = `💷 ยอดรวม ${total.toLocaleString()} บาท`;
    
    // Animation เมื่อยอดเปลี่ยน
    if (total > 0) {
        totalEl.classList.add('total-animate');
        setTimeout(() => totalEl.classList.remove('total-animate'), 400);
    }
    
    saveAllData();
}

// ========== MANAGEMENT PAGE FUNCTIONS ==========
function loadBranchesList() {
    const branchesList = document.getElementById('branchesList');
    const noBranchesMessage = document.getElementById('noBranchesMessage');
    
    // ล้างรายการเก่า (ยกเว้นข้อความว่าง)
    const existingItems = branchesList.querySelectorAll('.branch-item');
    existingItems.forEach(item => {
        if (!item.classList.contains('no-branches-message')) {
            item.remove();
        }
    });
    
    if (userBranches.length === 0) {
        if (noBranchesMessage) noBranchesMessage.classList.remove('hidden');
        return;
    }
    
    if (noBranchesMessage) noBranchesMessage.classList.add('hidden');
    
    // เรนเดอร์รายการสาขา
    userBranches.forEach((branch, index) => {
        const branchItem = document.createElement('div');
        branchItem.className = 'branch-item';
        branchItem.dataset.branchId = branch.id;
        branchItem.draggable = true;
        
        branchItem.innerHTML = `
            <div class="branch-info">
                <span class="branch-name">${index + 1}. ${branch.name}</span>
                <span class="branch-region">${branch.region}</span>
            </div>
            <div class="branch-actions">
                <button class="edit-btn" onclick="editBranch(${branch.id})">✏️ แก้ไข</button>
                <button class="delete-btn" onclick="confirmDeleteBranch(${branch.id})">🗑️ ลบ</button>
                <button class="move-btn">↕️ ลาก</button>
            </div>
        `;
        
        // เพิ่มการลากวาง
        setupDragAndDrop(branchItem);
        branchesList.appendChild(branchItem);
    });
}

function addNewBranch() {
    const nameInput = document.getElementById('newBranchName');
    const regionSelect = document.getElementById('newBranchRegion');
    
    const name = nameInput.value.trim();
    const region = regionSelect.value;
    
    if (!name) {
        showDialog('กรุณากรอกชื่อสาขา', 'warning');
        return;
    }
    
    // ตรวจสอบชื่อซ้ำ
    if (userBranches.some(branch => branch.name === name)) {
        showDialog('มีสาขานี้ในระบบแล้ว', 'warning');
        return;
    }
    
    const newBranch = {
        id: Date.now(),
        name: name,
        region: region,
        order: userBranches.length + 1
    };
    
    userBranches.push(newBranch);
    saveAllData();
    renderSalesCards();
    loadBranchesList();
    checkEmptyState();
    
    // รีเซ็ตฟอร์ม
    nameInput.value = '';
    regionSelect.value = 'ตะวันออก';
    
    showDialog('✅ เพิ่มสาขา "' + name + '" สำเร็จ', 'success');
}

function editBranch(branchId) {
    const branch = userBranches.find(b => b.id === branchId);
    if (!branch) return;
    
    showDialog(
        `✏️ แก้ไขสาขา "${branch.name}"`,
        'edit',
        (newName, newRegion) => {
            if (!newName.trim()) {
                showDialog('กรุณากรอกชื่อสาขา', 'warning');
                return;
            }
            
            // ตรวจสอบชื่อซ้ำ (ไม่นับตัวเอง)
            if (userBranches.some(b => b.name === newName && b.id !== branchId)) {
                showDialog('⚠️ มีสาขานี้ในระบบแล้ว', 'warning');
                return;
            }
            
            branch.name = newName.trim();
            branch.region = newRegion;
            
            saveAllData();
            renderSalesCards();
            loadBranchesList();
            
            showDialog('✅ แก้ไขสาขาสำเร็จ', 'success');
        },
        branch.name,
        branch.region
    );
}

function confirmDeleteBranch(branchId) {
    const branch = userBranches.find(b => b.id === branchId);
    if (!branch) return;
    
    showDialog(
        `⚠️ ยืนยันการลบสาขา "${branch.name}"?<br><small>การกระทำนี้ไม่สามารถย้อนกลับได้</small>`,
        'confirm',
        () => {
            deleteBranch(branchId);
        },
        'ลบสาขา'
    );
}

function deleteBranch(branchId) {
    userBranches = userBranches.filter(b => b.id !== branchId);
    
    // ลบข้อมูลยอดขายของสาขานี้
    delete userSalesData[branchId];
    
    saveAllData();
    renderSalesCards();
    loadBranchesList();
    checkEmptyState();
    
    showDialog('✅ ลบสาขาสำเร็จ', 'success');
}

function setupDragAndDrop(element) {
    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', element.dataset.branchId);
        element.classList.add('dragging');
    });
    
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
    });
    
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('drag-over');
    });
    
    element.addEventListener('dragleave', () => {
        element.classList.remove('drag-over');
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');
        
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = element.dataset.branchId;
        
        if (draggedId !== targetId) {
            reorderBranches(parseInt(draggedId), parseInt(targetId));
        }
    });
}

function reorderBranches(draggedId, targetId) {
    const draggedIndex = userBranches.findIndex(b => b.id === draggedId);
    const targetIndex = userBranches.findIndex(b => b.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [draggedItem] = userBranches.splice(draggedIndex, 1);
    userBranches.splice(targetIndex, 0, draggedItem);
    
    // อัพเดทลำดับ
    userBranches.forEach((branch, index) => {
        branch.order = index + 1;
    });
    
    saveAllData();
    renderSalesCards();
    loadBranchesList();
}

// ========== EXPORT/IMPORT SYSTEM ==========
function exportBranches() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ไม่มีข้อมูลสาขาให้ Export', 'warning');
        return;
    }
    
    const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        branches: userBranches,
        settings: {
            regions: ["ตะวันออก", "ใต้", "กลาง", "เหนือ"]
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `branches-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showDialog('✅ Export สาขาสำเร็จ!', 'success');
}

function importBranches(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.branches || !Array.isArray(importedData.branches)) {
                throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
            }
            
            showDialog(
                `📥 พบ ${importedData.branches.length} สาขาในไฟล์<br><small>ต้องการนำเข้าข้อมูลหรือไม่?</small>`,
                'confirm',
                () => {
                    // ทำการ Import
                    userBranches = importedData.branches.map((branch, index) => ({
                        ...branch,
                        id: branch.id || Date.now() + index,
                        order: index + 1
                    }));
                    
                    // รีเซ็ตข้อมูลยอดขาย
                    userSalesData = {};
                    
                    saveAllData();
                    renderSalesCards();
                    loadBranchesList();
                    checkEmptyState();
                    
                    showDialog(`✅ Import สำเร็จ! นำเข้า ${userBranches.length} สาขา`, 'success');
                },
                'นำเข้าข้อมูล'
            );
            
        } catch (error) {
            console.error("Import error:", error);
            showDialog('❌ ไฟล์ไม่ถูกต้องหรือเสียหาย', 'error');
        }
    };
    
    reader.readAsText(file);
}

function resetSystem() {
    showDialog(
        `⚠️ ยืนยันการล้างระบบทั้งหมด?<br><small>• สาขาทั้งหมดจะถูกลบ<br>• ข้อมูลยอดขายจะหายไป<br>• การกระทำนี้ไม่สามารถย้อนกลับได้</small>`,
        'confirm',
        () => {
            localStorage.removeItem('userBranches');
            localStorage.removeItem('salesData');
            
            userBranches = [];
            userSalesData = {};
            
            renderSalesCards();
            loadBranchesList();
            checkEmptyState();
            
            showDialog('✅ ล้างระบบสำเร็จ! เริ่มต้นใหม่แล้ว', 'success');
        },
        'ล้างระบบ'
    );
}

// ========== REPORT SYSTEM ==========
function copyReport() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ยังไม่มีสาขาในระบบ', 'warning');
        return;
    }
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('th-TH', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    
    let reportText = `สรุปยอดประจำวัน\n`;
    reportText += `ประจำวันที่ ${dateStr}\n\n`;
    
    let total = 0;
    let filledBranches = 0;
    
    userBranches.forEach((branch, index) => {
        const salesData = userSalesData[branch.id] || { sales: '', paid: true, pos: true, bill: true };
        const salesValue = Number(salesData.sales) || 0;
        
        reportText += `${index + 1}. สาขา${branch.name}\n`;
        reportText += `💵 ยอดขายวันนี้ ${salesValue.toLocaleString()} บาท\n`;
        
        if (salesValue > 0) {
            filledBranches++;
            const paid = salesData.paid ? "ยอดโอนครบ" : "ยอดโอนไม่ครบ❌";
            const pos = salesData.pos ? "POS ครบ" : "POS ยังไม่ครบ❌";
            const bill = salesData.bill ? "บิลครบ" : "บิลไม่ครบ❌";
            reportText += `🔹 ${paid}\n🔹 ${pos}\n🔹 ${bill}\n`;
        }
        
        reportText += `\n`;
        total += salesValue;
    });
    
    reportText += `📊 สรุป\n`;
    reportText += `✅ ${filledBranches}/${userBranches.length} สาขากรอกข้อมูล\n`;
    reportText += `💷 ยอดขายรวม: ${total.toLocaleString()} บาท`;
    
    // คัดลอกไปยังคลิปบอร์ด
    navigator.clipboard.writeText(reportText).then(() => {
        // เล่นเสียง
        const sound = document.getElementById('copySound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
        
        // แสดง Dialog สำเร็จ
        const ranking = getTopRanking();
        showDialog(
            `${ranking}<br>✅ คัดลอกรายงานเรียบร้อยแล้ว!`,
            'success',
            null,
            null,
            null,
            reportText
        );
    }).catch(() => {
        showDialog('⚠️ ไม่สามารถคัดลอกได้', 'warning');
    });
}

function getTopRanking() {
    const branchData = userBranches.map(branch => {
        const salesData = userSalesData[branch.id] || { sales: '' };
        return {
            name: branch.name,
            value: Number(salesData.sales) || 0
        };
    });

    const top3 = branchData
        .filter(b => b.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    if (top3.length === 0) return "";

    const icons = ["🥇", "🥈", "🥉"];
    let html = `
        <div style="text-align:center;margin:10px auto 15px;background:linear-gradient(180deg,#fff6ea,#fff);
        border-radius:12px;padding:12px 0;width:90%;max-width:300px;box-shadow:0 3px 10px rgba(0,0,0,0.1);
        font-family:'Prompt',sans-serif;border:2px solid #ff7b00;">
            <div style="font-weight:700;color:#ff7b00;font-size:16px;margin-bottom:8px;">🏆 อันดับวันนี้ 🏆</div>
    `;

    top3.forEach((b, i) => {
        html += `<div style="font-size:14px;color:#333;margin:4px 0;">${icons[i]} <b>${b.name}</b> — ${b.value.toLocaleString()} บาท</div>`;
    });

    html += `</div>`;
    return html;
}

// ========== CUSTOM DIALOG SYSTEM ==========
function showDialog(message, type = 'info', confirmCallback = null, confirmText = 'ตกลง', currentName = '', currentRegion = '') {
    const dialog = document.getElementById('dialog');
    const dialogIcon = document.getElementById('dialogIcon');
    const dialogText = document.getElementById('dialogText');
    const dialogCancel = document.getElementById('dialogCancel');
    const dialogConfirm = document.getElementById('dialogConfirm');
    const dialogClose = document.getElementById('dialogClose');
    
    // ตั้งค่าไอคอนตามประเภท
    const icons = {
        'info': '💡',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'confirm': '❓',
        'edit': '✏️'
    };
    
    dialogIcon.textContent = icons[type] || '💡';
    
    // ตั้งค่าข้อความ
    dialogText.innerHTML = message;
    
    // ซ่อนปุ่มทั้งหมดก่อน
    dialogCancel.classList.add('hidden');
    dialogConfirm.classList.add('hidden');
    dialogClose.classList.add('hidden');
    
    // ตั้งค่าปุ่มตามประเภท
    if (type === 'confirm') {
        dialogCancel.classList.remove('hidden');
        dialogConfirm.classList.remove('hidden');
        dialogConfirm.textContent = confirmText;
        
        dialogConfirm.onclick = () => {
            dialog.classList.add('hidden');
            if (confirmCallback) confirmCallback();
        };
        
        dialogCancel.onclick = () => {
            dialog.classList.add('hidden');
        };
        
    } else if (type === 'edit') {
        // สร้างฟอร์มแก้ไข
        dialogText.innerHTML = `
            ${message}
            <div style="margin-top: 16px; text-align: left;">
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">ชื่อสาขา:</label>
                    <input type="text" id="editBranchName" value="${currentName}" 
                           style="width: 100%; padding: 8px; border: 2px solid #cbd5e0; border-radius: 6px; font-family: 'Prompt';">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">โซน:</label>
                    <select id="editBranchRegion" style="width: 100%; padding: 8px; border: 2px solid #cbd5e0; border-radius: 6px; font-family: 'Prompt';">
                        <option value="ตะวันออก" ${currentRegion === 'ตะวันออก' ? 'selected' : ''}>ตะวันออก</option>
                        <option value="ใต้" ${currentRegion === 'ใต้' ? 'selected' : ''}>ใต้</option>
                        <option value="กลาง" ${currentRegion === 'กลาง' ? 'selected' : ''}>กลาง</option>
                        <option value="เหนือ" ${currentRegion === 'เหนือ' ? 'selected' : ''}>เหนือ</option>
                    </select>
                </div>
            </div>
        `;
        
        dialogConfirm.classList.remove('hidden');
        dialogConfirm.textContent = 'บันทึก';
        
        dialogConfirm.onclick = () => {
            const newName = document.getElementById('editBranchName').value;
            const newRegion = document.getElementById('editBranchRegion').value;
            dialog.classList.add('hidden');
            if (confirmCallback) confirmCallback(newName, newRegion);
        };
        
        dialogCancel.classList.remove('hidden');
        dialogCancel.textContent = 'ยกเลิก';
        dialogCancel.onclick = () => {
            dialog.classList.add('hidden');
        };
        
    } else {
        dialogClose.classList.remove('hidden');
        dialogClose.onclick = () => {
            dialog.classList.add('hidden');
        };
    }
    
    // แสดง Dialog
    dialog.classList.remove('hidden');
    
    // ปิดเมื่อคลิกนอกเหนือ
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            dialog.classList.add('hidden');
        }
    };
}

// ========== PAGE NAVIGATION ==========
function showSalesPage() {
    document.getElementById('salesPage').classList.remove('hidden');
    document.getElementById('managementPage').classList.add('hidden');
    checkEmptyState(); // เรียกเช็ค state ใหม่
}

function showManagementPage() {
    document.getElementById('salesPage').classList.add('hidden');
    document.getElementById('managementPage').classList.remove('hidden');
    loadBranchesList();
    
    // ซ่อน empty state ของหน้า sales เมื่อมาหน้า management
    document.getElementById('emptyState').classList.add('hidden');
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // การกรอกข้อมูลยอดขาย
    document.addEventListener('input', e => {
        if (e.target.classList.contains('branch-input')) {
            updateSummary();
        }
    });
    
    // การเปลี่ยนแปลง checkbox
    document.addEventListener('change', e => {
        if (e.target.classList.contains('chk-paid') || 
            e.target.classList.contains('chk-pos') || 
            e.target.classList.contains('chk-bill')) {
            saveAllData();
        }
    });
    
    // ปุ่มเพิ่มสาขา
    document.getElementById('addBranchBtn').addEventListener('click', addNewBranch);
    
    // Enter ในฟอร์มเพิ่มสาขา
    document.getElementById('newBranchName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewBranch();
    });
    
    // นำเข้าไฟล์
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importBranches(e.target.files[0]);
            e.target.value = '';
        }
    });
    
    // การนำทาง
    document.getElementById('addFirstBranch').addEventListener('click', showManagementPage);
    document.getElementById('goToManage').addEventListener('click', showManagementPage);
    document.getElementById('manageBtn').addEventListener('click', showManagementPage);
    document.getElementById('backToSales').addEventListener('click', showSalesPage);
    
    // ระบบจัดการ
    document.getElementById('exportBranchesBtn').addEventListener('click', exportBranches);
    document.getElementById('importBranchesBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('resetSystemBtn').addEventListener('click', resetSystem);
    document.getElementById('resetTopBtn').addEventListener('click', () => {
        showDialog(
            '⚠️ ยืนยันการล้างข้อมูลยอดขายทั้งหมด?',
            'confirm',
            () => {
                userSalesData = {};
                renderSalesCards();
                showDialog('✅ ล้างข้อมูลยอดขายเรียบร้อยแล้ว', 'success');
            },
            'ล้างข้อมูล'
        );
    });
    
    // รายงาน
    document.getElementById('copyBtn').addEventListener('click', copyReport);
}

// ========== SERVICE WORKER (PWA) ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered: ', registration);
                
                // ตรวจสอบการอัพเดท
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 New content available! Refreshing automatically...');

                            // สั่งให้ Service Worker ตัวใหม่ทำงานทันที
                            newWorker.postMessage({ action: 'skipWaiting' });

                            // สั่งรีเฟรชหน้าจออัตโนมัติ
                            window.location.reload();
                        }
                    });
                });
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ========== PWA INSTALL PROMPT ==========
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // แสดงแบนเนอร์ติดตั้ง (optional)
    setTimeout(() => {
        showDialog(
            '📱 ต้องการติดตั้งแอปไว้ที่หน้าจอหลักไหม?',
            'confirm',
            () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(choiceResult => {
                    if (choiceResult.outcome === 'accepted') {
                        showDialog('✅ ติดตั้งแอปสำเร็จ!', 'success');
                    }
                    deferredPrompt = null;
                });
            },
            'ติดตั้ง'
        );
    }, 3000);
});