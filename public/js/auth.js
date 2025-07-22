// Authentication Module
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Check token validity on page load
        if (this.token) {
            this.validateToken();
        }
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            showNotification('Please enter both username and password', 'error');
            return;
        }

        try {
            showLoadingButton('loginForm button[type="submit"]', true);
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data);
                closeAuthModal();
                showNotification('Login successful!', 'success');
                
                // Reload dashboard data
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
            } else {
                showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Network error during login', 'error');
        } finally {
            showLoadingButton('loginForm button[type="submit"]', false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;

        if (!username || !email || !password) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            showLoadingButton('registerForm button[type="submit"]', true);
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data);
                closeAuthModal();
                showNotification('Registration successful!', 'success');
                
                // Reload dashboard data
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
            } else {
                showNotification(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Network error during registration', 'error');
        } finally {
            showLoadingButton('registerForm button[type="submit"]', false);
        }
    }

    async validateToken() {
        if (!this.token) {
            this.logout();
            return false;
        }

        try {
            const response = await fetch('/api/scenarios', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    setAuthData(data) {
        this.token = data.token;
        this.user = {
            id: data.userId,
            username: data.username,
            role: data.role,
            securityScore: data.securityScore || 0,
            completedScenarios: data.completedScenarios || 0
        };

        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.user));
        
        this.updateUI();
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        this.updateUI();
        showNotification('Logged out successfully', 'info');
        
        // Clear any sensitive data
        if (window.scenarioManager) {
            window.scenarioManager.scenarios = [];
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const usernameSpan = document.getElementById('username');
        const userRoleSpan = document.getElementById('userRole');

        if (this.isAuthenticated()) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
            usernameSpan.textContent = this.user.username;
            userRoleSpan.textContent = this.user.role;
            
            // Update role-based UI elements
            this.updateRoleBasedUI();
        } else {
            loginBtn.style.display = 'inline-flex';
            userInfo.style.display = 'none';
        }
    }

    updateRoleBasedUI() {
        const createScenarioBtn = document.querySelector('button[onclick="showCreateScenarioModal()"]');
        const createCampaignBtn = document.querySelector('button[onclick="showCreateCampaignModal()"]');
        
        if (this.user && (this.user.role === 'admin' || this.user.role === 'trainer')) {
            if (createScenarioBtn) createScenarioBtn.style.display = 'inline-flex';
            if (createCampaignBtn) createCampaignBtn.style.display = 'inline-flex';
        } else {
            if (createScenarioBtn) createScenarioBtn.style.display = 'none';
            if (createCampaignBtn) createCampaignBtn.style.display = 'none';
        }
    }

    checkAuthStatus() {
        this.updateUI();
        
        // Redirect to login if not authenticated and trying to access protected content
        if (!this.isAuthenticated()) {
            const currentSection = document.querySelector('.content-section.active')?.id;
            if (currentSection && currentSection !== 'dashboard') {
                showLoginModal();
            }
        }
    }

    isAuthenticated() {
        return this.token && this.user;
    }

    hasRole(roles) {
        if (!this.isAuthenticated()) return false;
        if (typeof roles === 'string') roles = [roles];
        return roles.includes(this.user.role);
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get user security score and progress
    getUserProgress() {
        if (!this.isAuthenticated()) return null;
        
        return {
            securityScore: this.user.securityScore,
            completedScenarios: this.user.completedScenarios,
            username: this.user.username,
            role: this.user.role
        };
    }

    // Update user progress (called after completing scenarios)
    updateUserProgress(newScore, completedCount) {
        if (this.user) {
            this.user.securityScore = newScore;
            this.user.completedScenarios = completedCount;
            localStorage.setItem('user_data', JSON.stringify(this.user));
        }
    }
}

// Authentication Modal Functions
function showLoginModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    showLogin();
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    
    // Clear form data
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authTitle = document.getElementById('authTitle');
    
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabBtns[0].classList.add('active');
    
    authTitle.textContent = 'Login to Security Simulator';
}

function showRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authTitle = document.getElementById('authTitle');
    
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabBtns[1].classList.add('active');
    
    authTitle.textContent = 'Register for Security Training';
}

function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

// Utility function for loading states
function showLoadingButton(selector, isLoading) {
    const button = document.querySelector(selector);
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<div class="loading"></div> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const authModal = document.getElementById('authModal');
    if (e.target === authModal) {
        closeAuthModal();
    }
});

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});