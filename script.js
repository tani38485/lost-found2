// *** เปลี่ยนตรงนี้เป็น Web App URL ของ Google Apps Script ของคุณ ***
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA4D-AbvgXo1kiJfNQAlSyr4ISUtCkDyfAGc_M3pZhEV5E1IYIXLSnG_brvA_Wc2M/exec'; 

// *** เปลี่ยนตรงนี้เป็น URL ของ Google Form ที่คุณสร้าง (ไม่ใช่ Embed URL) ***
// ตัวอย่าง: https://docs.google.com/forms/d/e/1FAIpQLSdU7B-j7c1tC9xR-j6g5w3W0y1z_2X_4_K_0_A_2/viewform
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdLtrJLNFYmgCYuTxPAi4-rKrWn7SBTv1T4AvfVKD408ooM-Q/viewform'; 

// *** รหัสผ่านสำหรับการเข้าถึงหน้า "Post New Item" (เพื่อเปิด Google Form) ***
const POST_ITEM_ACCESS_PASSWORD = '12345'; 

document.addEventListener('DOMContentLoaded', () => {
    // ซ่อนเนื้อหาทั้งหมดเมื่อโหลดหน้าครั้งแรก
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // แสดงแท็บ "View Items" โดยไม่ต้องใส่รหัสผ่าน
    showTab('viewItems'); 
    
    // ตั้งค่า Event Listener สำหรับ Tab Buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab-id'); 
            handleTabChange(targetTab);
        });
    });

    // ไม่ต้องมี Event Listener สำหรับ Submit Form แล้ว เพราะจะไป Google Form
    // const postForm = document.getElementById('post-form');
    // if (postForm) { 
    //     postForm.addEventListener('submit', handlePostSubmit);
    // }
});

// ฟังก์ชันสำหรับจัดการการเปลี่ยน Tab โดยมีรหัสผ่านเฉพาะบางแท็บ
function handleTabChange(tabId) {
    // ถ้าจะไปแท็บ "Post New Item" ที่ต้องมีการล็อกอิน
    if (tabId === 'postItem') {
        const password = prompt(`Enter password to open the Google Form:`);
        if (!password || password !== POST_ITEM_ACCESS_PASSWORD) {
            alert('Incorrect password. Access denied.');
            return;
        }
        // ถ้าใส่รหัสถูก ให้เปิด Google Form ในแท็บใหม่
        window.open(GOOGLE_FORM_URL, '_blank');
        // ไม่ต้องเปลี่ยนแท็บในหน้าเว็บนี้ แต่ยังคงสถานะแท็บเดิม (View Items) หรือแท็บที่ใช้งานอยู่
        // หรือจะเลือกเปลี่ยนกลับไปที่ viewItems ก็ได้
        // showTab('viewItems'); // สามารถเปิดใช้งานหากต้องการให้กลับไปที่ View Items เสมอ
        return; // สำคัญ: ออกจากฟังก์ชันนี้เพื่อไม่ให้ไปเรียก showTab อีก
    }
    // ถ้าเป็น 'viewItems' หรือแท็บอื่นๆ จะแสดงได้เลย
    showTab(tabId); 
}

