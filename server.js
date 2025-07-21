const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');
const uuid = require('uuid');
const moment = require('moment');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const validator = require('validator');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'adaptive-social-engineering-secret-key';

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 10,
  duration: 60,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Database initialization
const db = new sqlite3.Database('./social_engineering_simulator.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'trainee',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    security_score INTEGER DEFAULT 0,
    completed_scenarios INTEGER DEFAULT 0
  )`);

  // Scenarios table
  db.run(`CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    success_criteria TEXT NOT NULL,
    learning_objectives TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Simulation sessions table
  db.run(`CREATE TABLE IF NOT EXISTS simulation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    score INTEGER DEFAULT 0,
    actions_taken TEXT,
    vulnerabilities_exposed TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
  )`);

  // Attack templates table
  db.run(`CREATE TABLE IF NOT EXISTS attack_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    template_content TEXT NOT NULL,
    variables TEXT,
    effectiveness_rating REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Phishing campaigns table
  db.run(`CREATE TABLE IF NOT EXISTS phishing_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_name TEXT NOT NULL,
    template_id INTEGER,
    target_list TEXT,
    sender_email TEXT,
    sender_name TEXT,
    subject_line TEXT,
    content TEXT,
    tracking_pixel TEXT,
    landing_page_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    launched_at DATETIME,
    status TEXT DEFAULT 'draft',
    FOREIGN KEY (template_id) REFERENCES attack_templates (id)
  )`);

  // Training analytics table
  db.run(`CREATE TABLE IF NOT EXISTS training_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Insert default scenarios and templates
