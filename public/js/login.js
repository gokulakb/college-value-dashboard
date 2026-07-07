document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if already logged in
    fetch('/api/auth/me', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data && data.data.user) {
            const user = data.data.user;
            if (user.role === 'college') {
                window.location.href = '/college-dashboard.html';
            } else if (user.role === 'admin') {
                window.location.href = '/admin-dashboard.html';
            }
        }
    })
    .catch(() => {});
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }
        
        // Hide any previous error
        errorMessage.style.display = 'none';
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showError(data.error || 'Login failed. Please check your credentials.');
                return;
            }
            
            if (data.success && data.data && data.data.user) {
                const user = data.data.user;
                if (user.role === 'college') {
                    window.location.href = '/college-dashboard.html';
                } else if (user.role === 'admin') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    showError('Unknown user role. Please contact support.');
                }
            } else {
                showError('Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred. Please try again.');
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    // Handle Enter key press
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});