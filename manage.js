// ========== MANAGEMENT PAGE JAVASCRIPT ==========

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeManagePage();
});

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
    
    // ล้างรายการเก่า
    branchesList.innerHTML = '';
    
    if (userBranches.length === 0) {
        noBranchesMessage.classList.remove('hidden');
        console.log('📭 ไม่มีสาขาในระบบ');
        return;
    }
    
    noBranchesMessage.classList.add('hidden');
    
    // เรนเดอร์รายการสาขา
    userBranches.forEach((branch, index) => {
        const branchItem = createBranchItem(branch, index);
        branchesList.appendChild(branchItem);
    });
    
    console.log(`✅ เรนเดอร์รายการสาขา ${userBranches.length} สาขาเรียบร้อย`);
}

function createBranchItem(branch, index) {
    const branchItem = document.createElement('div');
    branchItem.className = 'branch-item';
    branchItem.dataset.branchId = branch.id;
    
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
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addNewBranch();
            }
        });
        
        // Input validation real-time
        nameInput.addEventListener('input', function() {
            validateNameInputRealTime(this);
        });
    }
    
    // ปุ่มจัดการระบบ
    const exportBtn = document.getElementById('exportBranchesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportBranches);
    }
    
    const importBtn = document.getElementById('importBranchesBtn');
    if (importBtn) {
        importBtn.addEventListener('click', handleImportBranches);
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