db.serialize(() => {
  // Default attack scenarios
  const defaultScenarios = [
    {
      name: "Phishing Email Campaign",
      type: "phishing",
      difficulty: "beginner",
      description: "Simulate a basic phishing email attack targeting user credentials",
      content: JSON.stringify({
        emailTemplate: "urgent_security_update",
        targetDomain: "company.com",
        landingPage: "fake_login_page"
      }),
      successCriteria: "User identifies phishing indicators and reports email",
      learningObjectives: "Recognize phishing emails, understand social engineering tactics, learn proper reporting procedures"
    },
    {
      name: "Pretexting Phone Call",
      type: "pretexting",
      difficulty: "intermediate",
      description: "Advanced phone-based social engineering using authority pretense",
      content: JSON.stringify({
        script: "IT support requesting credentials",
        persona: "Technical Support Manager",
        urgency: "high"
      }),
      successCriteria: "User verifies caller identity before sharing information",
      learningObjectives: "Understand authority-based manipulation, learn verification procedures"
    },
    {
      name: "Baiting USB Attack",
      type: "baiting",
      difficulty: "advanced",
      description: "Physical security test using infected USB devices",
      content: JSON.stringify({
        device: "USB drive labeled 'Employee Salaries'",
        payload: "credential harvester",
        location: "parking lot"
      }),
      successCriteria: "User reports suspicious device instead of using it",
      learningObjectives: "Recognize physical security threats, understand curiosity exploitation"
    },
    {
      name: "Spear Phishing Executive",
      type: "spear_phishing",
      difficulty: "expert",
      description: "Highly targeted attack against C-level executives",
      content: JSON.stringify({
        target: "CEO",
        research: "LinkedIn, company news, recent travel",
        approach: "business email compromise"
      }),
      successCriteria: "Executive recognizes targeted nature and follows protocol",
      learningObjectives: "Understand advanced targeting, recognize business email compromise"
    }
  ];

  defaultScenarios.forEach(scenario => {
    db.run(`INSERT OR IGNORE INTO scenarios (name, type, difficulty, description, content, success_criteria, learning_objectives) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [scenario.name, scenario.type, scenario.difficulty, scenario.description, 
       scenario.content, scenario.successCriteria, scenario.learningObjectives]);
  });

  // Default attack templates
  const defaultTemplates = [
    {
      name: "Urgent Security Update",
      type: "phishing_email",
      content: JSON.stringify({
        subject: "URGENT: Security Update Required - Action Needed Within 24 Hours",
        body: `Dear {{firstName}},\n\nOur security team has detected suspicious activity on your account. To protect your data, please verify your credentials immediately.\n\nClick here to secure your account: {{maliciousLink}}\n\nFailure to act within 24 hours may result in account suspension.\n\nBest regards,\nSecurity Team`,
        indicators: ["urgency", "authority", "fear", "suspicious_link"]
      }),
      variables: JSON.stringify(["firstName", "maliciousLink"])
    },
    {
      name: "IT Support Request",
      type: "pretexting_script",
      content: JSON.stringify({
        script: "Hello, this is {{techName}} from IT Support. We're experiencing a critical system issue and need to verify your login credentials to maintain access to company systems. Can you please confirm your username and password?",
        persona: "IT Technical Support",
        urgency: "high",
        authority: "internal_it"
      }),
      variables: JSON.stringify(["techName"])
    }
  ];

  defaultTemplates.forEach(template => {
    db.run(`INSERT OR IGNORE INTO attack_templates (name, type, template_content, variables) 
            VALUES (?, ?, ?, ?)`,
      [template.name, template.type, template.content, template.variables]);
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Rate limiting middleware
const applyRateLimit = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
};

// Routes

// User Authentication
app.post('/api/register', applyRateLimit, async (req, res) => {
  try {
    const { username, email, password, role = 'trainee' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign({ userId: this.lastID, username, role }, JWT_SECRET);
        res.json({ token, userId: this.lastID, username, role });
      });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', applyRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

      const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ 
        token, 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        securityScore: user.security_score,
        completedScenarios: user.completed_scenarios
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Scenarios Management
app.get('/api/scenarios', authenticateToken, (req, res) => {
  const { difficulty, type } = req.query;
  let query = `SELECT * FROM scenarios WHERE is_active = 1`;
  const params = [];

  if (difficulty) {
    query += ` AND difficulty = ?`;
    params.push(difficulty);
  }

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY difficulty, created_at DESC`;

  db.all(query, params, (err, scenarios) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
    res.json(scenarios);
  });
});

app.post('/api/scenarios', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { name, type, difficulty, description, content, successCriteria, learningObjectives } = req.body;

  db.run(`INSERT INTO scenarios (name, type, difficulty, description, content, success_criteria, learning_objectives, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, difficulty, description, JSON.stringify(content), successCriteria, learningObjectives, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create scenario' });
      }
      res.json({ id: this.lastID, message: 'Scenario created successfully' });
    });
});

// Simulation Sessions
app.post('/api/simulation/start', authenticateToken, (req, res) => {
  const { scenarioId } = req.body;
  const sessionId = uuid.v4();

  db.run(`INSERT INTO simulation_sessions (session_id, user_id, scenario_id)
          VALUES (?, ?, ?)`,
    [sessionId, req.user.userId, scenarioId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to start simulation' });
      }

      // Get scenario details
      db.get(`SELECT * FROM scenarios WHERE id = ?`, [scenarioId], (err, scenario) => {
        if (err || !scenario) {
          return res.status(404).json({ error: 'Scenario not found' });
        }

        res.json({
          sessionId,
          scenario: {
            ...scenario,
            content: JSON.parse(scenario.content)
          }
        });
      });
    });
});

app.post('/api/simulation/:sessionId/action', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const { action, data } = req.body;

  // Log user action
  db.get(`SELECT * FROM simulation_sessions WHERE session_id = ? AND user_id = ?`,
    [sessionId, req.user.userId], (err, session) => {
      if (err || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const currentActions = session.actions_taken ? JSON.parse(session.actions_taken) : [];
      currentActions.push({
        action,
        data,
        timestamp: new Date().toISOString()
      });

      db.run(`UPDATE simulation_sessions SET actions_taken = ? WHERE session_id = ?`,
        [JSON.stringify(currentActions), sessionId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to log action' });
          }

          // Analyze action and provide feedback
          const feedback = analyzeUserAction(action, data);
          res.json({ feedback, actionLogged: true });
        });
    });
});

app.post('/api/simulation/:sessionId/complete', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const { score, vulnerabilities } = req.body;

  db.run(`UPDATE simulation_sessions SET 
          status = 'completed', 
          completed_at = CURRENT_TIMESTAMP, 
          score = ?, 
          vulnerabilities_exposed = ?
          WHERE session_id = ? AND user_id = ?`,
    [score, JSON.stringify(vulnerabilities), sessionId, req.user.userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to complete simulation' });
      }

      // Update user statistics
      db.run(`UPDATE users SET 
              completed_scenarios = completed_scenarios + 1,
              security_score = (security_score + ?) / 2
              WHERE id = ?`,
        [score, req.user.userId], (err) => {
          if (err) {
            console.error('Failed to update user stats:', err);
          }
        });

      res.json({ message: 'Simulation completed successfully', score });
    });
});

// Phishing Campaign Management
app.get('/api/campaigns', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  db.all(`SELECT c.*, t.name as template_name FROM phishing_campaigns c
          LEFT JOIN attack_templates t ON c.template_id = t.id
          ORDER BY c.created_at DESC`, (err, campaigns) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
    res.json(campaigns);
  });
});

app.post('/api/campaigns', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { campaignName, templateId, targetList, senderEmail, senderName, subjectLine } = req.body;
  const trackingPixel = uuid.v4();
  const landingPageUrl = `${req.protocol}://${req.get('host')}/phishing/${trackingPixel}`;

  db.run(`INSERT INTO phishing_campaigns (campaign_name, template_id, target_list, sender_email, sender_name, subject_line, tracking_pixel, landing_page_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [campaignName, templateId, JSON.stringify(targetList), senderEmail, senderName, subjectLine, trackingPixel, landingPageUrl],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create campaign' });
      }
      res.json({ id: this.lastID, landingPageUrl, message: 'Campaign created successfully' });
    });
});

// Analytics and Reporting
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const queries = {
    totalUsers: `SELECT COUNT(*) as count FROM users`,
    activeSimulations: `SELECT COUNT(*) as count FROM simulation_sessions WHERE status = 'active'`,
    completedSimulations: `SELECT COUNT(*) as count FROM simulation_sessions WHERE status = 'completed'`,
    averageScore: `SELECT AVG(score) as average FROM simulation_sessions WHERE status = 'completed'`,
    vulnerabilityTrends: `SELECT 
      DATE(completed_at) as date,
      AVG(score) as avg_score,
      COUNT(*) as session_count
      FROM simulation_sessions 
      WHERE status = 'completed' AND completed_at >= date('now', '-30 days')
      GROUP BY DATE(completed_at)
      ORDER BY date DESC`
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, (err, rows) => {
      if (!err) {
        results[key] = key === 'vulnerabilityTrends' ? rows : rows[0];
      }
      completed++;
      if (completed === total) {
        res.json(results);
      }
    });
  });
});

app.get('/api/analytics/user/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  
  if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin' && req.user.role !== 'trainer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  db.all(`SELECT 
    s.id,
    s.session_id,
    sc.name as scenario_name,
    sc.type,
    sc.difficulty,
    s.score,
    s.started_at,
    s.completed_at,
    s.actions_taken,
    s.vulnerabilities_exposed
    FROM simulation_sessions s
    JOIN scenarios sc ON s.scenario_id = sc.id
    WHERE s.user_id = ?
    ORDER BY s.started_at DESC`,
    [userId], (err, sessions) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch user analytics' });
      }
      
      res.json({
        sessions: sessions.map(session => ({
          ...session,
          actions_taken: session.actions_taken ? JSON.parse(session.actions_taken) : [],
          vulnerabilities_exposed: session.vulnerabilities_exposed ? JSON.parse(session.vulnerabilities_exposed) : []
        }))
      });
    });
});

// QR Code generation for mobile phishing simulations
app.get('/api/qr-code/:data', authenticateToken, async (req, res) => {
  try {
    const { data } = req.params;
    const qrCodeDataURL = await QRCode.toDataURL(decodeURIComponent(data));
    res.json({ qrCode: qrCodeDataURL });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Helper functions
function analyzeUserAction(action, data) {
  const feedback = {
    score: 0,
    message: '',
    category: 'unknown',
    recommendations: []
  };

  switch (action) {
    case 'clicked_suspicious_link':
      feedback.score = -10;
      feedback.message = 'You clicked a suspicious link! This could have compromised your security.';
      feedback.category = 'vulnerability';
      feedback.recommendations = [
        'Always hover over links to see the actual destination',
        'Look for suspicious domains and misspellings',
        'When in doubt, navigate to the site directly instead of clicking links'
      ];
      break;

    case 'reported_phishing':
      feedback.score = 10;
      feedback.message = 'Excellent! You correctly identified and reported the phishing attempt.';
      feedback.category = 'success';
      feedback.recommendations = [
        'Continue to be vigilant about suspicious emails',
        'Share your knowledge with colleagues'
      ];
      break;

    case 'entered_credentials':
      feedback.score = -15;
      feedback.message = 'Critical security failure! You entered your credentials on a fake site.';
      feedback.category = 'critical_vulnerability';
      feedback.recommendations = [
        'Always verify the URL before entering credentials',
        'Look for HTTPS and valid certificates',
        'Use two-factor authentication when available',
        'Consider using a password manager'
      ];
      break;

    case 'verified_sender':
      feedback.score = 8;
      feedback.message = 'Good security practice! Verifying the sender is always recommended.';
      feedback.category = 'good_practice';
      feedback.recommendations = [
        'Continue to verify suspicious communications',
        'Use official contact methods for verification'
      ];
      break;

    default:
      feedback.score = 0;
      feedback.message = 'Action recorded for analysis.';
      feedback.category = 'neutral';
  }

  return feedback;
}

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-simulation', (sessionId) => {
    socket.join(sessionId);
    console.log(`User joined simulation: ${sessionId}`);
  });

  socket.on('simulation-action', (data) => {
    io.to(data.sessionId).emit('action-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve phishing landing pages
app.get('/phishing/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  
  // Log the access
  db.run(`INSERT INTO training_analytics (user_id, event_type, event_data, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?)`,
    [0, 'phishing_page_access', JSON.stringify({ trackingId }), req.ip, req.get('User-Agent')]);

  // Serve a fake login page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Security Update Required</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
            .warning { background: #ff4444; color: white; padding: 10px; margin-bottom: 20px; }
            .form-group { margin-bottom: 15px; }
            input { width: 100%; padding: 10px; border: 1px solid #ccc; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="warning">⚠️ SECURITY ALERT: Immediate action required</div>
        <h2>Verify Your Account</h2>
        <p>For your security, please verify your credentials to continue accessing company resources.</p>
        <form id="phishingForm">
            <div class="form-group">
                <input type="text" placeholder="Username" id="username" required>
            </div>
            <div class="form-group">
                <input type="password" placeholder="Password" id="password" required>
            </div>
            <button type="submit">Verify Account</button>
        </form>
        
        <script>
        document.getElementById('phishingForm').onsubmit = function(e) {
            e.preventDefault();
            alert('🎣 PHISHING SIMULATION DETECTED!\\n\\nThis was a training exercise. You would have just given your credentials to an attacker!\\n\\nRemember:\\n- Always verify URLs\\n- Look for HTTPS\\n- Be suspicious of urgent requests');
            fetch('/api/analytics/phishing-interaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    trackingId: '${trackingId}',
                    action: 'credential_submission',
                    username: document.getElementById('username').value
                })
            });
        };
        </script>
    </body>
    </html>
  `);
});

// API endpoint for phishing interactions
app.post('/api/analytics/phishing-interaction', (req, res) => {
  const { trackingId, action, username } = req.body;
  
  db.run(`INSERT INTO training_analytics (user_id, event_type, event_data, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?)`,
    [0, 'phishing_interaction', JSON.stringify({ trackingId, action, username }), req.ip, req.get('User-Agent')],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to log interaction' });
      }
      res.json({ message: 'Interaction logged' });
    });
});

// Start server
server.listen(PORT, () => {
  console.log(`🔒 Adaptive Social Engineering Attack Simulator running on port ${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
  console.log(`🎯 Training scenarios ready for cybersecurity education`);
});