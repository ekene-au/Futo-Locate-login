# 🔒 Adaptive Social Engineering Attack Simulator

A comprehensive cybersecurity training platform designed to educate users about social engineering attacks through interactive simulations and hands-on practice.

![Security Training](https://img.shields.io/badge/Security-Training-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Purpose

This educational tool simulates various social engineering attacks in a controlled environment to help users:

- **Recognize** phishing emails and malicious communications
- **Understand** social engineering tactics and psychology
- **Practice** appropriate security responses
- **Improve** overall security awareness and decision-making

> **⚠️ EDUCATIONAL USE ONLY**: This simulator is designed exclusively for cybersecurity education and training. It should only be used in controlled environments with proper authorization.

## ✨ Features

### 🎭 Interactive Training Scenarios
- **Phishing Email Simulations**: Practice identifying and responding to phishing attempts
- **Pretexting Scenarios**: Learn to handle suspicious phone calls and social engineering
- **Baiting Attacks**: Understand physical security threats and USB-based attacks
- **Spear Phishing**: Advanced targeted attack simulations

### 📊 Comprehensive Analytics
- **Personal Progress Tracking**: Monitor your security awareness improvement
- **Detailed Session Reports**: Analyze actions taken during training
- **Vulnerability Assessment**: Identify areas for improvement
- **Achievement System**: Earn badges and certifications

### 🎯 Campaign Management
- **Phishing Campaign Creation**: Design custom training campaigns
- **Template Library**: Pre-built attack templates and scenarios
- **Target Management**: Organize and track training participants
- **Real-time Monitoring**: Track campaign performance and user responses

### 🛡️ Security Features
- **Role-based Access Control**: Different permissions for trainees, trainers, and admins
- **Rate Limiting**: Prevents abuse and ensures system stability
- **Secure Authentication**: JWT-based authentication with encrypted passwords
- **Input Validation**: Comprehensive validation and sanitization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd adaptive-social-engineering-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## 📖 User Guide

### Getting Started

1. **Registration/Login**: Create an account or log in to track your progress
2. **Dashboard**: View your training statistics and recent activities
3. **Training**: Start with beginner scenarios and work your way up
4. **Scenarios**: Browse available training scenarios by type and difficulty
5. **Analytics**: Monitor your progress and identify areas for improvement

### User Roles

#### 👨‍🎓 Trainee
- Access training scenarios and simulations
- View personal analytics and progress
- Complete training modules and earn achievements

#### 👨‍🏫 Trainer
- All trainee permissions
- Create and manage training scenarios
- Launch phishing campaigns for training
- Access detailed training analytics

#### 👨‍💼 Admin
- All trainer permissions
- User management and role assignment
- System configuration and monitoring
- Full access to all analytics and reports

### Training Workflow

1. **Select a Scenario**: Choose from available training scenarios
2. **Complete the Simulation**: Interact with the simulated attack
3. **Receive Feedback**: Get immediate feedback on your responses
4. **Review Results**: Analyze your performance and learn from mistakes
5. **Track Progress**: Monitor your improvement over time

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based user authentication
- **Database**: SQLite for data persistence
- **API**: RESTful API for all application functionality
- **Real-time**: Socket.io for live updates and notifications
- **Security**: Rate limiting, input validation, and secure headers

### Frontend (Vanilla JavaScript)
- **Modular Architecture**: Separate managers for different functionality
- **Responsive Design**: Mobile-friendly interface
- **Progressive Web App**: Offline capability and installable
- **Modern UI**: Clean, professional cybersecurity-themed design

### Database Schema
- **Users**: Authentication and user profile information
- **Scenarios**: Training scenario definitions and content
- **Sessions**: Individual training session records
- **Analytics**: Training performance and progress tracking
- **Campaigns**: Phishing campaign management

## 🛠️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-secure-jwt-secret-key

# Database
DB_PATH=./social_engineering_simulator.db

# Email Configuration (optional)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

### Application Settings
- **Default Admin**: First registered user becomes admin
- **Session Timeout**: 24 hours for JWT tokens
- **Rate Limiting**: 10 requests per minute per IP
- **File Uploads**: Limited to specific file types and sizes

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/register` - Register new user
- `POST /api/login` - User authentication

### Scenario Management
- `GET /api/scenarios` - List available scenarios
- `POST /api/scenarios` - Create new scenario (trainer/admin)
- `DELETE /api/scenarios/:id` - Delete scenario (trainer/admin)

### Training Sessions
- `POST /api/simulation/start` - Start training simulation
- `POST /api/simulation/:id/action` - Record user action
- `POST /api/simulation/:id/complete` - Complete simulation

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/user/:id` - User-specific analytics

### Campaign Management
- `GET /api/campaigns` - List phishing campaigns
- `POST /api/campaigns` - Create new campaign
- `POST /api/campaigns/:id/launch` - Launch campaign

## 🔒 Security Considerations

### Data Protection
- **Encryption**: All passwords are hashed using bcrypt
- **Session Security**: JWT tokens with expiration
- **Input Validation**: All user input is validated and sanitized
- **HTTPS**: Use HTTPS in production environments

### Rate Limiting
- **API Protection**: Rate limiting on all API endpoints
- **Brute Force Protection**: Login attempt limiting
- **Resource Protection**: Prevents abuse of system resources

### Access Control
- **Role-based Permissions**: Granular access control
- **Session Management**: Secure session handling
- **CORS Configuration**: Properly configured CORS policies

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

## 🚀 Deployment

### Production Deployment

1. **Prepare Environment**
   ```bash
   NODE_ENV=production
   npm run build
   ```

2. **Database Setup**
   ```bash
   # Database will be automatically created on first run
   ```

3. **Start Application**
   ```bash
   npm start
   ```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Security Hardening
- Use HTTPS with valid SSL certificates
- Configure firewalls and network security
- Regular security updates and patches
- Monitor logs and system activity

## 🤝 Contributing

We welcome contributions to improve the security simulator! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make your changes**: Follow coding standards and best practices
4. **Add tests**: Ensure your changes are properly tested
5. **Submit a pull request**: Provide clear description of changes

### Coding Standards
- Use ESLint for JavaScript linting
- Follow security best practices
- Include comprehensive error handling
- Write clear, self-documenting code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational purposes only. Users are responsible for:
- Using the tool only in authorized environments
- Complying with applicable laws and regulations
- Obtaining proper permissions before conducting training
- Following ethical guidelines for cybersecurity education

## 🆘 Support

### Documentation
- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

### Getting Help
- Check the [FAQ](docs/faq.md)
- Review [troubleshooting guide](docs/troubleshooting.md)
- Open an issue for bugs or feature requests

### Community
- Join our security training community
- Share training scenarios and best practices
- Contribute to improving cybersecurity education

---

**Built with ❤️ for cybersecurity education and awareness**

*Remember: The best defense against social engineering is an educated and aware user base.*