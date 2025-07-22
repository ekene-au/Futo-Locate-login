// Scenarios Management Module
class ScenarioManager {
    constructor() {
        this.scenarios = [];
        this.filteredScenarios = [];
        this.currentFilter = { difficulty: '', type: '' };
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Listen for section changes
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'scenarios') {
                this.loadScenarios();
            }
        });

        // Create scenario form
        const createForm = document.getElementById('createScenarioForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateScenario();
            });
        }
    }

    async loadScenarios() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            this.showGuestScenarios();
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch('/api/scenarios', { headers });

            if (response.ok) {
                this.scenarios = await response.json();
                this.filterAndDisplayScenarios();
            } else {
                throw new Error('Failed to load scenarios');
            }
        } catch (error) {
            console.error('Scenarios load error:', error);
            showNotification('Failed to load scenarios', 'error');
            this.showErrorScenarios();
        }
    }

    filterAndDisplayScenarios() {
        this.filteredScenarios = this.scenarios.filter(scenario => {
            const difficultyMatch = !this.currentFilter.difficulty || 
                                   scenario.difficulty === this.currentFilter.difficulty;
            const typeMatch = !this.currentFilter.type || 
                             scenario.type === this.currentFilter.type;
            return difficultyMatch && typeMatch;
        });

        this.displayScenarios();
    }

    displayScenarios() {
        const container = document.getElementById('scenariosList');
        if (!container) return;

        if (this.filteredScenarios.length === 0) {
            container.innerHTML = `
                <div class="scenario-card">
                    <div class="scenario-body">
                        <h3>No scenarios found</h3>
                        <p>No scenarios match your current filters, or none have been created yet.</p>
                        ${window.authManager.hasRole(['admin', 'trainer']) ? 
                          '<button class="btn-primary" onclick="showCreateScenarioModal()">Create First Scenario</button>' : 
                          ''}
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredScenarios.map(scenario => this.createScenarioCard(scenario)).join('');
    }

    createScenarioCard(scenario) {
        const difficultyClass = `difficulty-${scenario.difficulty}`;
        const canManage = window.authManager.hasRole(['admin', 'trainer']);
        
        return `
            <div class="scenario-card" data-scenario-id="${scenario.id}">
                <div class="scenario-header">
                    <div class="scenario-title">${scenario.name}</div>
                    <div class="scenario-meta">
                        <span class="difficulty-badge ${difficultyClass}">${scenario.difficulty}</span>
                        <span class="type-badge">${scenario.type.replace('_', ' ')}</span>
                    </div>
                </div>
                <div class="scenario-body">
                    <div class="scenario-description">${scenario.description}</div>
                    <div class="scenario-objectives">
                        <strong>Learning Objectives:</strong>
                        <p>${scenario.learning_objectives}</p>
                    </div>
                    <div class="scenario-actions">
                        <button class="btn-primary btn-small" onclick="scenarioManager.startTraining(${scenario.id})">
                            <i class="fas fa-play"></i> Start Training
                        </button>
                        ${canManage ? `
                            <button class="btn-secondary btn-small" onclick="scenarioManager.editScenario(${scenario.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-danger btn-small" onclick="scenarioManager.deleteScenario(${scenario.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    showGuestScenarios() {
        const container = document.getElementById('scenariosList');
        if (!container) return;

        container.innerHTML = `
            <div class="scenario-card">
                <div class="scenario-header">
                    <div class="scenario-title">Phishing Email Demo</div>
                    <div class="scenario-meta">
                        <span class="difficulty-badge difficulty-beginner">Demo</span>
                        <span class="type-badge">phishing</span>
                    </div>
                </div>
                <div class="scenario-body">
                    <div class="scenario-description">
                        Experience a sample phishing email simulation. Learn to identify suspicious indicators
                        and practice proper security responses.
                    </div>
                    <div class="scenario-actions">
                        <button class="btn-primary btn-small" onclick="showLoginModal()">
                            <i class="fas fa-lock"></i> Login to Access Training
                        </button>
                    </div>
                </div>
            </div>
            <div class="scenario-card">
                <div class="scenario-header">
                    <div class="scenario-title">More Scenarios Available</div>
                    <div class="scenario-meta">
                        <span class="difficulty-badge difficulty-intermediate">Various</span>
                        <span class="type-badge">All Types</span>
                    </div>
                </div>
                <div class="scenario-body">
                    <div class="scenario-description">
                        Access the full library of social engineering training scenarios including
                        pretexting, baiting, spear phishing, and advanced attack simulations.
                    </div>
                    <div class="scenario-actions">
                        <button class="btn-primary btn-small" onclick="showLoginModal()">
                            <i class="fas fa-sign-in-alt"></i> Login for Full Access
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showErrorScenarios() {
        const container = document.getElementById('scenariosList');
        if (!container) return;

        container.innerHTML = `
            <div class="scenario-card">
                <div class="scenario-body">
                    <h3>Connection Error</h3>
                    <p>Unable to load training scenarios. Please check your connection and try again.</p>
                    <button class="btn-primary" onclick="scenarioManager.loadScenarios()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            </div>
        `;
    }

    async handleCreateScenario() {
        if (!window.authManager.hasRole(['admin', 'trainer'])) {
            showNotification('Insufficient permissions to create scenarios', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('scenarioName').value,
            type: document.getElementById('scenarioType').value,
            difficulty: document.getElementById('scenarioDifficulty').value,
            description: document.getElementById('scenarioDescription').value,
            content: document.getElementById('scenarioContent').value,
            successCriteria: document.getElementById('successCriteria').value,
            learningObjectives: document.getElementById('learningObjectives').value
        };

        // Validate required fields
        if (!formData.name || !formData.type || !formData.difficulty || !formData.description) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate JSON content
        try {
            if (formData.content) {
                JSON.parse(formData.content);
            }
        } catch (error) {
            showNotification('Invalid JSON in scenario content', 'error');
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch('/api/scenarios', {
                method: 'POST',
                headers,
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                showNotification('Scenario created successfully!', 'success');
                closeCreateScenarioModal();
                this.loadScenarios(); // Reload scenarios list
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to create scenario', 'error');
            }
        } catch (error) {
            console.error('Create scenario error:', error);
            showNotification('Network error while creating scenario', 'error');
        }
    }

    async startTraining(scenarioId) {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            showLoginModal();
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch('/api/simulation/start', {
                method: 'POST',
                headers,
                body: JSON.stringify({ scenarioId })
            });

            if (response.ok) {
                const simulation = await response.json();
                this.launchSimulation(simulation);
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to start simulation', 'error');
            }
        } catch (error) {
            console.error('Start training error:', error);
            showNotification('Network error while starting training', 'error');
        }
    }

    launchSimulation(simulation) {
        // Switch to training section and start simulation
        switchSection('training');
        
        if (window.trainingManager) {
            window.trainingManager.startSimulation(simulation);
        } else {
            // Fallback: show simulation in modal
            this.showSimulationModal(simulation);
        }
    }

    showSimulationModal(simulation) {
        const modal = document.getElementById('simulationModal');
        const title = document.getElementById('simulationTitle');
        const content = document.getElementById('simulationContent');

        title.textContent = simulation.scenario.name;
        
        // Generate simulation interface based on scenario type
        content.innerHTML = this.generateSimulationInterface(simulation);

        modal.classList.add('active');
    }

    generateSimulationInterface(simulation) {
        const scenario = simulation.scenario;
        const content = scenario.content;

        switch (scenario.type) {
            case 'phishing':
                return this.generatePhishingInterface(simulation);
            case 'pretexting':
                return this.generatePretextingInterface(simulation);
            case 'baiting':
                return this.generateBaitingInterface(simulation);
            case 'spear_phishing':
                return this.generateSpearPhishingInterface(simulation);
            default:
                return this.generateGenericInterface(simulation);
        }
    }

    generatePhishingInterface(simulation) {
        const scenario = simulation.scenario;
        return `
            <div class="simulation-interface">
                <div class="simulation-header">
                    <h3>📧 Email Simulation</h3>
                    <p>You have received the following email. Analyze it carefully and choose your response.</p>
                </div>
                
                <div class="email-template">
                    <div class="email-header">
                        <div class="email-meta">
                            <strong>From:</strong> security@company-update.com
                            <strong>To:</strong> you@company.com
                            <strong>Date:</strong> ${new Date().toLocaleString()}
                            <strong>Subject:</strong> URGENT: Security Update Required
                        </div>
                    </div>
                    <div class="email-body">
                        <p>Dear Employee,</p>
                        <p>Our security team has detected suspicious activity on your account. To protect your data and maintain access to company systems, you must verify your credentials immediately.</p>
                        <p><strong>Action Required:</strong> Click the link below to secure your account within the next 24 hours.</p>
                        <p><a href="#" class="suspicious-link" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'clicked_suspicious_link')">🔗 Verify Account Security</a></p>
                        <p>Failure to act within this timeframe may result in account suspension.</p>
                        <p>Best regards,<br>IT Security Team</p>
                    </div>
                </div>

                <div class="simulation-actions">
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'clicked_suspicious_link')">
                        <strong>Click the link</strong><br>
                        <small>Follow the instructions to verify account</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'verified_sender')">
                        <strong>Verify sender first</strong><br>
                        <small>Contact IT through official channels to confirm</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'reported_phishing')">
                        <strong>Report as phishing</strong><br>
                        <small>Forward to security team and delete email</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'ignored_email')">
                        <strong>Ignore the email</strong><br>
                        <small>Delete without taking any action</small>
                    </button>
                </div>
            </div>
        `;
    }

    generatePretextingInterface(simulation) {
        return `
            <div class="simulation-interface">
                <div class="simulation-header">
                    <h3>📞 Phone Call Simulation</h3>
                    <p>You receive an unexpected phone call. Listen to the scenario and choose your response.</p>
                </div>
                
                <div class="phone-interface">
                    <div class="phone-header">
                        <div class="phone-caller">IT Support - Internal</div>
                        <div class="phone-number">+1 (555) 123-4567</div>
                    </div>
                    <div class="phone-dialogue">
                        <div class="caller-message">
                            "Hello, this is Mike from IT Support. We're experiencing a critical system issue that's affecting multiple user accounts. I need to verify your login credentials to ensure your account remains accessible during our emergency maintenance. Can you please confirm your username and password so I can update our security database?"
                        </div>
                    </div>
                    <div class="phone-actions">
                        <button class="phone-btn answer" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'provided_credentials')">
                            Provide Credentials
                        </button>
                        <button class="phone-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'requested_verification')">
                            Request Verification
                        </button>
                        <button class="phone-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'hung_up')">
                            Hang Up
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateBaitingInterface(simulation) {
        return `
            <div class="simulation-interface">
                <div class="simulation-header">
                    <h3>💾 Physical Security Simulation</h3>
                    <p>You find an interesting item. What do you do?</p>
                </div>
                
                <div class="simulation-content">
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">💾</div>
                        <h4>USB Drive Found</h4>
                        <p>You found a USB drive in the parking lot labeled "Q4 Employee Bonuses - CONFIDENTIAL"</p>
                        <p>What would you do with this device?</p>
                    </div>
                </div>

                <div class="simulation-actions">
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'inserted_usb')">
                        <strong>Insert into computer</strong><br>
                        <small>Check what's on the drive</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'reported_device')">
                        <strong>Report to security</strong><br>
                        <small>Turn in the suspicious device</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'ignored_device')">
                        <strong>Ignore it</strong><br>
                        <small>Leave the device where you found it</small>
                    </button>
                </div>
            </div>
        `;
    }

    generateSpearPhishingInterface(simulation) {
        return `
            <div class="simulation-interface">
                <div class="simulation-header">
                    <h3>🎯 Targeted Attack Simulation</h3>
                    <p>You receive a highly targeted email. Analyze the sophisticated attack.</p>
                </div>
                
                <div class="email-template">
                    <div class="email-header">
                        <div class="email-meta">
                            <strong>From:</strong> john.smith@partner-company.com
                            <strong>To:</strong> you@company.com
                            <strong>Date:</strong> ${new Date().toLocaleString()}
                            <strong>Subject:</strong> Re: Joint Project Timeline Update
                        </div>
                    </div>
                    <div class="email-body">
                        <p>Hi there,</p>
                        <p>Following up on our meeting last week about the Q4 partnership initiative. I've attached the updated project timeline and budget estimates for your review.</p>
                        <p>Could you please review the attached document and let me know if the proposed changes align with your team's capacity? We need to finalize this by EOD Friday.</p>
                        <p><a href="#" class="suspicious-link" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'downloaded_attachment')">📎 Download: Q4_Partnership_Timeline_FINAL.pdf.exe</a></p>
                        <p>Thanks for your collaboration on this critical project.</p>
                        <p>Best regards,<br>John Smith<br>Senior Project Manager</p>
                    </div>
                </div>

                <div class="simulation-actions">
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'downloaded_attachment')">
                        <strong>Download attachment</strong><br>
                        <small>Open the project timeline document</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'verified_sender_external')">
                        <strong>Verify sender</strong><br>
                        <small>Contact John through known channels</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'analyzed_suspicious_elements')">
                        <strong>Analyze suspicious elements</strong><br>
                        <small>Examine the email for red flags</small>
                    </button>
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'reported_spear_phishing')">
                        <strong>Report targeted attack</strong><br>
                        <small>Alert security team about spear phishing</small>
                    </button>
                </div>
            </div>
        `;
    }

    generateGenericInterface(simulation) {
        return `
            <div class="simulation-interface">
                <div class="simulation-header">
                    <h3>${simulation.scenario.name}</h3>
                    <p>${simulation.scenario.description}</p>
                </div>
                
                <div class="simulation-content">
                    <p><strong>Scenario:</strong> ${simulation.scenario.description}</p>
                    <p><strong>Learning Objectives:</strong> ${simulation.scenario.learning_objectives}</p>
                    <p><strong>Success Criteria:</strong> ${simulation.scenario.success_criteria}</p>
                </div>

                <div class="simulation-actions">
                    <button class="action-btn" onclick="scenarioManager.handleSimulationAction('${simulation.sessionId}', 'completed_scenario')">
                        <strong>Complete Scenario</strong><br>
                        <small>Mark this training as completed</small>
                    </button>
                </div>
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
                this.showActionFeedback(result.feedback);
                
                // Complete simulation after action
                setTimeout(() => {
                    this.completeSimulation(sessionId, result.feedback);
                }, 3000);
            } else {
                throw new Error('Failed to record action');
            }
        } catch (error) {
            console.error('Simulation action error:', error);
            showNotification('Failed to record action', 'error');
        }
    }

    showActionFeedback(feedback) {
        const content = document.getElementById('simulationContent');
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `feedback ${feedback.category}`;
        
        feedbackDiv.innerHTML = `
            <h4>📊 Feedback</h4>
            <p><strong>Score:</strong> ${feedback.score >= 0 ? '+' : ''}${feedback.score} points</p>
            <p>${feedback.message}</p>
            ${feedback.recommendations.length > 0 ? `
                <h5>💡 Recommendations:</h5>
                <ul>
                    ${feedback.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            ` : ''}
        `;

        content.appendChild(feedbackDiv);
        feedbackDiv.scrollIntoView({ behavior: 'smooth' });
    }

    async completeSimulation(sessionId, feedback) {
        try {
            const headers = window.authManager.getAuthHeaders();
            const score = Math.max(0, 50 + (feedback.score || 0)); // Base 50 + feedback score
            
            const response = await fetch(`/api/simulation/${sessionId}/complete`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ 
                    score, 
                    vulnerabilities: feedback.category === 'vulnerability' ? [feedback] : []
                })
            });

            if (response.ok) {
                const result = await response.json();
                showNotification(`Training completed! Score: ${score}%`, 'success');
                
                // Update user progress
                const userProgress = window.authManager.getUserProgress();
                if (userProgress) {
                    window.authManager.updateUserProgress(score, userProgress.completedScenarios + 1);
                }
                
                setTimeout(() => {
                    closeSimulationModal();
                }, 5000);
            }
        } catch (error) {
            console.error('Complete simulation error:', error);
            showNotification('Failed to complete simulation', 'error');
        }
    }

    editScenario(scenarioId) {
        // Implementation for editing scenarios
        showNotification('Edit scenario feature coming soon', 'info');
    }

    async deleteScenario(scenarioId) {
        if (!confirm('Are you sure you want to delete this scenario?')) {
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch(`/api/scenarios/${scenarioId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                showNotification('Scenario deleted successfully', 'success');
                this.loadScenarios();
            } else {
                throw new Error('Failed to delete scenario');
            }
        } catch (error) {
            console.error('Delete scenario error:', error);
            showNotification('Failed to delete scenario', 'error');
        }
    }

    updateFilters(difficulty = '', type = '') {
        this.currentFilter = { difficulty, type };
        this.filterAndDisplayScenarios();
    }
}

// Scenario Modal Functions
function showCreateScenarioModal() {
    if (!window.authManager.hasRole(['admin', 'trainer'])) {
        showNotification('Only admins and trainers can create scenarios', 'error');
        return;
    }
    
    const modal = document.getElementById('createScenarioModal');
    modal.classList.add('active');
}

function closeCreateScenarioModal() {
    const modal = document.getElementById('createScenarioModal');
    modal.classList.remove('active');
    document.getElementById('createScenarioForm').reset();
}

function closeSimulationModal() {
    const modal = document.getElementById('simulationModal');
    modal.classList.remove('active');
}

// Filter Functions
function filterScenarios() {
    const difficulty = document.getElementById('difficultyFilter').value;
    const type = document.getElementById('typeFilter').value;
    
    if (window.scenarioManager) {
        window.scenarioManager.updateFilters(difficulty, type);
    }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const createModal = document.getElementById('createScenarioModal');
    const simulationModal = document.getElementById('simulationModal');
    
    if (e.target === createModal) {
        closeCreateScenarioModal();
    }
    if (e.target === simulationModal) {
        closeSimulationModal();
    }
});

// Initialize scenario manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scenarioManager = new ScenarioManager();
});