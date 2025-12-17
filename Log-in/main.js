// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get form values
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      
      // Simple validation
      if (!username || !password) {
        alert('Please enter both username and password');
        return;
      }
      
      // Hardcoded credentials (for testing)
      const validUsername = 'admin';
      const validPassword = 'admin123';
      
      if (username === validUsername && password === validPassword) {
        // Store username in sessionStorage
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        alert('Login successful!');
        window.location.href = '../examplepg.html';
      } else {
        alert('Invalid username or password! Please try again.');
      }
    });
  }
});

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