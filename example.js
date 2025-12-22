// API Base URL - automatically detects if running locally or on Render
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Global state
let products = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadRecentActivity();
  loadInventory();
  loadRecentStock();
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
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'login.html';
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
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #9ca3af; padding: 40px;">No inventory items found</td></tr>';
      return;
    }
    
    tbody.innerHTML = products.map(product => {
      const status = product.quantity < 10 ? 'Low Stock' : 'In Stock';
      const statusClass = product.quantity < 10 ? 'low-stock' : 'in-stock';
      
      return `
        <tr>
          <td>${product.itemCode}</td>
          <td>${product.productName}</td>
          <td>${product.quantity}</td>
          <td><span class="status-badge ${statusClass}">${status}</span></td>
          <td>
            <button onclick="deleteProduct('${product._id}', '${product.productName}')" 
                    style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Out
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading inventory:', error);
    alert('Failed to load inventory. Make sure the server is running.');
  }
}

// Delete Product Function
async function deleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to mark "${productName}" as OUT?\nThis will remove it from inventory.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    
    alert(`✅ "${productName}" has been marked as OUT and removed from inventory.`);
    
    // Reload inventory and stats
    loadInventory();
    loadDashboardStats();
    loadRecentActivity();
    
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to remove product: ' + error.message);
  }
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