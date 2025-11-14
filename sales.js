// ========== SALES PAGE JAVASCRIPT ==========

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeSalesPage();
});

function initializeSalesPage() {
    console.log('🔄 กำลังเตรียมหน้าสรุปยอด...');
    loadSalesData();
    setupSalesEventListeners();
    checkEmptyState();
}

// ========== DATA MANAGEMENT ==========
function loadSalesData() {
    if (userBranches.length === 0) {
        console.log('📝 ไม่มีสาขาในระบบ');
        return;
    }
    
    renderSalesCards();
    updateSummary();
}

function saveSalesData() {
    // บันทึกข้อมูลยอดขายจากฟอร์ม
    const salesData = {};
    
    document.querySelectorAll('.branch-card').forEach((card, index) => {
        if (userBranches[index]) {
            const branchId = userBranches[index].id;
            const input = card.querySelector('.branch-input');
            const paidCheckbox = card.querySelector('.chk-paid');
            const posCheckbox = card.querySelector('.chk-pos');
            const billCheckbox = card.querySelector('.chk-bill');
            
            salesData[branchId] = {
                sales: input.value || '',
                paid: paidCheckbox ? paidCheckbox.checked : true,
                pos: posCheckbox ? posCheckbox.checked : true,
                bill: billCheckbox ? billCheckbox.checked : true
            };
        }
    });
    
    userSalesData = salesData;
    saveAllData();
}

// ========== UI RENDERING ==========
function renderSalesCards() {
    const branchesContainer = document.getElementById('branches');
    
    if (!branchesContainer) {
        console.error('❌ ไม่พบ container สาขา');
        return;
    }
    
    branchesContainer.innerHTML = '';
    
    userBranches.forEach((branch, index) => {
        const salesData = userSalesData[branch.id] || { 
            sales: '', 
            paid: true, 
            pos: true, 
            bill: true 
        };
        
        const card = document.createElement('div');
        card.className = 'branch-card';
        card.dataset.branchId = branch.id;
        
        card.innerHTML = `
            <!-- บรรทัด 1: ชื่อสาขา -->
            <div class="branch-name">
                ${index + 1}. ${branch.name}
            </div>
            
            <!-- บรรทัด 2: ยอดขาย -->
            <div class="sales-row">
                <span>💵 ยอดขายวันนี้ :</span>
                <input type="number" 
                       class="branch-input" 
                       min="0" 
                       placeholder="0" 
                       value="${salesData.sales}"
                       inputmode="numeric">
            </div>
            
            <!-- บรรทัด 3: Checkboxes -->
            <div class="checkbox-row ${salesData.sales && Number(salesData.sales) > 0 ? '' : 'hidden'}">
                <label class="checkbox-item">
                    <input type="checkbox" class="chk-paid" ${salesData.paid ? 'checked' : ''}>
                    โอนครบ
                </label>
                <label class="checkbox-item">
                    <input type="checkbox" class="chk-pos" ${salesData.pos ? 'checked' : ''}>
                    POSครบ
                </label>
                <label class="checkbox-item">
                    <input type="checkbox" class="chk-bill" ${salesData.bill ? 'checked' : ''}>
                    บิลครบ
                </label>
            </div>
        `;
        
        branchesContainer.appendChild(card);
    });
    
    console.log(`✅ เรนเดอร์การ์ดสาขา ${userBranches.length} สาขาเรียบร้อย`);
}

function updateSummary() {
    let total = 0;
    let filled = 0;

    document.querySelectorAll('.branch-card').forEach(card => {
        const input = card.querySelector('.branch-input');
        const val = input.value.trim();
        const num = Number(val);

        if (val !== "" && !isNaN(num)) {
            filled++;
            total += num;
        }

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
    
    if (countEl) {
        countEl.textContent = `📋 ${filled}/${userBranches.length} สาขา`;
    }
    
    if (totalEl) {
        totalEl.textContent = `💷 ยอดรวม ${total.toLocaleString()} บาท`;
        
        // Animation เมื่อยอดเปลี่ยน
        if (total > 0) {
            totalEl.classList.add('total-animate');
            setTimeout(() => totalEl.classList.remove('total-animate'), 400);
        }
    }
    
    saveSalesData();
}

function checkEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const branchesContainer = document.getElementById('branchesContainer');
    
    if (!emptyState || !branchesContainer) {
        console.error('❌ ไม่พบ element empty state หรือ branches container');
        return;
    }
    
    if (userBranches.length === 0) {
        emptyState.classList.remove('hidden');
        branchesContainer.classList.add('hidden');
        console.log('📭 แสดงสถานะว่างเปล่า');
    } else {
        emptyState.classList.add('hidden');
        branchesContainer.classList.remove('hidden');
        console.log('📊 แสดงรายการสาขา');
    }
}

// ========== EVENT HANDLERS ==========
function setupSalesEventListeners() {
    console.log('🔧 กำลังตั้งค่า event listeners...');
    
    // การกรอกข้อมูลยอดขาย
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('branch-input')) {
            handleSalesInput(e.target);
        }
    });
    
    // การเปลี่ยนแปลง checkbox
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('chk-paid') || 
            e.target.classList.contains('chk-pos') || 
            e.target.classList.contains('chk-bill')) {
            handleCheckboxChange(e.target);
        }
    });
    
    // ปุ่มล้างข้อมูล
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetData);
    }
    
    // ปุ่มคัดลอกรายงาน
    const copyBtn = document.getElementById('copyReportBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', handleCopyReport);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('✅ ตั้งค่า event listeners เรียบร้อย');
}

