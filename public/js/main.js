// Main Application Module
class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.notifications = [];
        this.initializeEventListeners();
        this.initializeApp();
    }

    initializeEventListeners() {
        // Navigation menu click handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                e.preventDefault();
                const link = e.target.closest('.nav-link');
                const section = link.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.switchSection(e.state.section, false);
            }
        });

        // Handle escape key for closing modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Handle window resize for responsive charts
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            showNotification('Connection lost', 'warning');
        });
    }

    initializeApp() {
        // Set initial section based on URL hash
        const hash = window.location.hash.substring(1);
        if (hash && ['dashboard', 'scenarios', 'campaigns', 'analytics', 'training'].includes(hash)) {
            this.currentSection = hash;
        }

        // Update UI for initial section
        this.updateNavigationState();
        this.triggerSectionChange(this.currentSection);

        // Show welcome message for first-time users
        this.checkFirstTimeUser();

        // Initialize service worker for offline functionality
        this.initializeServiceWorker();

        console.log('🔒 Adaptive Social Engineering Attack Simulator initialized');
    }

    switchSection(section, updateHistory = true) {
        if (section === this.currentSection) return;

        // Validate section
        if (!['dashboard', 'scenarios', 'campaigns', 'analytics', 'training'].includes(section)) {
            console.error('Invalid section:', section);
            return;
        }

        // Check authentication for protected sections
        if (this.requiresAuthentication(section) && !this.isAuthenticated()) {
            showLoginModal();
            return;
        }

        // Hide current section
        const currentSectionEl = document.getElementById(this.currentSection);
        if (currentSectionEl) {
            currentSectionEl.classList.remove('active');
        }

        // Show new section
        const newSectionEl = document.getElementById(section);
        if (newSectionEl) {
            newSectionEl.classList.add('active');
        }

        // Update state
        this.currentSection = section;

        // Update URL and history
        if (updateHistory) {
            const url = `${window.location.pathname}#${section}`;
            window.history.pushState({ section }, '', url);
        }

        // Update navigation
        this.updateNavigationState();

        // Trigger section change event
        this.triggerSectionChange(section);

        // Cleanup previous section resources
        this.cleanupPreviousSection();
    }

    updateNavigationState() {
        // Update active navigation link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === this.currentSection) {
                link.classList.add('active');
            }
        });

        // Update page title
        const sectionTitles = {
            dashboard: 'Dashboard - Security Simulator',
            scenarios: 'Attack Scenarios - Security Simulator',
            campaigns: 'Phishing Campaigns - Security Simulator',
            analytics: 'Training Analytics - Security Simulator',
            training: 'Interactive Training - Security Simulator'
        };

        document.title = sectionTitles[this.currentSection] || 'Adaptive Social Engineering Attack Simulator';
    }

    triggerSectionChange(section) {
        const event = new CustomEvent('sectionChanged', {
            detail: { section, previousSection: this.currentSection }
        });
        document.dispatchEvent(event);
    }

    requiresAuthentication(section) {
        // All sections except dashboard require authentication for full functionality
        return ['scenarios', 'campaigns', 'analytics', 'training'].includes(section);
    }

    isAuthenticated() {
        return window.authManager && window.authManager.isAuthenticated();
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    handleWindowResize() {
        // Trigger chart resize if analytics manager exists
        if (window.analyticsManager && window.analyticsManager.charts) {
            Object.values(window.analyticsManager.charts).forEach(chart => {
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
        }
    }

    cleanupPreviousSection() {
        // Cleanup section-specific resources
        if (window.analyticsManager && this.currentSection !== 'analytics') {
            // Cleanup charts when leaving analytics section
            setTimeout(() => {
                if (this.currentSection !== 'analytics') {
                    // Only cleanup if we're still not in analytics section
                    // This prevents cleanup when quickly switching back
                }
            }, 5000);
        }
    }

    checkFirstTimeUser() {
        const isFirstTime = !localStorage.getItem('app_visited');
        if (isFirstTime) {
            localStorage.setItem('app_visited', 'true');
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 1000);
        }
    }

    showWelcomeMessage() {
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'modal active';
        welcomeModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🎉 Welcome to the Security Simulator!</h2>
                </div>
                <div class="modal-body">
                    <div class="welcome-content">
                        <p>Welcome to your comprehensive cybersecurity training platform!</p>
                        
                        <h3>🚀 Getting Started</h3>
                        <ol>
                            <li><strong>Create an account</strong> or log in to track your progress</li>
                            <li><strong>Start with training scenarios</strong> to learn the basics</li>
                            <li><strong>Practice regularly</strong> to improve your security awareness</li>
                            <li><strong>Monitor your progress</strong> in the analytics section</li>
                        </ol>

                        <h3>🎯 Features</h3>
                        <ul>
                            <li>Interactive phishing simulations</li>
                            <li>Social engineering attack scenarios</li>
                            <li>Real-time feedback and scoring</li>
                            <li>Detailed analytics and reporting</li>
                            <li>Campaign management tools</li>
                        </ul>

                        <div class="welcome-actions">
                            <button class="btn-primary" onclick="this.closest('.modal').remove(); showLoginModal();">
                                <i class="fas fa-sign-in-alt"></i> Get Started
                            </button>
                            <button class="btn-secondary" onclick="this.closest('.modal').remove();">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(welcomeModal);
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Export application data
    exportAppData() {
        const appData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            userProgress: window.authManager?.getUserProgress(),
            currentSection: this.currentSection,
            notifications: this.notifications,
            localStorage: this.getLocalStorageData()
        };

        const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-simulator-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Application data exported successfully', 'success');
    }

    getLocalStorageData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('app_') || key.startsWith('user_') || key.startsWith('auth_')) {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    }

    // Reset application state
    resetApp() {
        if (confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
            // Clear localStorage
            const keysToKeep = ['app_visited']; // Keep welcome message state
            Object.keys(localStorage).forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });

            // Reset managers
            if (window.authManager) {
                window.authManager.logout();
            }

            // Reload page
            window.location.reload();
        }
    }

    // Performance monitoring
    trackPerformance() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            
            console.log(`App load time: ${Math.round(loadTime)}ms`);
            
            // Track section load times
            const sectionLoadStart = performance.now();
            document.addEventListener('sectionChanged', (e) => {
                const sectionLoadTime = performance.now() - sectionLoadStart;
                console.log(`Section ${e.detail.section} load time: ${Math.round(sectionLoadTime)}ms`);
            }, { once: true });
        }
    }
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.closest('.notification').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);

    // Store notification in app instance
    if (window.app) {
        window.app.notifications.push({
            message,
            type,
            timestamp: new Date().toISOString()
        });

        // Keep only last 50 notifications
        if (window.app.notifications.length > 50) {
            window.app.notifications = window.app.notifications.slice(-50);
        }
    }
}

