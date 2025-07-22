// Dashboard Management Module
class DashboardManager {
    constructor() {
        this.dashboardData = null;
        this.refreshInterval = null;
        this.socket = null;
        this.initializeEventListeners();
        this.initializeSocket();
    }

    initializeEventListeners() {
        // Auto-refresh every 30 seconds when dashboard is active
        this.startAutoRefresh();
        
        // Listen for section changes
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'dashboard') {
                this.loadDashboardData();
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
    }

    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to real-time updates');
            });

            this.socket.on('dashboard-update', (data) => {
                this.updateDashboardStats(data);
            });

            this.socket.on('new-vulnerability', (data) => {
                this.addVulnerabilityAlert(data);
            });

            this.socket.on('simulation-completed', (data) => {
                this.handleSimulationComplete(data);
            });
        }
    }

    async loadDashboardData() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            this.showGuestDashboard();
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            
            // Load dashboard analytics
            const analyticsResponse = await fetch('/api/analytics/dashboard', { headers });
            
            if (analyticsResponse.ok) {
                this.dashboardData = await analyticsResponse.json();
                this.updateDashboardDisplay();
            } else if (analyticsResponse.status === 403) {
                // User doesn't have permission for full analytics
                this.showUserDashboard();
            } else {
                throw new Error('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            showNotification('Failed to load dashboard data', 'error');
            this.showErrorDashboard();
        }
    }

    updateDashboardDisplay() {
        if (!this.dashboardData) return;

        // Update statistics cards
        this.updateStatsCards();
        
        // Update vulnerability trends
        this.updateVulnerabilityList();
        
        // Update top performers
        this.updateTopPerformers();
        
        // Update charts if available
        this.updateTrendCharts();
    }

    updateStatsCards() {
        const stats = this.dashboardData;
        
        // Total Users
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl && stats.totalUsers) {
            this.animateCountUp(totalUsersEl, stats.totalUsers.count || 0);
        }

        // Active Simulations
        const activeSimsEl = document.getElementById('activeSimulations');
        if (activeSimsEl && stats.activeSimulations) {
            this.animateCountUp(activeSimsEl, stats.activeSimulations.count || 0);
        }

        // Completed Simulations
        const completedSimsEl = document.getElementById('completedSimulations');
        if (completedSimsEl && stats.completedSimulations) {
            this.animateCountUp(completedSimsEl, stats.completedSimulations.count || 0);
        }

        // Average Score
        const avgScoreEl = document.getElementById('averageScore');
        if (avgScoreEl && stats.averageScore) {
            const score = Math.round(stats.averageScore.average || 0);
            this.animateCountUp(avgScoreEl, score, '%');
        }
    }

    updateVulnerabilityList() {
        const container = document.getElementById('recentVulnerabilities');
        if (!container) return;

        const vulnerabilities = this.generateMockVulnerabilities(); // In real app, this would come from API
        
        container.innerHTML = vulnerabilities.map(vuln => `
            <div class="vulnerability-item">
                <h4>${vuln.type}</h4>
                <p>${vuln.description}</p>
                <small>Detected: ${vuln.detectedAt}</small>
            </div>
        `).join('');
    }

    updateTopPerformers() {
        const container = document.getElementById('topPerformers');
        if (!container) return;

        const performers = this.generateMockPerformers(); // In real app, this would come from API
        
        container.innerHTML = performers.map((performer, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${performer.name}</div>
                <div class="leaderboard-score">${performer.score}%</div>
            </div>
        `).join('');
    }

    updateTrendCharts() {
        if (!this.dashboardData.vulnerabilityTrends) return;

        const trends = this.dashboardData.vulnerabilityTrends;
        
        // Create a simple trend visualization
        const container = document.querySelector('.dashboard-grid');
        
        if (trends.length > 0) {
            const trendCard = document.createElement('div');
            trendCard.className = 'card';
            trendCard.innerHTML = `
                <div class="card-header">
                    <h3><i class="fas fa-chart-area"></i> Security Trends (30 Days)</h3>
                </div>
                <div class="card-content">
                    <div class="trend-chart">
                        ${trends.map(trend => `
                            <div class="trend-item">
                                <span class="trend-date">${new Date(trend.date).toLocaleDateString()}</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${Math.min(trend.avg_score, 100)}%"></div>
                                </div>
                                <span class="trend-score">${Math.round(trend.avg_score)}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Replace existing trend card if it exists
            const existingTrend = container.querySelector('.trend-chart');
            if (existingTrend) {
                existingTrend.closest('.card').replaceWith(trendCard);
            } else {
                container.appendChild(trendCard);
            }
        }
    }

    showGuestDashboard() {
        // Show limited dashboard for non-authenticated users
        const statsCards = document.querySelectorAll('.stat-card h3');
        statsCards.forEach(card => card.textContent = '?');
        
        const recentVulns = document.getElementById('recentVulnerabilities');
        if (recentVulns) {
            recentVulns.innerHTML = `
                <div class="vulnerability-item">
                    <h4>Authentication Required</h4>
                    <p>Please log in to view detailed security analytics and training data.</p>
                </div>
            `;
        }

        const topPerformers = document.getElementById('topPerformers');
        if (topPerformers) {
            topPerformers.innerHTML = `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">?</div>
                    <div class="leaderboard-name">Login to view leaderboard</div>
                    <div class="leaderboard-score">-</div>
                </div>
            `;
        }
    }

    showUserDashboard() {
        // Show personalized dashboard for regular users
        const userProgress = window.authManager.getUserProgress();
        if (!userProgress) return;

        // Update with user-specific data
        document.getElementById('totalUsers').textContent = '1';
        document.getElementById('activeSimulations').textContent = '0';
        document.getElementById('completedSimulations').textContent = userProgress.completedScenarios;
        document.getElementById('averageScore').textContent = userProgress.securityScore + '%';

        // Show personal achievements
        const recentVulns = document.getElementById('recentVulnerabilities');
        if (recentVulns) {
            recentVulns.innerHTML = `
                <div class="vulnerability-item">
                    <h4>Personal Progress</h4>
                    <p>You've completed ${userProgress.completedScenarios} training scenarios with an average security score of ${userProgress.securityScore}%.</p>
                </div>
            `;
        }

        const topPerformers = document.getElementById('topPerformers');
        if (topPerformers) {
            topPerformers.innerHTML = `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">★</div>
                    <div class="leaderboard-name">${userProgress.username}</div>
                    <div class="leaderboard-score">${userProgress.securityScore}%</div>
                </div>
            `;
        }
    }

    showErrorDashboard() {
        const statsCards = document.querySelectorAll('.stat-card h3');
        statsCards.forEach(card => card.textContent = 'Error');
        
        const recentVulns = document.getElementById('recentVulnerabilities');
        if (recentVulns) {
            recentVulns.innerHTML = `
                <div class="vulnerability-item">
                    <h4>Connection Error</h4>
                    <p>Unable to load dashboard data. Please check your connection and try again.</p>
                </div>
            `;
        }
    }

    animateCountUp(element, targetValue, suffix = '') {
        const startValue = 0;
        const duration = 1000; // 1 second
        const stepTime = 50; // 50ms intervals
        const steps = duration / stepTime;
        const increment = (targetValue - startValue) / steps;
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.round(currentValue) + suffix;
        }, stepTime);
    }

    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        this.refreshInterval = setInterval(() => {
            const currentSection = document.querySelector('.content-section.active')?.id;
            if (currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    updateDashboardStats(data) {
        // Real-time updates from socket
        if (data.totalUsers !== undefined) {
            const el = document.getElementById('totalUsers');
            if (el) this.animateCountUp(el, data.totalUsers);
        }
        
        if (data.activeSimulations !== undefined) {
            const el = document.getElementById('activeSimulations');
            if (el) this.animateCountUp(el, data.activeSimulations);
        }
        
        if (data.completedSimulations !== undefined) {
            const el = document.getElementById('completedSimulations');
            if (el) this.animateCountUp(el, data.completedSimulations);
        }
        
        if (data.averageScore !== undefined) {
            const el = document.getElementById('averageScore');
            if (el) this.animateCountUp(el, Math.round(data.averageScore), '%');
        }
    }

    addVulnerabilityAlert(vulnerability) {
        const container = document.getElementById('recentVulnerabilities');
        if (!container) return;

        const vulnElement = document.createElement('div');
        vulnElement.className = 'vulnerability-item';
        vulnElement.innerHTML = `
            <h4>${vulnerability.type}</h4>
            <p>${vulnerability.description}</p>
            <small>Just detected</small>
        `;
        
        // Add to top of list
        container.insertBefore(vulnElement, container.firstChild);
        
        // Limit to 5 items
        const items = container.querySelectorAll('.vulnerability-item');
        if (items.length > 5) {
            items[items.length - 1].remove();
        }
        
        // Highlight new item
        vulnElement.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
            vulnElement.style.backgroundColor = '';
        }, 3000);
    }

    handleSimulationComplete(data) {
        // Update completion count
        const completedEl = document.getElementById('completedSimulations');
        if (completedEl) {
            const current = parseInt(completedEl.textContent) || 0;
            this.animateCountUp(completedEl, current + 1);
        }
        
        // Show notification
        showNotification(`Training simulation completed by ${data.username}`, 'info');
    }

    generateMockVulnerabilities() {
        return [
            {
                type: 'Phishing Click',
                description: 'User clicked suspicious link in training email',
                detectedAt: '2 minutes ago'
            },
            {
                type: 'Credential Disclosure',
                description: 'Training participant entered credentials on fake site',
                detectedAt: '15 minutes ago'
            },
            {
                type: 'Social Engineering Success',
                description: 'Phone pretexting scenario completed successfully',
                detectedAt: '1 hour ago'
            }
        ];
    }

    generateMockPerformers() {
        return [
            { name: 'Sarah Chen', score: 95 },
            { name: 'Mike Rodriguez', score: 92 },
            { name: 'Alex Thompson', score: 88 },
            { name: 'Lisa Wang', score: 85 },
            { name: 'David Kim', score: 82 }
        ];
    }

    // Method to refresh dashboard data manually
    refresh() {
        this.loadDashboardData();
        showNotification('Dashboard refreshed', 'info');
    }

    // Export dashboard data for reporting
    exportData() {
        if (!this.dashboardData) {
            showNotification('No data to export', 'warning');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            statistics: this.dashboardData,
            userProgress: window.authManager?.getUserProgress()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Dashboard data exported', 'success');
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    
    // Load initial dashboard data
    setTimeout(() => {
        window.dashboardManager.loadDashboardData();
    }, 500);
});