// ฟังก์ชันสลับ Tab จริงๆ
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[data-tab-id="${tabId}"]`).classList.add('active'); 

    // ถ้าเปลี่ยนมาที่ View Items tab ให้โหลดข้อมูลใหม่
    if (tabId === 'viewItems') {
        loadItems();
    }
    // ไม่ต้องมีโค้ดจัดการเมื่อเข้าแท็บ postItem แล้ว เพราะมันจะถูกเปิดในแท็บใหม่ไปแล้ว
}

// ฟังก์ชันโหลดข้อมูลจาก Google Apps Script (เหมือนเดิม)
async function loadItems() {
    const itemsListDiv = document.getElementById('items-list');
    itemsListDiv.innerHTML = '<p>Loading items...</p>'; 

    try {
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getData`);
        const data = await response.json();

        if (data && data.length > 0) {
            const activeAndPendingItems = data.filter(item => item.Status === 'Active' || item.Status === 'Pending');
            const resolvedItems = data.filter(item => item.Status === 'Resolved');

            const sortedActiveAndPendingItems = activeAndPendingItems.sort((a, b) => new Date(b.DatePosted) - new Date(a.DatePosted));
            const sortedResolvedItems = resolvedItems.sort((a, b) => new Date(b.DatePosted) - new Date(a.DatePosted));

            const displayItems = sortedActiveAndPendingItems.concat(sortedResolvedItems); 

            itemsListDiv.innerHTML = ''; 
            displayItems.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = `item-card ${item.Status ? item.Status.toLowerCase() : 'active'}`; 

                const statusTagClass = item.Type === 'Lost' ? 'lost' : 'found';

                let statusButtons = '';
                if (item.Status !== 'Resolved') {
                    statusButtons = `
                        <div class="status-action-buttons">
                            ${item.Status !== 'Active' ? `<button class="action-button mark-active-button" data-item-id="${item.ID}" data-item-name="${item.ItemName}" data-new-status="Active">Mark as Active</button>` : ''}
                            ${item.Status !== 'Pending' ? `<button class="action-button mark-pending-button" data-item-id="${item.ID}" data-item-name="${item.ItemName}" data-new-status="Pending">Mark as Pending</button>` : ''}
                            <button class="action-button mark-resolved-button" data-item-id="${item.ID}" data-item-name="${item.ItemName}" data-new-status="Resolved">Mark as Resolved</button>
                        </div>
                    `;
                }

                itemCard.innerHTML = `
                    <span class="status-tag ${statusTagClass}">${item.Type}</span>
                    <h3 class="item-name">${item.ItemName}</h3>
                    <p><span class="label">Status:</span> <span class="item-status status-${item.Status ? item.Status.toLowerCase() : 'active'}">${item.Status || 'Active'}</span></p>
                    <p><span class="label">Description:</span> ${item.Description || '-'}</p>
                    <p><span class="label">Location:</span> ${item.Location}</p>
                    <p><span class="label">Contact:</span> ${item.ContactInfo}</p>
                    <p><span class="label">Posted On:</span> ${item.DatePosted}</p>
                    ${item.ImageURL ? `<img src="${item.ImageURL}" alt="${item.ItemName}">` : ''}
                    ${statusButtons}
                `;
                itemsListDiv.appendChild(itemCard);
            });

            document.querySelectorAll('.mark-active-button, .mark-pending-button, .mark-resolved-button').forEach(button => {
                button.addEventListener('click', handleStatusChange);
            });

        } else {
            itemsListDiv.innerHTML = '<p>No items found yet.</p>';
        }
    } catch (error) {
        console.error('Error loading items:', error);
        itemsListDiv.innerHTML = '<p style="color: red;">Error loading items. Please try again later.</p>';
    }
}

// ฟังก์ชันสำหรับจัดการการคลิกปุ่มเปลี่ยนสถานะ (เหมือนเดิม)
async function handleStatusChange(event) {
    const itemId = event.target.dataset.itemId;
    const itemName = event.target.dataset.itemName;
    const newStatus = event.target.dataset.newStatus;
    
    // ขอรหัสผ่านเพื่อยืนยันการเปลี่ยนสถานะ (รหัสผ่าน Admin)
    const password = prompt(`Enter admin password to mark "${itemName}" (ID: ${itemId}) as ${newStatus}:`);
    if (!password) {
        alert('Password required to change status.');
        return;
    }

    if (!confirm(`Are you sure you want to mark "${itemName}" (ID: ${itemId}) as ${newStatus}?`)) {
        return;
    }

    event.target.textContent = 'Updating...';
    event.target.disabled = true;

    const formData = new FormData();
    formData.append('action', 'updateStatus');
    formData.append('password', password); 
    formData.append('itemId', itemId);
    formData.append('newStatus', newStatus); 

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.status === 'success') {
            alert(result.message);
            loadItems(); 
        } else {
            alert(`Error: ${result.message}`);
            event.target.textContent = `Mark as ${newStatus}`; 
            event.target.disabled = false;
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Network error or server issue. Could not update status.');
        event.target.textContent = `Mark as ${newStatus}`; 
        event.target.disabled = false;
    }
}

// ฟังก์ชันจัดการการ Submit Form (ลบออกไปแล้วเพราะจะไป Google Form แทน)
// async function handlePostSubmit(event) { ... }