function handleSalesInput(input) {
    const value = input.value.trim();
    const numValue = Number(value);
    
    // ตรวจสอบค่าที่กรอก
    if (value !== '' && (isNaN(numValue) || numValue < 0)) {
        // ค่าไม่ถูกต้อง, รีเซ็ตเป็นค่าว่าง
        input.value = '';
    }
    
    // อัพเดท UI
    updateSummary();
}

function handleCheckboxChange(checkbox) {
    // บันทึกข้อมูลเมื่อ checkbox เปลี่ยน
    saveSalesData();
}

function handleResetData() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ไม่มีข้อมูลที่จะล้าง', 'warning');
        return;
    }
    
    const hasData = Object.values(userSalesData).some(data => 
        data.sales && Number(data.sales) > 0
    );
    
    if (!hasData) {
        showDialog('ℹ️ ยังไม่มีข้อมูลยอดขาย', 'info');
        return;
    }
    
    showDialog(
        `⚠️ ยืนยันการล้างข้อมูลยอดขายทั้งหมด?<br><br>
        <small>• ยอดขายทั้งหมดจะถูกลบ<br>
        • สถานะการตรวจสอบจะถูกรีเซ็ต</small>`,
        'confirm',
        () => {
            // รีเซ็ตข้อมูลยอดขาย
            userSalesData = {};
            
            // รีเซ็ต UI
            document.querySelectorAll('.branch-input').forEach(input => {
                input.value = '';
            });
            
            document.querySelectorAll('.checkbox-row').forEach(row => {
                row.classList.add('hidden');
            });
            
            document.querySelectorAll('.chk-paid, .chk-pos, .chk-bill').forEach(checkbox => {
                checkbox.checked = true;
            });
            
            updateSummary();
            showDialog('✅ ล้างข้อมูลยอดขายเรียบร้อยแล้ว', 'success');
        },
        'ล้างข้อมูล'
    );
}

async function handleCopyReport() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ยังไม่มีสาขาในระบบ', 'warning');
        return;
    }
    
    const hasData = Object.values(userSalesData).some(data => 
        data.sales && Number(data.sales) > 0
    );
    
    if (!hasData) {
        showDialog('ℹ️ ยังไม่มีข้อมูลยอดขายให้รายงาน', 'info');
        return;
    }
    
    try {
        // สร้างรายงาน
        const report = generateSimpleReport();
        
        // คัดลอกไปยัง clipboard
        const copySuccess = await copyToClipboard(report.text);
        
        if (copySuccess) {
            // แสดงตัวอย่างรายงานที่คัดลอก
            showDialog(
                '✅ คัดลอกรายงานเรียบร้อยแล้ว!',
                'preview',
                null,
                null,
                { previewText: report.text }
            );
        } else {
            showDialog('❌ ไม่สามารถคัดลอกรายงานได้', 'error');
        }
        
    } catch (error) {
        console.error('❌ Report copy error:', error);
        showDialog('❌ เกิดข้อผิดพลาดในการสร้างรายงาน', 'error');
    }
}

function handleKeyboardShortcuts(e) {
    // Ctrl + Enter หรือ Cmd + Enter: คัดลอกรายงาน
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const copyBtn = document.getElementById('copyReportBtn');
        if (copyBtn) {
            copyBtn.click();
        }
    }
    
    // Escape: ล้าง input ที่กำลัง focus
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('branch-input')) {
            activeElement.value = '';
            updateSummary();
        }
    }
}

// ========== INPUT VALIDATION ==========
function validateSalesInput(input) {
    const value = input.value.trim();
    
    if (value === '') {
        return { isValid: true, value: '' };
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
        return { 
            isValid: false, 
            message: '⚠️ กรุณากรอกตัวเลขเท่านั้น' 
        };
    }
    
    if (numValue < 0) {
        return { 
            isValid: false, 
            message: '⚠️ ยอดขายต้องไม่ต่ำกว่า 0' 
        };
    }
    
    if (numValue > 1000000000) { // 1 พันล้าน
        return { 
            isValid: false, 
            message: '⚠️ ยอดขายสูงเกินไป' 
        };
    }
    
    return { 
        isValid: true, 
        value: numValue.toString() 
    };
}

// ========== PERFORMANCE OPTIMIZATION ==========
let updateTimeout = null;

function debouncedUpdateSummary() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }
    
    updateTimeout = setTimeout(() => {
        updateSummary();
        updateTimeout = null;
    }, 300);
}

// ========== VISUAL FEEDBACK ==========
function showInputFeedback(input, isValid) {
    if (isValid) {
        input.style.borderColor = '#00c043';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    } else {
        input.style.borderColor = '#dc2626';
        input.style.background = '#fef2f2';
    }
}

// ========== PAGE VISIBILITY ==========
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // โหลดข้อมูลใหม่เมื่อกลับมาที่หน้า
        loadAllData();
        updateSummary();
    }
});

// ========== OFFLINE SUPPORT ==========
window.addEventListener('online', function() {
    console.log('🌐 ออนไลน์แล้ว');
    showDialog('🌐 เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
});

window.addEventListener('offline', function() {
    console.log('📴 ออฟไลน์แล้ว');
    showDialog('📴 กำลังทำงานในโหมดออฟไลน์', 'warning');
});

// ========== EXPORT FUNCTIONS ==========
// สำหรับการทดสอบและการ debug
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderSalesCards,
        updateSummary,
        checkEmptyState,
        generateSimpleReport
    };
}