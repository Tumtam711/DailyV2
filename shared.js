// ========== SHARED JAVASCRIPT ==========
// ฟังก์ชันที่ใช้ร่วมกันทั้ง 2 หน้า

// ========== GLOBAL STATE ==========
let userBranches = [];
let userSalesData = {};

// ========== DATA MANAGEMENT ==========

// โหลดข้อมูลทั้งหมดจาก localStorage
function loadAllData() {
    try {
        // โหลดข้อมูลสาขา
        const savedBranches = localStorage.getItem('userBranches');
        userBranches = savedBranches ? JSON.parse(savedBranches) : [];
        
        // โหลดข้อมูลยอดขาย
        const savedSales = localStorage.getItem('salesData');
        userSalesData = savedSales ? JSON.parse(savedSales) : {};
        
        console.log('📁 โหลดข้อมูลสำเร็จ:', {
            branches: userBranches.length,
            sales: Object.keys(userSalesData).length
        });
        
        return true;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        showDialog('❌ เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
        return false;
    }
}

// บันทึกข้อมูลทั้งหมดไปยัง localStorage
function saveAllData() {
    try {
        // บันทึกข้อมูลสาขา
        localStorage.setItem('userBranches', JSON.stringify(userBranches));
        
        // บันทึกข้อมูลยอดขาย
        localStorage.setItem('salesData', JSON.stringify(userSalesData));
        
        console.log('💾 บันทึกข้อมูลสำเร็จ:', {
            branches: userBranches.length,
            sales: Object.keys(userSalesData).length
        });
        
        return true;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        showDialog('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        return false;
    }
}

// ========== BRANCH VALIDATION ==========

// ตรวจสอบชื่อสาขา
function validateBranchName(name) {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
        return {
            isValid: false,
            message: '⚠️ กรุณากรอกชื่อสาขา'
        };
    }
    
    if (trimmedName.length > 50) {
        return {
            isValid: false,
            message: '⚠️ ชื่อสาขาต้องไม่เกิน 50 ตัวอักษร'
        };
    }
    
    // ตรวจสอบชื่อซ้ำ (ไม่นับตัวเองในกรณีแก้ไข)
    const isDuplicate = (excludeId = null) => {
        return userBranches.some(branch => 
            branch.name.toLowerCase() === trimmedName.toLowerCase() && 
            branch.id !== excludeId
        );
    };
    
    return {
        isValid: true,
        isDuplicate,
        trimmedName
    };
}

// ========== CUSTOM DIALOG SYSTEM ==========

// แสดง Dialog แบบต่างๆ
function showDialog(message, type = 'info', confirmCallback = null, confirmText = 'ตกลง', inputData = null) {
    const dialog = document.getElementById('dialog');
    const dialogIcon = document.getElementById('dialogIcon');
    const dialogText = document.getElementById('dialogText');
    const dialogCancel = document.getElementById('dialogCancel');
    const dialogConfirm = document.getElementById('dialogConfirm');
    const dialogClose = document.getElementById('dialogClose');
    
    if (!dialog) {
        console.error('❌ ไม่พบ element dialog');
        return;
    }
    
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
    
    // ล้าง content เก่า
    dialogText.innerHTML = '';
    
    // ซ่อนปุ่มทั้งหมดก่อน
    dialogCancel.classList.add('hidden');
    dialogConfirm.classList.add('hidden');
    dialogClose.classList.add('hidden');
    
    // ตั้งค่าตามประเภท Dialog
    switch (type) {
        case 'confirm':
            // Dialog ยืนยันการกระทำ
            dialogText.innerHTML = message;
            dialogCancel.classList.remove('hidden');
            dialogConfirm.classList.remove('hidden');
            dialogConfirm.textContent = confirmText;
            
            dialogConfirm.onclick = () => {
                closeDialog();
                if (confirmCallback) confirmCallback();
            };
            
            dialogCancel.onclick = closeDialog;
            break;
            
        case 'edit':
            // Dialog แก้ไขสาขา
            dialogText.innerHTML = message;
            
            // สร้างฟอร์มแก้ไข
            const editForm = document.createElement('div');
            editForm.className = 'edit-form';
            editForm.innerHTML = `
                <div class="input-group">
                    <label for="editBranchName">ชื่อสาขา:</label>
                    <input type="text" id="editBranchName" value="${inputData?.currentName || ''}" maxlength="50">
                    <div class="input-hint">สูงสุด 50 ตัวอักษร</div>
                </div>
                <div class="input-group">
                    <label for="editBranchRegion">โซน:</label>
                    <select id="editBranchRegion">
                        <option value="เหนือ">เหนือ</option>
                        <option value="อีสานบน">อีสานบน</option>
                        <option value="อีสานล่าง">อีสานล่าง</option>
                        <option value="กลาง">กลาง</option>
                        <option value="ตะวันออก">ตะวันออก</option>
                        <option value="ตะวันตก">ตะวันตก</option>
                        <option value="ใต้">ใต้</option>
                    </select>
                </div>
            `;
            dialogText.appendChild(editForm);
            
            // ตั้งค่า region ปัจจุบัน
            setTimeout(() => {
                const regionSelect = document.getElementById('editBranchRegion');
                if (regionSelect && inputData?.currentRegion) {
                    regionSelect.value = inputData.currentRegion;
                }
                
                // Focus ที่ input
                const nameInput = document.getElementById('editBranchName');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }, 100);
            
            dialogConfirm.classList.remove('hidden');
            dialogConfirm.textContent = 'บันทึก';
            dialogCancel.classList.remove('hidden');
            dialogCancel.textContent = 'ยกเลิก';
            
            dialogConfirm.onclick = () => {
                const newName = document.getElementById('editBranchName')?.value || '';
                const newRegion = document.getElementById('editBranchRegion')?.value || '';
                
                if (confirmCallback) {
                    confirmCallback(newName, newRegion);
                }
                closeDialog();
            };
            
            dialogCancel.onclick = closeDialog;
            break;
            
        case 'preview':
            // Dialog แสดงตัวอย่าง
            dialogText.innerHTML = message;
            
            // เพิ่ม preview content
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-content';
            previewDiv.textContent = inputData?.previewText || '';
            dialogText.appendChild(previewDiv);
            
            dialogClose.classList.remove('hidden');
            dialogClose.onclick = closeDialog;
            break;
            
        default:
            // Dialog ข้อมูลทั่วไป
            dialogText.innerHTML = message;
            dialogClose.classList.remove('hidden');
            dialogClose.onclick = closeDialog;
    }
    
    // แสดง Dialog
    dialog.classList.remove('hidden');
    
    // Event สำหรับปิดเมื่อคลิกพื้นหลัง
    const closeOnBackground = (e) => {
        if (e.target === dialog) {
            closeDialog();
        }
    };
    
    dialog.addEventListener('click', closeOnBackground);
    
    // ฟังก์ชันปิด Dialog
    function closeDialog() {
        dialog.classList.add('hidden');
        dialog.removeEventListener('click', closeOnBackground);
        
        // ล้าง event listeners
        dialogConfirm.onclick = null;
        dialogCancel.onclick = null;
        dialogClose.onclick = null;
    }
}

// ========== EXPORT/IMPORT SYSTEM ==========

// Export ข้อมูลสาขา
function exportBranches() {
    if (userBranches.length === 0) {
        showDialog('⚠️ ไม่มีข้อมูลสาขาให้ Export', 'warning');
        return;
    }
    
    try {
        const exportData = {
            version: "2.0",
            exportDate: new Date().toISOString(),
            exportType: "branches",
            branches: userBranches,
            settings: {
                regions: ["เหนือ", "อีสานบน", "อีสานล่าง", "กลาง", "ตะวันออก", "ตะวันตก", "ใต้"]
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
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showDialog('❌ เกิดข้อผิดพลาดในการ Export', 'error');
    }
}

// Import ข้อมูลสาขา
function importBranches(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // ตรวจสอบรูปแบบไฟล์
            if (!importedData.branches || !Array.isArray(importedData.branches)) {
                throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
            }
            
            if (importedData.branches.length === 0) {
                showDialog('⚠️ ไม่มีข้อมูลสาขาในไฟล์', 'warning');
                return;
            }
            
            showDialog(
                `📥 พบ ${importedData.branches.length} สาขาในไฟล์<br><br>ต้องการนำเข้าข้อมูลหรือไม่?`,
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
                    
                    // โหลดหน้าแรกหลังจาก import สำเร็จ
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    
                    showDialog(`✅ Import สำเร็จ!<br>นำเข้า ${userBranches.length} สาขา`, 'success');
                },
                'นำเข้าข้อมูล'
            );
            
        } catch (error) {
            console.error("❌ Import error:", error);
            showDialog('❌ ไฟล์ไม่ถูกต้องหรือเสียหาย', 'error');
        }
    };
    
    reader.onerror = function() {
        showDialog('❌ ไม่สามารถอ่านไฟล์ได้', 'error');
    };
    
    reader.readAsText(file);
}

