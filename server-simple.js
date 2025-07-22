const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('rate-limiter-flexible');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Database file paths
const DB_PATH = './data';
const USERS_FILE = path.join(DB_PATH, 'users.json');
const SCENARIOS_FILE = path.join(DB_PATH, 'scenarios.json');
const SESSIONS_FILE = path.join(DB_PATH, 'sessions.json');
const CAMPAIGNS_FILE = path.join(DB_PATH, 'campaigns.json');

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialize JSON databases
function initDatabase() {
    // Initialize users file
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    
    // Initialize scenarios file with sample data
    if (!fs.existsSync(SCENARIOS_FILE)) {
        const sampleScenarios = [
            {
                id: 1,
                name: "CEO Email Phishing",
                type: "phishing",
                difficulty: "intermediate",
                description: "A sophisticated phishing attack impersonating the company CEO",
                content: {
                    template: "email",
                    subject: "Urgent: Wire Transfer Required",
                    sender: "ceo@company.com",
                    body: "Please process urgent wire transfer..."
                },
                success_criteria: "User reports email without clicking links",
                learning_objectives: "Identify CEO fraud, verify through alternative communication",
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: "IT Support Pretexting",
                type: "pretexting",
                difficulty: "beginner",
                description: "Phone call from fake IT support requesting credentials",
                content: {
                    template: "phone",
                    scenario: "IT support needs your password to fix account"
                },
                success_criteria: "User refuses to provide credentials",
                learning_objectives: "Verify IT requests through official channels",
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                name: "USB Baiting Attack",
                type: "baiting",
                difficulty: "advanced",
                description: "USB drive left in parking lot with malicious content",
                content: {
                    template: "physical",
                    description: "Found USB labeled 'Employee Bonuses 2024'"
                },
                success_criteria: "User reports USB to security without plugging in",
                learning_objectives: "Never use unknown USB devices",
                created_at: new Date().toISOString()
            }
        ];
        fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(sampleScenarios, null, 2));
    }
    
    // Initialize other files
    if (!fs.existsSync(SESSIONS_FILE)) {
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
    }
    
    if (!fs.existsSync(CAMPAIGNS_FILE)) {
        const sampleCampaigns = [
            {
                id: 1,
                name: "Q1 Security Awareness",
                description: "Quarterly phishing simulation campaign",
                template: "IT Security Update",
                target_groups: ["all_employees"],
                status: "active",
                created_at: new Date().toISOString(),
                stats: {
                    sent: 150,
                    clicked: 34,
                    reported: 116
                }
            }
        ];
        fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(sampleCampaigns, null, 2));
    }
}

// Helper functions for JSON file operations
function readJsonFile(filepath) {
    try {
        const data = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filepath}:`, error);
        return [];
    }
}

function writeJsonFile(filepath, data) {
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filepath}:`, error);
        return false;
    }
}

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
    points: 100,
    duration: 60,
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({ error: 'Too many requests' });
    }
});

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Initialize database
initDatabase();

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role = 'trainee' } = req.body;
        
        const users = readJsonFile(USERS_FILE);
        
        // Check if user exists
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            role: users.length === 0 ? 'admin' : role, // First user is admin
            created_at: new Date().toISOString(),
            stats: {
                total_sessions: 0,
                completed_sessions: 0,
                average_score: 0,
                vulnerabilities_found: 0
            }
        };

        users.push(newUser);
        writeJsonFile(USERS_FILE, users);

        // Generate token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const users = readJsonFile(USERS_FILE);
        const user = users.find(u => u.username === username);

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard API
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
    try {
        const users = readJsonFile(USERS_FILE);
        const sessions = readJsonFile(SESSIONS_FILE);
        
        const stats = {
            totalUsers: users.length,
            activeSimulations: sessions.filter(s => s.status === 'active').length,
            completedSimulations: sessions.filter(s => s.status === 'completed').length,
            averageScore: sessions.length > 0 ? 
                Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / sessions.length) : 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Scenarios API
app.get('/api/scenarios', authenticateToken, (req, res) => {
    try {
        const scenarios = readJsonFile(SCENARIOS_FILE);
        res.json(scenarios);
    } catch (error) {
        console.error('Scenarios error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/scenarios', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const scenarios = readJsonFile(SCENARIOS_FILE);
        const newScenario = {
            id: scenarios.length + 1,
            ...req.body,
            created_at: new Date().toISOString()
        };

        scenarios.push(newScenario);
        writeJsonFile(SCENARIOS_FILE, scenarios);

        res.status(201).json({ message: 'Scenario created successfully', scenario: newScenario });
    } catch (error) {
        console.error('Create scenario error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Campaigns API
app.get('/api/campaigns', authenticateToken, (req, res) => {
    try {
        const campaigns = readJsonFile(CAMPAIGNS_FILE);
        res.json(campaigns);
    } catch (error) {
        console.error('Campaigns error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Simulation API
app.post('/api/simulation/start', authenticateToken, (req, res) => {
    try {
        const { scenarioId } = req.body;
        const sessions = readJsonFile(SESSIONS_FILE);
        
        const sessionId = uuidv4();
        const newSession = {
            id: sessionId,
            user_id: req.user.userId,
            scenario_id: scenarioId,
            status: 'active',
            score: 0,
            started_at: new Date().toISOString(),
            actions: []
        };

        sessions.push(newSession);
        writeJsonFile(SESSIONS_FILE, sessions);

        res.json({ sessionId, message: 'Simulation started' });
    } catch (error) {
        console.error('Start simulation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Analytics API
app.get('/api/analytics/user/:userId', authenticateToken, (req, res) => {
    try {
        const sessions = readJsonFile(SESSIONS_FILE);
        const userSessions = sessions.filter(s => s.user_id == req.params.userId);
        
        const analytics = {
            totalSessions: userSessions.length,
            completedSessions: userSessions.filter(s => s.status === 'completed').length,
            averageScore: userSessions.length > 0 ? 
                Math.round(userSessions.reduce((acc, s) => acc + (s.score || 0), 0) / userSessions.length) : 0,
            recentSessions: userSessions.slice(-5)
        };

        res.json(analytics);
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_simulation', (sessionId) => {
        socket.join(sessionId);
        console.log(`User joined simulation: ${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Adaptive Social Engineering Attack Simulator running on port ${PORT}`);
    console.log(`📱 Open your browser to: http://localhost:${PORT}`);
    console.log(`🛡️ Database: JSON file storage (no native modules required)`);
});