// Global utility functions
function switchSection(section) {
    if (window.app) {
        window.app.switchSection(section);
    }
}

function getCurrentSection() {
    return window.app ? window.app.currentSection : 'dashboard';
}

function isAuthenticated() {
    return window.authManager && window.authManager.isAuthenticated();
}

function hasRole(roles) {
    return window.authManager && window.authManager.hasRole(roles);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when no input is focused
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable) {
        return;
    }

    // Alt + number keys for quick navigation
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                switchSection('dashboard');
                break;
            case '2':
                e.preventDefault();
                switchSection('scenarios');
                break;
            case '3':
                e.preventDefault();
                switchSection('campaigns');
                break;
            case '4':
                e.preventDefault();
                switchSection('analytics');
                break;
            case '5':
                e.preventDefault();
                switchSection('training');
                break;
        }
    }

    // Ctrl + shortcuts
    if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
            case 'k': // Ctrl+K for search (future feature)
                e.preventDefault();
                showNotification('Search feature coming soon!', 'info');
                break;
            case 'e': // Ctrl+E for export
                e.preventDefault();
                if (window.app) {
                    window.app.exportAppData();
                }
                break;
        }
    }
});

// Progressive Web App support
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    showNotification('Install this app for the best experience!', 'info', 10000);
});