// ========== REPORT GENERATION ==========

// สร้างรายงานแบบง่าย
function generateSimpleReport() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('th-TH', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    
    let reportText = `สรุปยอดประจำวัน\n`;
    reportText += `ประจำวันที่ ${dateStr}\n\n`;
    
    let total = 0;
    
    userBranches.forEach((branch, index) => {
        const salesData = userSalesData[branch.id] || { 
            sales: '', 
            paid: true, 
            pos: true, 
            bill: true 
        };
        
        const salesValue = Number(salesData.sales) || 0;
        
        reportText += `${index + 1}. สาขา${branch.name}\n`;
        reportText += `💵 ยอดขายวันนี้ ${salesValue.toLocaleString()} บาท\n`;
        
        if (salesValue > 0) {
            const paidStatus = salesData.paid ? '🔹โอนครบ' : '❌โอนไม่ครบ';
            const posStatus = salesData.pos ? '🔹POSครบ' : '❌POSไม่ครบ';
            const billStatus = salesData.bill ? '🔹บิลครบ' : '❌บิลไม่ครบ';
            
            reportText += `${paidStatus} ${posStatus} ${billStatus}\n`;
        }
        
        reportText += `\n`;
        total += salesValue;
    });
    
    reportText += `💷 ยอดขายรวม : ${total.toLocaleString()} บาท`;
    
    return {
        text: reportText,
        total: total,
        date: dateStr
    };
}

