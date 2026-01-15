// API Base URL - automatically detects if running locally or on production
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:10000/api' 
  : 'https://myresearchproj-1.onrender.com/api';

// Global state
let products = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadRecentActivity();
  loadInventory();
  loadRecentStock();
  updateNotifications(); // Initialize notifications
});

// Navigation
function showSection(sectionId) {
  // Remove active class from all sections and buttons
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to selected section and button
  document.getElementById(sectionId).classList.add('active');
  event.target.classList.add('active');
  
  // Reload data when switching sections
  if (sectionId === 'dashboard') {
    loadDashboardStats();
    loadRecentActivity();
  } else if (sectionId === 'inventory') {
    loadInventory();
  } else if (sectionId === 'stockin') {
    loadRecentStock();
  }
  // Guide section doesn't need to reload data
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

// ==================== NOTIFICATION FUNCTIONS ====================

function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

// Close notification panel when clicking outside
document.addEventListener('click', (event) => {
  const container = document.querySelector('.notification-container');
  const panel = document.getElementById('notificationPanel');
  
  if (container && !container.contains(event.target)) {
    panel.style.display = 'none';
  }
});

async function updateNotifications() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    
    const notifications = [];
    const today = new Date();
    
    products.forEach(product => {
      // Check for low stock (less than 10 units)
      if (product.quantity < 10) {
        notifications.push({
          type: 'low-stock',
          message: `Low Stock: ${product.productName} (${product.quantity} units remaining)`,
          severity: 'warning',
          product: product.productName
        });
      }
      
      // Check for near expiration (within 30 days)
      const expirationDate = new Date(product.expirationDate);
      const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        notifications.push({
          type: 'near-expiration',
          message: `Expiring Soon: ${product.productName} expires in ${daysUntilExpiration} days`,
          severity: daysUntilExpiration <= 7 ? 'critical' : 'warning',
          product: product.productName,
          days: daysUntilExpiration
        });
      } else if (daysUntilExpiration <= 0) {
        notifications.push({
          type: 'expired',
          message: `EXPIRED: ${product.productName} expired ${Math.abs(daysUntilExpiration)} days ago`,
          severity: 'critical',
          product: product.productName
        });
      }
    });
    
    // Update badge
    const badge = document.getElementById('notificationBadge');
    if (notifications.length > 0) {
      badge.textContent = notifications.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
    
    // Update notification panel
    const notificationList = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
      notificationList.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No notifications</p>';
    } else {
      notificationList.innerHTML = notifications.map(notif => {
        let bgColor, iconColor, icon;
        
        if (notif.severity === 'critical') {
          bgColor = '#fef2f2';
          iconColor = '#ef4444';
          icon = '⚠️';
        } else {
          bgColor = '#fffbeb';
          iconColor = '#f59e0b';
          icon = '⚡';
        }
        
        return `
          <div style="padding: 12px; margin: 8px 0; background: ${bgColor}; border-left: 4px solid ${iconColor}; border-radius: 6px;">
            <p style="margin: 0; color: #111827; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">${icon}</span>
              ${notif.message}
            </p>
          </div>
        `;
      }).join('');
    }
    
  } catch (error) {
    console.error('Error updating notifications:', error);
  }
}

// ==================== DASHBOARD FUNCTIONS ====================

