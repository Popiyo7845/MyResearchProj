// API Base URL
const API_URL = 'http://localhost:3000/api';

// Get form element
const registerForm = document.getElementById('registerForm');

// Handle form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form values
  const fullname = document.getElementById('fullname').value.trim();
  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validation
  if (!fullname || !email || !username || !password || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Username validation (minimum 3 characters)
  if (username.length < 3) {
    alert('Username must be at least 3 characters long');
    return;
  }
  
  // Password validation (minimum 6 characters)
  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }
  
  // Check if passwords match
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  // Prepare user data
  const userData = {
    fullname,
    email,
    username,
    password
  };
  
  try {
    // Send registration request to API
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Success
    alert('✅ Account created successfully! You can now log in.');
    
    // Redirect to login page
    window.location.href = 'index.html';
    
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed: ' + error.message);
  }
});