window.addEventListener('appinstalled', () => {
    showNotification('App installed successfully!', 'success');
    deferredPrompt = null;
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    showNotification('An unexpected error occurred. Please refresh the page if problems persist.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('A network error occurred. Please check your connection.', 'warning');
});

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Track performance
    window.app.trackPerformance();
    
    // Add some helpful console messages
    console.log('%c🔒 Adaptive Social Engineering Attack Simulator', 'color: #00d4ff; font-size: 16px; font-weight: bold;');
    console.log('%cWelcome to your cybersecurity training platform!', 'color: #666; font-size: 14px;');
    console.log('%cKeyboard shortcuts:', 'color: #333; font-weight: bold;');
    console.log('%c  Alt+1-5: Navigate between sections', 'color: #666;');
    console.log('%c  Ctrl+E: Export data', 'color: #666;');
    console.log('%c  Escape: Close modals', 'color: #666;');
});

// Additional CSS for features not covered in main.css
const additionalStyles = `
/* Welcome Modal Styles */
.welcome-content {
    text-align: left;
}

.welcome-content h3 {
    color: #1e3c72;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.welcome-content ol,
.welcome-content ul {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
}

.welcome-content li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
}

.welcome-actions {
    margin-top: 2rem;
    text-align: center;
    display: flex;
    gap: 1rem;
    justify-content: center;
}

/* Category Progress Styles */
.category-progress {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}

.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.category-name {
    font-weight: 600;
    color: #333;
}

.category-stats {
    font-size: 0.9rem;
    color: #666;
}

.category-percentage {
    text-align: right;
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
}

/* Achievement Styles */
.achievement-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}

.achievement-item.earned {
    background: #d4edda;
    border: 1px solid #c3e6cb;
}

.achievement-item.locked {
    opacity: 0.6;
}

.achievement-icon {
    font-size: 2rem;
    width: 50px;
    text-align: center;
}

.achievement-content {
    flex: 1;
}

.achievement-content h4 {
    margin: 0 0 0.25rem 0;
    color: #333;
}

.achievement-content p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
}

.achievement-earned,
.achievement-locked {
    font-size: 1.5rem;
    width: 30px;
    text-align: center;
}

/* Recommendation Styles */
.recommendation-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}

.recommendation-icon {
    font-size: 2rem;
    width: 50px;
    text-align: center;
}

.recommendation-content {
    flex: 1;
}

.recommendation-content h4 {
    margin: 0 0 0.5rem 0;
    color: #856404;
}

.recommendation-content p {
    margin: 0 0 1rem 0;
    color: #856404;
    font-size: 0.9rem;
}

/* Session History Table */
.sessions-table {
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-header,
.table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    align-items: center;
}

.table-header {
    background: #1e3c72;
    color: white;
    font-weight: 600;
}

.table-row {
    border-bottom: 1px solid #eee;
}

.table-row:hover {
    background: #f8f9fa;
}

.score-high { color: #28a745; }
.score-medium { color: #ffc107; }
.score-low { color: #dc3545; }

/* Feature Grid */
.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.feature-card,
.feature-item {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: transform 0.3s ease;
}

.feature-card:hover,
.feature-item:hover {
    transform: translateY(-5px);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.feature-card h3,
.feature-item h4 {
    color: #1e3c72;
    margin-bottom: 1rem;
}

.feature-card p,
.feature-item p {
    color: #666;
    line-height: 1.6;
}

/* Category Cards */
.category-card {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.category-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.category-difficulty {
    margin: 1rem 0;
}

/* Quick Modules */
.quick-modules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.quick-module {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
}

.quick-module:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.module-type {
    font-size: 0.8rem;
    font-weight: 600;
    color: #00d4ff;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.module-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    font-size: 0.9rem;
}

.module-duration {
    color: #666;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);