async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    const stats = await response.json();
    
    document.getElementById('totalItems').textContent = stats.totalItems;
    document.getElementById('stockInToday').textContent = stats.stockInToday;
    document.getElementById('lowStockItems').textContent = stats.lowStockItems;
    
    // Update notifications when stats are loaded
    updateNotifications();
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecentActivity() {
  try {
    const response = await fetch(`${API_URL}/recent-activity`);
    const activities = await response.json();
    
    const activityList = document.getElementById('activityList');
    
    if (activities.length === 0) {
      activityList.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No activity yet</p>';
      return;
    }
    
    activityList.innerHTML = activities.map(activity => `
      <div style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #374151;">${activity.message}</p>
        <small style="color: #9ca3af;">${formatDate(activity.time)}</small>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading activity:', error);
  }
}

// ==================== INVENTORY FUNCTIONS ====================

async function loadInventory() {
  try {
    const response = await fetch(`${API_URL}/products`);
    products = await response.json();
    
    const tbody = document.getElementById('inventoryTableBody');
    
    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #9ca3af; padding: 40px;">No inventory items found</td></tr>';
      return;
    }
    
    tbody.innerHTML = products.map(product => {
      const status = product.quantity < 10 ? 'Low Stock' : 'In Stock';
      const statusClass = product.quantity < 10 ? 'low-stock' : 'in-stock';
      
      return `
        <tr>
          <td>${product.itemCode}</td>
          <td>${product.productName}</td>
          <td>${product.brand || 'N/A'}</td>
          <td>${product.quantity}</td>
          <td><span class="status-badge ${statusClass}">${status}</span></td>
          <td>
            <button onclick="stockOut('${product._id}', '${product.productName}', ${product.quantity})" 
                    style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Out
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Update notifications after loading inventory
    updateNotifications();
  } catch (error) {
    console.error('Error loading inventory:', error);
    alert('Failed to load inventory. Make sure the server is running.');
  }
}

// Stock Out Function - with Modal UI
function stockOut(productId, productName, currentQuantity) {
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'stockOutModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
      <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px;">Stock Out</h2>
      <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Remove units from inventory</p>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">${productName}</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Current Stock: <strong style="color: #dc2626;">${currentQuantity} units</strong></p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">
          Quantity to Remove <span style="color: #dc2626;">*</span>
        </label>
        <input 
          type="number" 
          id="quantityInput" 
          min="1" 
          max="${currentQuantity}" 
          value="1"
          style="width: 100%; padding: 12px 16px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 16px; font-family: Arial, sans-serif;"
        >
        <p id="remainingStock" style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
          Remaining: <strong>${currentQuantity - 1} units</strong>
        </p>
        <p id="errorMessage" style="margin: 8px 0 0 0; color: #dc2626; font-size: 14px; display: none;"></p>
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button 
          onclick="closeStockOutModal()" 
          style="flex: 1; padding: 12px; background: white; color: #374151; border: 2px solid #d1d5db; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.background='#f3f4f6'"
          onmouseout="this.style.background='white'"
        >
          Cancel
        </button>
        <button 
          onclick="confirmStockOut('${productId}', '${productName}', ${currentQuantity})" 
          style="flex: 1; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.background='#b91c1c'"
          onmouseout="this.style.background='#dc2626'"
        >
          Remove Stock
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus on input
  setTimeout(() => {
    const input = document.getElementById('quantityInput');
    input.focus();
    input.select();
  }, 100);
  
  // Update remaining stock on input change
  const input = document.getElementById('quantityInput');
  input.addEventListener('input', () => {
    const quantity = parseInt(input.value) || 0;
    const remaining = currentQuantity - quantity;
    const remainingText = document.getElementById('remainingStock');
    const errorMsg = document.getElementById('errorMessage');
    
    if (quantity <= 0) {
      errorMsg.textContent = 'Quantity must be greater than 0';
      errorMsg.style.display = 'block';
      remainingText.style.display = 'none';
    } else if (quantity > currentQuantity) {
      errorMsg.textContent = `Cannot remove more than ${currentQuantity} units`;
      errorMsg.style.display = 'block';
      remainingText.style.display = 'none';
    } else {
      errorMsg.style.display = 'none';
      remainingText.style.display = 'block';
      remainingText.innerHTML = `Remaining: <strong>${remaining} units</strong>`;
      
      if (remaining === 0) {
        remainingText.innerHTML = `<strong style="color: #dc2626;">⚠️ This will remove the product completely</strong>`;
      }
    }
  });
  
  // Close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeStockOutModal();
    }
  });
  
  // Close modal on ESC key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeStockOutModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function closeStockOutModal() {
  const modal = document.getElementById('stockOutModal');
  if (modal) {
    modal.remove();
  }
}

