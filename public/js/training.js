// Training Management Module
class TrainingManager {
    constructor() {
        this.currentSimulation = null;
        this.trainingHistory = [];
        this.socket = null;
        this.initializeEventListeners();
        this.initializeSocket();
    }

    initializeEventListeners() {
        // Listen for section changes
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'training') {
                this.loadTrainingContent();
            }
        });
    }

    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('simulation-update', (data) => {
                if (this.currentSimulation && this.currentSimulation.sessionId === data.sessionId) {
                    this.handleSimulationUpdate(data);
                }
            });
        }
    }

    async loadTrainingContent() {
        const container = document.getElementById('trainingContent');
        if (!container) return;

        if (!window.authManager || !window.authManager.isAuthenticated()) {
            this.showGuestTraining(container);
            return;
        }

        // Load available scenarios for training
        await this.loadAvailableScenarios(container);
    }

    showGuestTraining(container) {
        container.innerHTML = `
            <div class="training-welcome">
                <h2>🎓 Welcome to Cybersecurity Training</h2>
                <p>Master the art of detecting and defending against social engineering attacks through immersive, hands-on simulations.</p>
                
                <div class="training-features">
                    <div class="feature-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📧</div>
                            <h3>Phishing Detection</h3>
                            <p>Learn to identify and report phishing emails with real-world examples and interactive scenarios.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📞</div>
                            <h3>Pretexting Defense</h3>
                            <p>Practice responding to social engineering phone calls and verify caller identity.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💾</div>
                            <h3>Physical Security</h3>
                            <p>Understand baiting attacks and learn proper handling of suspicious physical devices.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3>Advanced Threats</h3>
                            <p>Defend against sophisticated spear phishing and targeted attack scenarios.</p>
                        </div>
                    </div>
                </div>

                <div class="training-cta">
                    <button class="btn-primary" onclick="showLoginModal()">
                        <i class="fas fa-sign-in-alt"></i> Start Training Now
                    </button>
                    <p>Join thousands of security professionals improving their skills</p>
                </div>
            </div>
        `;
    }

    async loadAvailableScenarios(container) {
        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch('/api/scenarios', { headers });

            if (response.ok) {
                const scenarios = await response.json();
                this.displayTrainingScenarios(container, scenarios);
            } else {
                throw new Error('Failed to load scenarios');
            }
        } catch (error) {
            console.error('Training load error:', error);
            container.innerHTML = `
                <div class="training-error">
                    <h3>⚠️ Unable to Load Training Content</h3>
                    <p>There was an error loading the training scenarios. Please try again later.</p>
                    <button class="btn-primary" onclick="trainingManager.loadTrainingContent()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    displayTrainingScenarios(container, scenarios) {
        const userProgress = window.authManager.getUserProgress();
        
        container.innerHTML = `
            <div class="training-dashboard">
                <div class="training-header">
                    <h2>🎯 Interactive Training Scenarios</h2>
                    <div class="user-progress">
                        <div class="progress-stats">
                            <div class="stat">
                                <span class="stat-value">${userProgress.completedScenarios}</span>
                                <span class="stat-label">Completed</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${userProgress.securityScore}%</span>
                                <span class="stat-label">Security Score</span>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(userProgress.securityScore, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="training-categories">
                    ${this.generateCategoryCards(scenarios)}
                </div>

                <div class="quick-training">
                    <h3>🚀 Quick Training Modules</h3>
                    <div class="quick-modules">
                        ${this.generateQuickModules(scenarios)}
                    </div>
                </div>
            </div>
        `;
    }

    generateCategoryCards(scenarios) {
        const categories = {
            phishing: { icon: '📧', title: 'Phishing Detection', count: 0 },
            pretexting: { icon: '📞', title: 'Pretexting Defense', count: 0 },
            baiting: { icon: '💾', title: 'Physical Security', count: 0 },
            spear_phishing: { icon: '🎯', title: 'Advanced Threats', count: 0 }
        };

        // Count scenarios by type
        scenarios.forEach(scenario => {
            if (categories[scenario.type]) {
                categories[scenario.type].count++;
            }
        });

        return Object.entries(categories).map(([type, info]) => `
            <div class="category-card" onclick="trainingManager.showCategoryScenarios('${type}')">
                <div class="category-icon">${info.icon}</div>
                <h3>${info.title}</h3>
                <p>${info.count} scenario${info.count !== 1 ? 's' : ''} available</p>
                <div class="category-difficulty">
                    ${this.getDifficultyBadges(scenarios, type)}
                </div>
                <button class="btn-secondary">
                    <i class="fas fa-play"></i> Start Training
                </button>
            </div>
        `).join('');
    }

    getDifficultyBadges(scenarios, type) {
        const difficulties = scenarios
            .filter(s => s.type === type)
            .map(s => s.difficulty)
            .filter((v, i, a) => a.indexOf(v) === i); // unique values

        return difficulties.map(diff => 
            `<span class="difficulty-badge difficulty-${diff}">${diff}</span>`
        ).join(' ');
    }

    generateQuickModules(scenarios) {
        const quickScenarios = scenarios
            .filter(s => s.difficulty === 'beginner')
            .slice(0, 4);

        return quickScenarios.map(scenario => `
            <div class="quick-module" onclick="trainingManager.startQuickTraining(${scenario.id})">
                <div class="module-type">${scenario.type.replace('_', ' ').toUpperCase()}</div>
                <h4>${scenario.name}</h4>
                <p>${scenario.description.substring(0, 100)}...</p>
                <div class="module-meta">
                    <span class="module-duration">⏱️ 5-10 min</span>
                    <span class="difficulty-badge difficulty-${scenario.difficulty}">${scenario.difficulty}</span>
                </div>
            </div>
        `).join('');
    }

    showCategoryScenarios(type) {
        // Filter scenarios by type and show in modal or dedicated view
        if (window.scenarioManager) {
            window.scenarioManager.updateFilters('', type);
            switchSection('scenarios');
        }
    }

    async startQuickTraining(scenarioId) {
        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch('/api/simulation/start', {
                method: 'POST',
                headers,
                body: JSON.stringify({ scenarioId })
            });

            if (response.ok) {
                const simulation = await response.json();
                this.startSimulation(simulation);
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to start training', 'error');
            }
        } catch (error) {
            console.error('Quick training error:', error);
            showNotification('Failed to start training session', 'error');
        }
    }

    startSimulation(simulation) {
        this.currentSimulation = simulation;
        
        // Join simulation room for real-time updates
        if (this.socket) {
            this.socket.emit('join-simulation', simulation.sessionId);
        }

        const container = document.getElementById('trainingContent');
        container.innerHTML = this.generateTrainingInterface(simulation);
        
        // Scroll to top of training content
        container.scrollIntoView({ behavior: 'smooth' });
    }

    generateTrainingInterface(simulation) {
        const scenario = simulation.scenario;
        
        return `
            <div class="training-simulation">
                <div class="simulation-header">
                    <div class="simulation-nav">
                        <button class="btn-secondary" onclick="trainingManager.exitSimulation()">
                            <i class="fas fa-arrow-left"></i> Back to Training
                        </button>
                        <div class="simulation-info">
                            <h2>${scenario.name}</h2>
                            <div class="simulation-meta">
                                <span class="type-badge">${scenario.type.replace('_', ' ')}</span>
                                <span class="difficulty-badge difficulty-${scenario.difficulty}">${scenario.difficulty}</span>
                                <span class="session-id">Session: ${simulation.sessionId.substring(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="simulation-objectives">
                    <h3>📋 Learning Objectives</h3>
                    <p>${scenario.learning_objectives}</p>
                    <h4>Success Criteria</h4>
                    <p>${scenario.success_criteria}</p>
                </div>

                <div class="simulation-content">
                    ${this.generateScenarioContent(simulation)}
                </div>

                <div class="simulation-footer">
                    <div class="simulation-tips">
                        <h4>💡 Remember</h4>
                        <ul>
                            <li>Take your time to analyze the scenario</li>
                            <li>Look for suspicious indicators</li>
                            <li>Consider the consequences of each action</li>
                            <li>Apply security best practices</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    generateScenarioContent(simulation) {
        // Use the scenario manager's interface generation
        if (window.scenarioManager) {
            return window.scenarioManager.generateSimulationInterface(simulation);
        }
        
        // Fallback basic interface
        return `
            <div class="basic-simulation">
                <h3>${simulation.scenario.name}</h3>
                <p>${simulation.scenario.description}</p>
                <button class="btn-primary" onclick="trainingManager.completeBasicTraining('${simulation.sessionId}')">
                    Complete Training
                </button>
            </div>
        `;
    }

    async handleSimulationAction(sessionId, action, data = {}) {
        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch(`/api/simulation/${sessionId}/action`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action, data })
            });

            if (response.ok) {
                const result = await response.json();
                this.showTrainingFeedback(result.feedback);
                
                // Emit action to other connected users (trainers)
                if (this.socket) {
                    this.socket.emit('simulation-action', {
                        sessionId,
                        action,
                        data,
                        feedback: result.feedback
                    });
                }
                
                return result;
            } else {
                throw new Error('Failed to record action');
            }
        } catch (error) {
            console.error('Simulation action error:', error);
            showNotification('Failed to record action', 'error');
        }
    }

    showTrainingFeedback(feedback) {
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'training-feedback';
        
        let feedbackClass = 'info';
        if (feedback.category === 'success' || feedback.score > 0) {
            feedbackClass = 'success';
        } else if (feedback.category === 'vulnerability' || feedback.score < 0) {
            feedbackClass = 'error';
        }
        
        feedbackContainer.innerHTML = `
            <div class="feedback ${feedbackClass}">
                <div class="feedback-header">
                    <h4>📊 Training Feedback</h4>
                    <div class="feedback-score">
                        Score: ${feedback.score >= 0 ? '+' : ''}${feedback.score} points
                    </div>
                </div>
                <div class="feedback-content">
                    <p class="feedback-message">${feedback.message}</p>
                    ${feedback.recommendations.length > 0 ? `
                        <div class="feedback-recommendations">
                            <h5>💡 Key Takeaways:</h5>
                            <ul>
                                ${feedback.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="feedback-actions">
                    <button class="btn-primary" onclick="trainingManager.continueTraining()">
                        Continue Training
                    </button>
                    <button class="btn-secondary" onclick="trainingManager.reviewAction()">
                        Review Action
                    </button>
                </div>
            </div>
        `;
        
        const simulationContent = document.querySelector('.simulation-content');
        if (simulationContent) {
            simulationContent.appendChild(feedbackContainer);
            feedbackContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    continueTraining() {
        if (this.currentSimulation) {
            // Auto-complete simulation after feedback
            setTimeout(() => {
                this.completeSimulation(this.currentSimulation.sessionId);
            }, 1000);
        }
    }

    reviewAction() {
        // Show detailed explanation of the action and alternatives
        const reviewModal = document.createElement('div');
        reviewModal.className = 'modal active';
        reviewModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📖 Action Review</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <h3>What You Did</h3>
                    <p>Review the action you took and learn about better alternatives.</p>
                    
                    <h3>Security Best Practices</h3>
                    <ul>
                        <li>Always verify the identity of requesters</li>
                        <li>Use official communication channels</li>
                        <li>Report suspicious activities immediately</li>
                        <li>Never provide sensitive information without verification</li>
                    </ul>
                    
                    <h3>What You Could Do Differently</h3>
                    <p>Consider alternative approaches that would have provided better security outcomes.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(reviewModal);
    }

    async completeSimulation(sessionId) {
        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch(`/api/simulation/${sessionId}/complete`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ 
                    score: 75, // Default completion score
                    vulnerabilities: []
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showCompletionSummary(result);
                
                // Update user progress
                const userProgress = window.authManager.getUserProgress();
                if (userProgress) {
                    window.authManager.updateUserProgress(
                        result.score, 
                        userProgress.completedScenarios + 1
                    );
                }
                
                // Leave simulation room
                if (this.socket) {
                    this.socket.emit('leave-simulation', sessionId);
                }
                
                this.currentSimulation = null;
                
                // Return to training dashboard after 5 seconds
                setTimeout(() => {
                    this.loadTrainingContent();
                }, 5000);
                
            } else {
                throw new Error('Failed to complete simulation');
            }
        } catch (error) {
            console.error('Complete simulation error:', error);
            showNotification('Failed to complete training session', 'error');
        }
    }

    async completeBasicTraining(sessionId) {
        await this.completeSimulation(sessionId);
    }

    showCompletionSummary(result) {
        const container = document.getElementById('trainingContent');
        container.innerHTML = `
            <div class="completion-summary">
                <div class="completion-header">
                    <div class="completion-icon">🎉</div>
                    <h2>Training Completed!</h2>
                    <p>Congratulations on completing this security training scenario.</p>
                </div>
                
                <div class="completion-stats">
                    <div class="stat-card">
                        <div class="stat-value">${result.score}%</div>
                        <div class="stat-label">Final Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">+1</div>
                        <div class="stat-label">Scenarios Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">🏆</div>
                        <div class="stat-label">Achievement Unlocked</div>
                    </div>
                </div>
                
                <div class="completion-feedback">
                    <h3>📈 Your Progress</h3>
                    <p>You've successfully completed another step in your cybersecurity training journey. 
                       Each scenario helps build your security awareness and defensive capabilities.</p>
                </div>
                
                <div class="completion-actions">
                    <button class="btn-primary" onclick="trainingManager.loadTrainingContent()">
                        <i class="fas fa-list"></i> Back to Training
                    </button>
                    <button class="btn-secondary" onclick="switchSection('scenarios')">
                        <i class="fas fa-theater-masks"></i> More Scenarios
                    </button>
                    <button class="btn-secondary" onclick="switchSection('analytics')">
                        <i class="fas fa-chart-line"></i> View Analytics
                    </button>
                </div>
            </div>
        `;
    }

    exitSimulation() {
        if (this.currentSimulation) {
            if (confirm('Are you sure you want to exit this training session? Your progress will be lost.')) {
                this.currentSimulation = null;
                this.loadTrainingContent();
            }
        } else {
            this.loadTrainingContent();
        }
    }

    handleSimulationUpdate(data) {
        // Handle real-time updates from other participants or trainers
        console.log('Simulation update received:', data);
        
        if (data.type === 'hint') {
            this.showHint(data.content);
        } else if (data.type === 'guidance') {
            this.showGuidance(data.content);
        }
    }

    showHint(hint) {
        const hintElement = document.createElement('div');
        hintElement.className = 'training-hint';
        hintElement.innerHTML = `
            <div class="hint-content">
                <i class="fas fa-lightbulb"></i>
                <strong>Hint:</strong> ${hint}
            </div>
        `;
        
        const simulationContent = document.querySelector('.simulation-content');
        if (simulationContent) {
            simulationContent.appendChild(hintElement);
            
            // Auto-remove hint after 10 seconds
            setTimeout(() => {
                hintElement.remove();
            }, 10000);
        }
    }

    showGuidance(guidance) {
        showNotification(`Trainer guidance: ${guidance}`, 'info');
    }
}

// Initialize training manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.trainingManager = new TrainingManager();
});