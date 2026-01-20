// ==================== LOGIN FUNCTIONALITY ====================

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('alertBox');
  const loginBtn = document.getElementById('loginBtn');
  
  // Function to show alerts
  function showAlert(message, type) {
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.className = `alert alert-${type} show`;
    }
  }
  
  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
      }
      
      // Disable button and show loading
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'LOGGING IN...';
      }
      if (alertBox) {
        alertBox.classList.remove('show');
      }
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',  // ← THIS IS THE FIX!
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = 'LOGIN';
        }
        
        if (data.success) {
          // Store user info in localStorage (optional, session is primary)
          localStorage.setItem('user', JSON.stringify(data.user));
          
          showAlert('Login successful! Redirecting...', 'success');
          
          // Redirect based on user role
          setTimeout(() => {
            if (data.user.role === 'admin') {
              window.location.href = '/admin.html';
            } else {
              window.location.href = '/examplepg.html';
            }
          }, 1000);
        } else {
          showAlert(data.message || data.error || 'Login failed. Please try again.', 'error');
        }
        
      } catch (error) {
        console.error('Login error:', error);
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = 'LOGIN';
        }
        showAlert('An error occurred. Please try again later.', 'error');
      }
    });
  }
  
  // Check if there's a success message from registration
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('verified') === 'true' && alertBox) {
    showAlert('Email verified successfully! You can now log in.', 'success');
  }
});

// ==================== REGISTRATION FUNCTIONALITY ====================

// Handle registration link (if you have one)
const registerLink = document.getElementById('register-link');
if (registerLink) {
  registerLink.addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = 'register.html';
  });
}

// Handle registration form submission (if you have a registration page)
const registerForm = document.querySelector('.register-section form');
if (registerForm) {
  registerForm.addEventListener('submit', function(event) {
    event.preventDefault();
    // Add validation logic here (e.g., check if passwords match)
    alert('Registration successful! Redirect to login or dashboard.');
  });
}

// Handle login link from registration page
const loginLink = document.getElementById('login-link');
if (loginLink) {
  loginLink.addEventListener('click', function(event) {
    // Optional: Add custom behavior
  });
}