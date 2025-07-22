// Phishing Campaigns Management Module
class CampaignManager {
    constructor() {
        this.campaigns = [];
        this.templates = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Listen for section changes
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'campaigns') {
                this.loadCampaigns();
            }
        });
    }

    async loadCampaigns() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            this.showGuestCampaigns();
            return;
        }

        if (!window.authManager.hasRole(['admin', 'trainer'])) {
            this.showUnauthorizedCampaigns();
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch('/api/campaigns', { headers });

            if (response.ok) {
                this.campaigns = await response.json();
                this.displayCampaigns();
            } else {
                throw new Error('Failed to load campaigns');
            }
        } catch (error) {
            console.error('Campaigns load error:', error);
            showNotification('Failed to load campaigns', 'error');
            this.showErrorCampaigns();
        }
    }

    showGuestCampaigns() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        container.innerHTML = `
            <div class="campaigns-guest">
                <div class="guest-content">
                    <h3>🚫 Authentication Required</h3>
                    <p>Phishing campaign management is available to authenticated trainers and administrators.</p>
                    <div class="guest-features">
                        <h4>Campaign Management Features:</h4>
                        <ul>
                            <li>Create and customize phishing email templates</li>
                            <li>Target specific user groups for training</li>
                            <li>Track campaign performance and user responses</li>
                            <li>Generate detailed analytics and reports</li>
                            <li>Real-time monitoring of training effectiveness</li>
                        </ul>
                    </div>
                    <button class="btn-primary" onclick="showLoginModal()">
                        <i class="fas fa-sign-in-alt"></i> Login to Access Campaigns
                    </button>
                </div>
            </div>
        `;
    }

    showUnauthorizedCampaigns() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        container.innerHTML = `
            <div class="campaigns-unauthorized">
                <div class="unauthorized-content">
                    <h3>🔒 Insufficient Permissions</h3>
                    <p>Campaign management is restricted to trainers and administrators.</p>
                    <div class="role-info">
                        <p>Your current role: <strong>${window.authManager.user.role}</strong></p>
                        <p>Contact your administrator to request trainer privileges if you need to create and manage phishing campaigns.</p>
                    </div>
                    <button class="btn-secondary" onclick="switchSection('scenarios')">
                        <i class="fas fa-theater-masks"></i> View Training Scenarios
                    </button>
                </div>
            </div>
        `;
    }

    showErrorCampaigns() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        container.innerHTML = `
            <div class="campaigns-error">
                <h3>⚠️ Connection Error</h3>
                <p>Unable to load campaign data. Please check your connection and try again.</p>
                <button class="btn-primary" onclick="campaignManager.loadCampaigns()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }

    displayCampaigns() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        if (this.campaigns.length === 0) {
            container.innerHTML = `
                <div class="no-campaigns">
                    <div class="empty-state">
                        <div class="empty-icon">📧</div>
                        <h3>No Campaigns Created</h3>
                        <p>Create your first phishing campaign to begin training your users.</p>
                        <button class="btn-primary" onclick="showCreateCampaignModal()">
                            <i class="fas fa-plus"></i> Create First Campaign
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="campaigns-grid">
                ${this.campaigns.map(campaign => this.createCampaignCard(campaign)).join('')}
            </div>
        `;
    }

    createCampaignCard(campaign) {
        const statusClass = campaign.status === 'active' ? 'status-active' : 
                           campaign.status === 'completed' ? 'status-completed' : 'status-draft';
        
        const launchedDate = campaign.launched_at ? 
            new Date(campaign.launched_at).toLocaleDateString() : 'Not launched';

        return `
            <div class="campaign-card" data-campaign-id="${campaign.id}">
                <div class="campaign-header">
                    <div class="campaign-title">${campaign.campaign_name}</div>
                    <div class="campaign-status">
                        <span class="status-indicator ${statusClass}">${campaign.status}</span>
                    </div>
                </div>
                <div class="campaign-body">
                    <div class="campaign-info">
                        <div class="info-item">
                            <strong>Template:</strong> ${campaign.template_name || 'Custom'}
                        </div>
                        <div class="info-item">
                            <strong>Subject:</strong> ${campaign.subject_line}
                        </div>
                        <div class="info-item">
                            <strong>Sender:</strong> ${campaign.sender_name} &lt;${campaign.sender_email}&gt;
                        </div>
                        <div class="info-item">
                            <strong>Launched:</strong> ${launchedDate}
                        </div>
                        <div class="info-item">
                            <strong>Targets:</strong> ${JSON.parse(campaign.target_list || '[]').length} users
                        </div>
                    </div>
                    
                    <div class="campaign-metrics">
                        <div class="metric">
                            <span class="metric-value">0</span>
                            <span class="metric-label">Emails Sent</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">0</span>
                            <span class="metric-label">Clicked</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">0</span>
                            <span class="metric-label">Reported</span>
                        </div>
                    </div>

                    <div class="campaign-actions">
                        ${campaign.status === 'draft' ? `
                            <button class="btn-primary btn-small" onclick="campaignManager.launchCampaign(${campaign.id})">
                                <i class="fas fa-rocket"></i> Launch
                            </button>
                        ` : ''}
                        <button class="btn-secondary btn-small" onclick="campaignManager.viewCampaign(${campaign.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn-secondary btn-small" onclick="campaignManager.editCampaign(${campaign.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger btn-small" onclick="campaignManager.deleteCampaign(${campaign.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>

                    ${campaign.landing_page_url ? `
                        <div class="campaign-url">
                            <strong>Landing Page:</strong>
                            <code>${campaign.landing_page_url}</code>
                            <button class="btn-small" onclick="campaignManager.copyUrl('${campaign.landing_page_url}')">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async launchCampaign(campaignId) {
        if (!confirm('Are you sure you want to launch this campaign? This action cannot be undone.')) {
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch(`/api/campaigns/${campaignId}/launch`, {
                method: 'POST',
                headers
            });

            if (response.ok) {
                showNotification('Campaign launched successfully!', 'success');
                this.loadCampaigns(); // Reload campaigns
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to launch campaign', 'error');
            }
        } catch (error) {
            console.error('Launch campaign error:', error);
            showNotification('Network error while launching campaign', 'error');
        }
    }

    viewCampaign(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>📊 Campaign Details: ${campaign.campaign_name}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="campaign-details">
                        <div class="detail-section">
                            <h3>📧 Email Configuration</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Subject Line:</strong>
                                    <p>${campaign.subject_line}</p>
                                </div>
                                <div class="detail-item">
                                    <strong>Sender:</strong>
                                    <p>${campaign.sender_name} &lt;${campaign.sender_email}&gt;</p>
                                </div>
                                <div class="detail-item">
                                    <strong>Template:</strong>
                                    <p>${campaign.template_name || 'Custom Template'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3>🎯 Target Information</h3>
                            <div class="target-list">
                                ${this.renderTargetList(JSON.parse(campaign.target_list || '[]'))}
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3>📈 Campaign Performance</h3>
                            <div class="performance-metrics">
                                <div class="metric-card">
                                    <div class="metric-value">0</div>
                                    <div class="metric-label">Total Sent</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">0</div>
                                    <div class="metric-label">Opened</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">0</div>
                                    <div class="metric-label">Clicked</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">0</div>
                                    <div class="metric-label">Reported</div>
                                </div>
                            </div>
                        </div>

                        ${campaign.landing_page_url ? `
                            <div class="detail-section">
                                <h3>🔗 Landing Page</h3>
                                <div class="landing-page-info">
                                    <p><strong>URL:</strong> <code>${campaign.landing_page_url}</code></p>
                                    <button class="btn-secondary" onclick="campaignManager.previewLandingPage('${campaign.landing_page_url}')">
                                        <i class="fas fa-external-link-alt"></i> Preview Page
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    renderTargetList(targets) {
        if (targets.length === 0) {
            return '<p>No targets specified</p>';
        }

        return `
            <div class="target-summary">
                <p><strong>Total Targets:</strong> ${targets.length}</p>
                <div class="target-emails">
                    ${targets.slice(0, 5).map(email => `<span class="target-email">${email}</span>`).join('')}
                    ${targets.length > 5 ? `<span class="target-more">+${targets.length - 5} more</span>` : ''}
                </div>
            </div>
        `;
    }

    editCampaign(campaignId) {
        showNotification('Campaign editing feature coming soon', 'info');
    }

    async deleteCampaign(campaignId) {
        if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return;
        }

        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                showNotification('Campaign deleted successfully', 'success');
                this.loadCampaigns();
            } else {
                throw new Error('Failed to delete campaign');
            }
        } catch (error) {
            console.error('Delete campaign error:', error);
            showNotification('Failed to delete campaign', 'error');
        }
    }

    copyUrl(url) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('URL copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy URL', 'error');
        });
    }

    previewLandingPage(url) {
        window.open(url, '_blank');
    }

    async generateQRCode(url) {
        try {
            const headers = window.authManager.getAuthHeaders();
            const response = await fetch(`/api/qr-code/${encodeURIComponent(url)}`, { headers });

            if (response.ok) {
                const result = await response.json();
                this.showQRCodeModal(result.qrCode, url);
            } else {
                throw new Error('Failed to generate QR code');
            }
        } catch (error) {
            console.error('QR code generation error:', error);
            showNotification('Failed to generate QR code', 'error');
        }
    }

    showQRCodeModal(qrCodeDataURL, url) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📱 QR Code for Mobile Testing</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="qr-code-container">
                        <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 100%; height: auto;">
                        <p>Scan this QR code with a mobile device to test the phishing landing page.</p>
                        <p><strong>URL:</strong> <code>${url}</code></p>
                        <button class="btn-primary" onclick="campaignManager.copyUrl('${url}')">
                            <i class="fas fa-copy"></i> Copy URL
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Method to be called when create campaign modal is implemented
    showCreateCampaignForm() {
        const form = `
            <div class="campaign-form">
                <div class="form-section">
                    <h3>📧 Email Configuration</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="campaignName">Campaign Name</label>
                            <input type="text" id="campaignName" required>
                        </div>
                        <div class="form-group">
                            <label for="campaignTemplate">Email Template</label>
                            <select id="campaignTemplate">
                                <option value="">Select Template</option>
                                <option value="1">Urgent Security Update</option>
                                <option value="2">Account Verification</option>
                                <option value="3">Password Expiration</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="senderName">Sender Name</label>
                            <input type="text" id="senderName" value="IT Security Team" required>
                        </div>
                        <div class="form-group">
                            <label for="senderEmail">Sender Email</label>
                            <input type="email" id="senderEmail" value="security@company.com" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="subjectLine">Subject Line</label>
                        <input type="text" id="subjectLine" placeholder="URGENT: Security Update Required" required>
                    </div>
                </div>

                <div class="form-section">
                    <h3>🎯 Target Audience</h3>
                    <div class="form-group">
                        <label for="targetEmails">Target Email Addresses</label>
                        <textarea id="targetEmails" rows="5" placeholder="Enter email addresses, one per line"></textarea>
                        <small>Enter one email address per line</small>
                    </div>
                </div>

                <div class="form-section">
                    <h3>⚙️ Campaign Settings</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="trackClicks" checked>
                                Track link clicks
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="generateLanding" checked>
                                Generate landing page
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return form;
    }
}

// Campaign Modal Functions
function showCreateCampaignModal() {
    if (!window.authManager.hasRole(['admin', 'trainer'])) {
        showNotification('Only admins and trainers can create campaigns', 'error');
        return;
    }
    
    showNotification('Campaign creation feature coming soon', 'info');
}

function closeCreateCampaignModal() {
    const modal = document.getElementById('createCampaignModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize campaign manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.campaignManager = new CampaignManager();
});