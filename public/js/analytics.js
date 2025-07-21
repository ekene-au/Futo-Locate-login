// Analytics Management Module
class AnalyticsManager {
    constructor() {
        this.userAnalytics = null;
        this.charts = {};
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Listen for section changes
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'analytics') {
                this.loadAnalytics();
            }
        });
    }

    async loadAnalytics() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            this.showGuestAnalytics();
            return;
        }

        try {
            await this.loadUserAnalytics();
            this.displayAnalytics();
        } catch (error) {
            console.error('Analytics load error:', error);
            showNotification('Failed to load analytics', 'error');
            this.showErrorAnalytics();
        }
    }

    showGuestAnalytics() {
        const container = document.getElementById('personalAnalytics');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-guest">
                <div class="guest-content">
                    <h3>📊 Security Training Analytics</h3>
                    <p>Track your cybersecurity training progress and identify areas for improvement.</p>
                    
                    <div class="analytics-features">
                        <div class="feature-grid">
                            <div class="feature-item">
                                <div class="feature-icon">📈</div>
                                <h4>Progress Tracking</h4>
                                <p>Monitor your completion rate and security scores across all training modules.</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">🎯</div>
                                <h4>Vulnerability Analysis</h4>
                                <p>Identify weak points in your security awareness and focus your training efforts.</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">🏆</div>
                                <h4>Achievement System</h4>
                                <p>Earn badges and certifications as you master different security concepts.</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">📊</div>
                                <h4>Detailed Reports</h4>
                                <p>Access comprehensive reports on your training performance and improvements.</p>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-cta">
                        <button class="btn-primary" onclick="showLoginModal()">
                            <i class="fas fa-sign-in-alt"></i> Login to View Analytics
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showErrorAnalytics() {
        const container = document.getElementById('personalAnalytics');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-error">
                <h3>⚠️ Unable to Load Analytics</h3>
                <p>There was an error loading your training analytics. Please try again later.</p>
                <button class="btn-primary" onclick="analyticsManager.loadAnalytics()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }

    async loadUserAnalytics() {
        const userId = window.authManager.user.id;
        const headers = window.authManager.getAuthHeaders();
        
        const response = await fetch(`/api/analytics/user/${userId}`, { headers });
        
        if (response.ok) {
            this.userAnalytics = await response.json();
        } else {
            throw new Error('Failed to load user analytics');
        }
    }

    displayAnalytics() {
        this.displayPersonalSummary();
        this.displayProgressChart();
        this.displayVulnerabilityChart();
        this.displaySessionHistory();
    }

    displayPersonalSummary() {
        const userProgress = window.authManager.getUserProgress();
        const analyticsContainer = document.getElementById('personalAnalytics');
        
        if (!analyticsContainer) return;

        const summaryHtml = `
            <div class="analytics-summary">
                <div class="analytics-metric">
                    <h4>${userProgress.completedScenarios}</h4>
                    <p>Scenarios Completed</p>
                </div>
                <div class="analytics-metric">
                    <h4>${userProgress.securityScore}%</h4>
                    <p>Security Score</p>
                </div>
                <div class="analytics-metric">
                    <h4>${this.calculateTotalTrainingTime()}</h4>
                    <p>Training Hours</p>
                </div>
                <div class="analytics-metric">
                    <h4>${this.getSecurityLevel()}</h4>
                    <p>Security Level</p>
                </div>
            </div>

            <div class="progress-overview">
                <h3>🎯 Training Progress Overview</h3>
                <div class="progress-categories">
                    ${this.generateCategoryProgress()}
                </div>
            </div>

            <div class="recent-achievements">
                <h3>🏆 Recent Achievements</h3>
                <div class="achievements-list">
                    ${this.generateAchievements()}
                </div>
            </div>

            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <div class="recommendations-list">
                    ${this.generateRecommendations()}
                </div>
            </div>
        `;

        analyticsContainer.innerHTML = summaryHtml;
    }

    displayProgressChart() {
        const chartContainer = document.getElementById('progressChart');
        if (!chartContainer || !window.Chart) return;

        // Clear existing chart
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        const ctx = chartContainer.getContext('2d');
        const progressData = this.generateProgressData();

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: progressData.labels,
                datasets: [{
                    label: 'Security Score',
                    data: progressData.scores,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Security Score Progress Over Time'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    displayVulnerabilityChart() {
        const chartContainer = document.getElementById('vulnerabilityChart');
        if (!chartContainer || !window.Chart) return;

        // Clear existing chart
        if (this.charts.vulnerability) {
            this.charts.vulnerability.destroy();
        }

        const ctx = chartContainer.getContext('2d');
        const vulnerabilityData = this.generateVulnerabilityData();

        this.charts.vulnerability = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: vulnerabilityData.labels,
                datasets: [{
                    data: vulnerabilityData.values,
                    backgroundColor: [
                        '#ff6b6b',
                        '#ffa726',
                        '#66bb6a',
                        '#42a5f5',
                        '#ab47bc'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Vulnerability Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    displaySessionHistory() {
        if (!this.userAnalytics || !this.userAnalytics.sessions) return;

        const sessions = this.userAnalytics.sessions.slice(0, 10); // Show last 10 sessions
        
        const historyHtml = `
            <div class="session-history">
                <h3>📝 Recent Training Sessions</h3>
                <div class="sessions-table">
                    <div class="table-header">
                        <div class="col-scenario">Scenario</div>
                        <div class="col-type">Type</div>
                        <div class="col-difficulty">Difficulty</div>
                        <div class="col-score">Score</div>
                        <div class="col-date">Date</div>
                        <div class="col-actions">Actions</div>
                    </div>
                    ${sessions.map(session => this.generateSessionRow(session)).join('')}
                </div>
            </div>
        `;

        const container = document.getElementById('personalAnalytics');
        if (container) {
            container.insertAdjacentHTML('beforeend', historyHtml);
        }
    }

    generateSessionRow(session) {
        const completedDate = session.completed_at ? 
            new Date(session.completed_at).toLocaleDateString() : 'In Progress';
        
        const scoreClass = session.score >= 80 ? 'score-high' : 
                          session.score >= 60 ? 'score-medium' : 'score-low';

        return `
            <div class="table-row">
                <div class="col-scenario">${session.scenario_name}</div>
                <div class="col-type">
                    <span class="type-badge">${session.type.replace('_', ' ')}</span>
                </div>
                <div class="col-difficulty">
                    <span class="difficulty-badge difficulty-${session.difficulty}">${session.difficulty}</span>
                </div>
                <div class="col-score">
                    <span class="score ${scoreClass}">${session.score || 0}%</span>
                </div>
                <div class="col-date">${completedDate}</div>
                <div class="col-actions">
                    <button class="btn-small" onclick="analyticsManager.viewSessionDetails('${session.session_id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${session.completed_at ? `
                        <button class="btn-small" onclick="analyticsManager.retryScenario(${session.scenario_id})">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    calculateTotalTrainingTime() {
        // Mock calculation - in real app, this would be tracked
        const completedScenarios = window.authManager.getUserProgress().completedScenarios;
        const avgTimePerScenario = 0.25; // 15 minutes average
        return Math.round(completedScenarios * avgTimePerScenario * 10) / 10; // Round to 1 decimal
    }

    getSecurityLevel() {
        const score = window.authManager.getUserProgress().securityScore;
        if (score >= 90) return 'Expert';
        if (score >= 75) return 'Advanced';
        if (score >= 60) return 'Intermediate';
        if (score >= 40) return 'Beginner';
        return 'Novice';
    }

    generateCategoryProgress() {
        const categories = [
            { name: 'Phishing Detection', progress: 85, total: 12, completed: 10 },
            { name: 'Pretexting Defense', progress: 60, total: 8, completed: 5 },
            { name: 'Physical Security', progress: 40, total: 6, completed: 2 },
            { name: 'Advanced Threats', progress: 20, total: 10, completed: 2 }
        ];

        return categories.map(category => `
            <div class="category-progress">
                <div class="category-header">
                    <span class="category-name">${category.name}</span>
                    <span class="category-stats">${category.completed}/${category.total}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${category.progress}%"></div>
                </div>
                <div class="category-percentage">${category.progress}%</div>
            </div>
        `).join('');
    }

    generateAchievements() {
        const achievements = [
            { icon: '🏆', title: 'Phishing Master', description: 'Successfully identified 10 phishing attempts', earned: true },
            { icon: '🛡️', title: 'Security Defender', description: 'Completed 5 training scenarios', earned: true },
            { icon: '🎯', title: 'Perfect Score', description: 'Achieved 100% on any scenario', earned: false },
            { icon: '📚', title: 'Knowledge Seeker', description: 'Completed beginner level training', earned: true }
        ];

        return achievements.map(achievement => `
            <div class="achievement-item ${achievement.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                </div>
                ${achievement.earned ? '<div class="achievement-earned">✓</div>' : '<div class="achievement-locked">🔒</div>'}
            </div>
        `).join('');
    }

    generateRecommendations() {
        const userProgress = window.authManager.getUserProgress();
        const recommendations = [];

        if (userProgress.securityScore < 70) {
            recommendations.push({
                icon: '📧',
                title: 'Focus on Phishing Detection',
                description: 'Your phishing detection skills could use improvement. Try the beginner phishing scenarios.',
                action: 'Start Phishing Training',
                actionFn: 'trainingManager.showCategoryScenarios("phishing")'
            });
        }

        if (userProgress.completedScenarios < 5) {
            recommendations.push({
                icon: '🎯',
                title: 'Complete More Scenarios',
                description: 'Regular practice is key to building security awareness. Aim for at least 10 completed scenarios.',
                action: 'Browse Scenarios',
                actionFn: 'switchSection("scenarios")'
            });
        }

        if (userProgress.securityScore >= 80) {
            recommendations.push({
                icon: '🚀',
                title: 'Try Advanced Scenarios',
                description: 'You\'re doing great! Challenge yourself with advanced and expert level scenarios.',
                action: 'Advanced Training',
                actionFn: 'trainingManager.showCategoryScenarios("spear_phishing")'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                icon: '✨',
                title: 'Keep Up the Great Work!',
                description: 'You\'re making excellent progress. Continue with regular training to maintain your skills.',
                action: 'Continue Training',
                actionFn: 'switchSection("training")'
            });
        }

        return recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-icon">${rec.icon}</div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <button class="btn-primary btn-small" onclick="${rec.actionFn}">
                        ${rec.action}
                    </button>
                </div>
            </div>
        `).join('');
    }

    generateProgressData() {
        // Mock data - in real app, this would come from API
        const labels = [];
        const scores = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate mock score progression
            const baseScore = window.authManager.getUserProgress().securityScore;
            const variation = Math.random() * 20 - 10; // ±10 variation
            scores.push(Math.max(0, Math.min(100, baseScore + variation)));
        }

        return { labels, scores };
    }

    generateVulnerabilityData() {
        // Mock vulnerability distribution data
        return {
            labels: ['Phishing Clicks', 'Credential Disclosure', 'Social Engineering', 'Physical Security', 'Other'],
            values: [45, 25, 15, 10, 5]
        };
    }

    viewSessionDetails(sessionId) {
        const session = this.userAnalytics?.sessions?.find(s => s.session_id === sessionId);
        if (!session) {
            showNotification('Session details not found', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>📊 Session Details</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="session-details">
                        <div class="session-overview">
                            <h3>${session.scenario_name}</h3>
                            <div class="session-meta">
                                <span class="type-badge">${session.type.replace('_', ' ')}</span>
                                <span class="difficulty-badge difficulty-${session.difficulty}">${session.difficulty}</span>
                                <span class="score-badge">Score: ${session.score || 0}%</span>
                            </div>
                        </div>

                        <div class="session-timeline">
                            <h4>📅 Session Timeline</h4>
                            <div class="timeline-item">
                                <strong>Started:</strong> ${new Date(session.started_at).toLocaleString()}
                            </div>
                            ${session.completed_at ? `
                                <div class="timeline-item">
                                    <strong>Completed:</strong> ${new Date(session.completed_at).toLocaleString()}
                                </div>
                            ` : '<div class="timeline-item"><strong>Status:</strong> In Progress</div>'}
                        </div>

                        ${session.actions_taken && session.actions_taken.length > 0 ? `
                            <div class="session-actions">
                                <h4>🎯 Actions Taken</h4>
                                <div class="actions-list">
                                    ${session.actions_taken.map((action, index) => `
                                        <div class="action-item">
                                            <div class="action-number">${index + 1}</div>
                                            <div class="action-details">
                                                <strong>${action.action.replace('_', ' ')}</strong>
                                                <small>${new Date(action.timestamp).toLocaleTimeString()}</small>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${session.vulnerabilities_exposed && session.vulnerabilities_exposed.length > 0 ? `
                            <div class="session-vulnerabilities">
                                <h4>⚠️ Vulnerabilities Exposed</h4>
                                <div class="vulnerabilities-list">
                                    ${session.vulnerabilities_exposed.map(vuln => `
                                        <div class="vulnerability-item">
                                            <h5>${vuln.type}</h5>
                                            <p>${vuln.description}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    retryScenario(scenarioId) {
        if (window.scenarioManager) {
            window.scenarioManager.startTraining(scenarioId);
        }
    }

    exportAnalytics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            userProgress: window.authManager.getUserProgress(),
            userAnalytics: this.userAnalytics,
            progressData: this.generateProgressData(),
            vulnerabilityData: this.generateVulnerabilityData()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `training-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Analytics data exported successfully', 'success');
    }

    // Cleanup function for charts
    cleanup() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Initialize analytics manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
});