async function confirmStockOut(productId, productName, currentQuantity) {
  const input = document.getElementById('quantityInput');
  const quantity = parseInt(input.value);
  
  // Validate input
  if (isNaN(quantity) || quantity <= 0) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = 'Please enter a valid quantity greater than 0';
    errorMsg.style.display = 'block';
    return;
  }
  
  if (quantity > currentQuantity) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = `Cannot remove more than ${currentQuantity} units`;
    errorMsg.style.display = 'block';
    return;
  }
  
  // Calculate new quantity
  const newQuantity = currentQuantity - quantity;
  
  try {
    // If new quantity is 0, delete the product
    if (newQuantity === 0) {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove product');
      }
      
      closeStockOutModal();
      showSuccessMessage(`✅ All ${quantity} units of "${productName}" have been removed from inventory.`);
    } else {
      // Update product with new quantity
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product quantity');
      }
      
      closeStockOutModal();
      showSuccessMessage(`✅ Removed ${quantity} units of "${productName}".\n\nRemaining stock: ${newQuantity} units`);
    }
    
    // Reload inventory and stats
    loadInventory();
    loadDashboardStats();
    loadRecentActivity();
    
  } catch (error) {
    console.error('Error updating stock:', error);
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = 'Failed to update stock: ' + error.message;
    errorMsg.style.display = 'block';
  }
}

function showSuccessMessage(message) {
  const successModal = document.createElement('div');
  successModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  `;
  
  successModal.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
      <div style="width: 64px; height: 64px; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 20px;">Success!</h3>
      <p style="margin: 0 0 24px 0; color: #6b7280; white-space: pre-line;">${message}</p>
      <button 
        onclick="this.parentElement.parentElement.remove()" 
        style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;"
        onmouseover="this.style.background='#b91c1c'"
        onmouseout="this.style.background='#dc2626'"
      >
        OK
      </button>
    </div>
  `;
  
  document.body.appendChild(successModal);
  
  // Auto close after 3 seconds
  setTimeout(() => {
    if (successModal.parentElement) {
      successModal.remove();
    }
  }, 3000);
}

// ==================== STOCK IN FUNCTIONS ====================

async function addStock() {
  // Get form values using more specific selectors
  const stockinSection = document.getElementById('stockin');
  const inputs = stockinSection.querySelectorAll('input');
  const textarea = stockinSection.querySelector('textarea');
  
  const productName = inputs[0].value.trim();
  const quantity = inputs[1].value;
  const brand = inputs[2].value.trim();
  const expirationDate = inputs[3].value;
  const manufacturingDate = inputs[4].value;
  const description = textarea.value.trim();
  
  // Validation
  if (!productName || !quantity || !brand || !expirationDate || !manufacturingDate) {
    alert('Please fill in all required fields');
    return;
  }
  
  if (quantity <= 0) {
    alert('Quantity must be greater than 0');
    return;
  }
  
  if (new Date(manufacturingDate) >= new Date(expirationDate)) {
    alert('Manufacturing date must be before expiration date');
    return;
  }
  
  // Create product object
  const productData = {
    productName,
    quantity: parseInt(quantity),
    brand,
    expirationDate,
    manufacturingDate,
    description
  };
  
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add product');
    }
    
    const newProduct = await response.json();
    
    // Success message
    alert(`✅ Product added successfully!\nItem Code: ${newProduct.itemCode}`);
    
    // Clear form
    inputs[0].value = '';
    inputs[1].value = '';
    inputs[2].value = '';
    inputs[3].value = '';
    inputs[4].value = '';
    textarea.value = '';
    
    // Reload recent stock list and inventory
    loadRecentStock();
    loadInventory();
    loadDashboardStats();
    
  } catch (error) {
    console.error('Error adding stock:', error);
    alert('Failed to add product: ' + error.message);
  }
}

async function loadRecentStock() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    
    const recentStockList = document.getElementById('recentStockList');
    
    if (products.length === 0) {
      recentStockList.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No recent stock entries</p>';
      return;
    }
    
    // Show only last 5 products
    const recentProducts = products.slice(0, 5);
    
    recentStockList.innerHTML = recentProducts.map(product => `
      <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; background: #f9fafb;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="margin: 0 0 8px 0; color: #111827;">${product.productName}</h4>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
              <strong>Brand:</strong> ${product.brand} | 
              <strong>Qty:</strong> ${product.quantity} | 
              <strong>Code:</strong> ${product.itemCode}
            </p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
              <strong>Exp:</strong> ${formatDate(product.expirationDate)}
            </p>
          </div>
          <small style="color: #9ca3af;">${formatDate(product.createdAt)}</small>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading recent stock:', error);
  }
}

// ==================== UTILITY FUNCTIONS ====================

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}