// ========== UTILITY FUNCTIONS ==========

// คัดลอกข้อความไปยัง clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        // เล่นเสียง (ถ้ามี)
        const sound = document.getElementById('copySound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
        
        return true;
    } catch (error) {
        console.error('❌ Copy failed:', error);
        return false;
    }
}

// รีเซ็ตระบบทั้งหมด
function resetSystem() {
    showDialog(
        `⚠️ ยืนยันการล้างระบบทั้งหมด?<br><br>
        <small>
        • สาขาทั้งหมดจะถูกลบ<br>
        • ข้อมูลยอดขายจะหายไป<br>
        • การกระทำนี้ไม่สามารถย้อนกลับได้
        </small>`,
        'confirm',
        () => {
            localStorage.removeItem('userBranches');
            localStorage.removeItem('salesData');
            
            userBranches = [];
            userSalesData = {};
            
            // โหลดหน้าแรกหลังจาก reset
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
            showDialog('✅ ล้างระบบสำเร็จ!', 'success');
        },
        'ล้างระบบ'
    );
}

// ========== INITIALIZATION ==========

// ตรวจสอบว่าเป็นหน้าจัดการหรือไม่
function isManagePage() {
    return window.location.pathname.includes('manage.html');
}

// ตรวจสอบว่าเป็นหน้าสรุปยอดหรือไม่
function isSalesPage() {
    return window.location.pathname.includes('index.html') || 
           window.location.pathname === '/' || 
           window.location.pathname.endsWith('/');
}

// โหลดข้อมูลเมื่อหน้าโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 กำลังโหลดแอปพลิเคชัน...');
    loadAllData();
});

// ========== ERROR HANDLING ==========

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error:', e.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Unhandled promise rejection:', e.reason);
});

// ========== PWA SUPPORT ==========

// ========== SERVICE WORKER REGISTRATION ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(registration) {
        console.log('✅ ServiceWorker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker found...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New content available!');
              showDialog('🔄 มีอัพเดทใหม่!', 'info', () => {
                window.location.reload();
              }, 'รีเฟรช');
            }
          });
        });
      })
      .catch(function(error) {
        console.log('❌ ServiceWorker registration failed:', error);
      });
  });
}

// ========== PWA INSTALL BANNER ==========
let deferredPrompt;
let installBannerTimeout;

// Show install banner
function showInstallBanner() {
    const installBanner = document.getElementById('installBanner');
    if (!installBanner) {
        console.warn('⚠️ installBanner element not found. Will retry after DOM is ready.');
        document.addEventListener('DOMContentLoaded', function onReady() {
            document.removeEventListener('DOMContentLoaded', onReady);
            showInstallBanner();
        }, { once: true });
        return;
    }

    // ซ่อนปุ่มปิด (x) ถ้ามี เพื่อไม่ให้ซ้อนทับปุ่มติดตั้ง
    const closeBtn = document.getElementById('closeInstallBanner');
    if (closeBtn) {
        closeBtn.classList.add('hidden');
        // เคลียร์ event handler ใดๆ เพื่อป้องกันการทำงานที่ไม่ต้องการ
        closeBtn.onclick = null;
    }

    installBanner.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    installBannerTimeout = setTimeout(() => {
        hideInstallBanner();
    }, 5000);
}

// Hide install banner
function hideInstallBanner() {
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.classList.add('hidden');
        if (installBannerTimeout) {
            clearTimeout(installBannerTimeout);
            installBannerTimeout = null;
        }
    }
}

// Setup install banner events
function setupInstallBanner() {
    const installBtn = document.getElementById('installAppBtn');
    const installBanner = document.getElementById('installBanner');
    
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('✅ User accepted the install prompt');
                    showDialog('✅ ติดตั้งแอปสำเร็จ!', 'success');
                } else {
                    console.log('❌ User dismissed the install prompt');
                }
                
                deferredPrompt = null;
                hideInstallBanner();
            } else {
                console.log('ℹ️ No deferredPrompt available when install button clicked');
            }
        });
    }
    
    // Ensure any existing close button is hidden and inert (prevent overlap)
    const closeBtn = document.getElementById('closeInstallBanner');
    if (closeBtn) {
        closeBtn.classList.add('hidden');
        closeBtn.onclick = null;
    }
    
    // Close banner when clicking outside (optional)
    if (installBanner) {
        installBanner.addEventListener('click', (e) => {
            if (e.target === installBanner) {
                hideInstallBanner();
            }
        });
    }
}

// Safe show helper: รอให้ DOM พร้อมก่อนเรียก showInstallBanner (delay เป็น optional)
function safeShowInstallBanner(delay = 3000) {
    console.log('📱 safeShowInstallBanner called, delay:', delay);
    setTimeout(() => {
        // ถ้ารันในโหมด standalone อยู่แล้ว ไม่ต้องแสดง
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 App already in standalone mode, skip showing install banner.');
            return;
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            showInstallBanner();
        } else {
            document.addEventListener('DOMContentLoaded', function onReady() {
                document.removeEventListener('DOMContentLoaded', onReady);
                showInstallBanner();
            }, { once: true });
        }
    }, delay);
}

// PWA Before Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('📱 PWA install available (beforeinstallprompt caught)');
    
    // Use safeShowInstallBanner so we don't try to show banner before DOM exists
    safeShowInstallBanner(3000);
});

// Check if app is already installed
window.addEventListener('DOMContentLoaded', () => {
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App is running in standalone mode');
    }
    
    setupInstallBanner();
});

// Hide banner when app is successfully installed
window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA was installed');
    deferredPrompt = null;
    hideInstallBanner();
});