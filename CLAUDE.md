# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Backend development
cd backend && npm run dev          # Start backend development server (port 3000)
cd backend && npm run migrate      # Run database migrations
cd backend && npm run migrate:paypal # Run PayPal-specific database migrations
cd backend && npm test             # Run backend tests
cd backend && npm run lint         # Lint backend code

# Frontend development  
cd frontend && npm run dev         # Start frontend development server (port 3001)
cd frontend && npm run build       # Build frontend for production
cd frontend && npm test            # Run frontend tests
cd frontend && npm run lint        # Lint frontend code (Next.js)

# Run both servers concurrently for development
# Backend: http://localhost:3000
# Frontend: http://localhost:3001
```

### Testing Commands
```bash
# Run specific test file
cd backend && npm test -- auth.test.js
cd frontend && npm test -- Home.test.tsx

# Run tests in watch mode
cd backend && npm test -- --watch
cd frontend && npm test -- --watch
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router) with TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js/Express with PostgreSQL (Neon)
- **Authentication**: JWT with role-based access control
- **Payments**: PayPal integration with order-based payments and subscriptions
- **File Storage**: Local filesystem with multer

### Role-Based System
The application has three distinct user roles with separate dashboards and permissions:

1. **Teachers**: Complete onboarding, manage classes, track earnings
   - Status workflow: pending → interviewed → approved/rejected
   - Routes: `/teacher/*` pages, `/api/teachers/*` endpoints

2. **Parents**: Manage students, book classes, make payments
   - Routes: `/parent/*` pages, `/api/parents/*` and `/api/students/*` endpoints

3. **Admins**: Vet teachers, schedule interviews, platform monitoring
   - Routes: `/admin/*` pages, `/api/admin/*` endpoints

### Database Schema Key Relationships
- `users` table handles authentication for all roles
- `teachers`/`parents` tables extend user profiles with role-specific data
- `students` belong to parents (1:many)
- `classes` connect teachers and students with scheduling/payment data
- `payments` track PayPal transactions linked to classes
- `teacher_interviews` and `teacher_qualifications` support vetting process

### Authentication Flow
- Frontend: React Context (`AuthContext`) manages authentication state
- JWT tokens stored in localStorage with axios defaults
- Backend: `auth.js` middleware validates JWT and populates `req.user`
- Role-based authorization via `authorize()` middleware
- Route protection via `withAuth()` HOC on frontend

### API Structure
REST API organized by domain:
- `/api/auth/*` - Authentication (login, register, profile)
- `/api/teachers/*` - Teacher operations (profile, classes, earnings)
- `/api/parents/*` - Parent profiles
- `/api/students/*` - Student management  
- `/api/classes/*` - Class scheduling and management
- `/api/payments/*` - PayPal payment processing
- `/api/uploads/*` - File upload handling
- `/api/admin/*` - Administrative functions
- `/api/search/*` - Search functionality

### Frontend App Router Structure
- `(auth)/` - Sign-in/sign-up pages (route groups)
- `admin/`, `teacher/`, `parent/` - Role-specific page hierarchies
- `components/ui/` - Reusable Radix UI components with Tailwind
- Authentication redirects users to appropriate dashboards based on role

### File Upload System
- Backend: Multer middleware handles multipart uploads to `/uploads` directory
- File types: PDFs (CVs), images (ID documents, police clearance)
- Frontend: Form handling with validation for document uploads during teacher onboarding

### Payment Integration
- PayPal orders for class bookings
- Webhook handling for payment confirmation
- Teacher earnings tracking and monthly payment summaries
- Per-lesson pricing model with ZAR currency support

## Environment Setup

### Backend Environment Variables
```
DATABASE_URL=          # Neon PostgreSQL connection string
JWT_SECRET=           # Secret for JWT token signing  
PAYPAL_CLIENT_ID=     # PayPal application client ID
PAYPAL_CLIENT_SECRET= # PayPal application client secret
PAYPAL_WEBHOOK_ID=    # PayPal webhook endpoint ID
FRONTEND_URL=         # CORS origin (http://localhost:3001 for dev)
PORT=                 # Server port (defaults to 3000)
NODE_ENV=             # development/production (affects PayPal sandbox/live)
```

### Frontend Environment Variables  
```
NEXT_PUBLIC_API_URL=              # Backend API URL (http://localhost:3000 for dev)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=     # PayPal client ID for frontend integration
```

## Key Development Patterns

### Database Queries
- Use parameterized queries via `db/index.js` query function
- All tables have `created_at`/`updated_at` with automatic triggers
- Indexes on foreign keys and status columns for performance

### Error Handling
- Backend: Centralized error middleware with development/production modes
- Frontend: Try-catch blocks with user-friendly error messages
- Authentication errors redirect to sign-in page

### Security Measures
- Helmet security headers, CORS configuration
- Rate limiting (100 requests/15min per IP)
- Input validation with Joi schemas
- File upload restrictions (type, size)
- Password hashing with bcryptjs

### Code Organization
- Backend routes follow REST conventions
- Frontend components use TypeScript interfaces
- Shared UI components in `components/ui/`
- Database schema with proper foreign key constraints and checks
- PayPal integration with order-based payments instead of payment intents
- ZAR currency support for South African market

---

# Claude Code - Full Capabilities Configuration

This document provides comprehensive instructions for Claude Code to utilize all available tools, integrations, and capabilities for maximum effectiveness in development workflows.

## Core Tool Configuration

### Enable All Available Tools
Use all built-in Claude Code tools without restrictions:

```bash
# Enable all core tools
claude --allowedTools "Read,Write,Bash,Terminal,Search,Replace,Create,Delete,Move,Copy,Execute,Install,Git,Debug,Test,Deploy,Refactor,Analyze,Review,Document,Format,Lint,Build,Package,Publish"
```

### Permission Settings
Configure Claude Code to operate with maximum autonomy while maintaining safety:

```bash
# Accept edits automatically for faster workflow
claude --permission-mode acceptEdits

# For maximum automation (use with caution)
claude --permission-mode bypassPermissions

# For planning mode (shows what would be done)
claude --permission-mode plan
```

## MCP (Model Context Protocol) Integration

### Comprehensive MCP Configuration
Create a complete MCP servers configuration file to extend Claude Code's capabilities:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"],
      "description": "Full filesystem access for file operations"
    },
    "github": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub integration for repository operations"
    },
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gitlab"],
      "env": {
        "GITLAB_TOKEN": "${GITLAB_TOKEN}"
      },
      "description": "GitLab integration for repository operations"
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      },
      "description": "Database operations and queries"
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"],
      "description": "Docker container management"
    },
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
      "env": {
        "KUBECONFIG": "${KUBECONFIG}"
      },
      "description": "Kubernetes cluster operations"
    },
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
        "AWS_REGION": "${AWS_REGION}"
      },
      "description": "AWS cloud services integration"
    },
    "gcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}"
      },
      "description": "Google Cloud Platform integration"
    },
    "azure": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-azure"],
      "env": {
        "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}",
        "AZURE_CLIENT_SECRET": "${AZURE_CLIENT_SECRET}",
        "AZURE_TENANT_ID": "${AZURE_TENANT_ID}"
      },
      "description": "Microsoft Azure integration"
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
      },
      "description": "Slack integration for team communication"
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-jira"],
      "env": {
        "JIRA_URL": "${JIRA_URL}",
        "JIRA_TOKEN": "${JIRA_TOKEN}",
        "JIRA_EMAIL": "${JIRA_EMAIL}"
      },
      "description": "Jira project management integration"
    },
    "confluence": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-confluence"],
      "env": {
        "CONFLUENCE_URL": "${CONFLUENCE_URL}",
        "CONFLUENCE_TOKEN": "${CONFLUENCE_TOKEN}",
        "CONFLUENCE_EMAIL": "${CONFLUENCE_EMAIL}"
      },
      "description": "Confluence documentation integration"
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_TOKEN": "${NOTION_TOKEN}"
      },
      "description": "Notion workspace integration"
    },
    "linear": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"],
      "env": {
        "LINEAR_API_KEY": "${LINEAR_API_KEY}"
      },
      "description": "Linear issue tracking integration"
    },
    "monitoring": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-prometheus"],
      "env": {
        "PROMETHEUS_URL": "${PROMETHEUS_URL}"
      },
      "description": "Monitoring and metrics integration"
    },
    "logging": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-elasticsearch"],
      "env": {
        "ELASTICSEARCH_URL": "${ELASTICSEARCH_URL}"
      },
      "description": "Log analysis and search"
    },
    "api_testing": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postman"],
      "env": {
        "POSTMAN_API_KEY": "${POSTMAN_API_KEY}"
      },
      "description": "API testing and documentation"
    },
    "security": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-security"],
      "description": "Security scanning and analysis"
    },
    "package_manager": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-npm"],
      "description": "Package management operations"
    },
    "ci_cd": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-jenkins"],
      "env": {
        "JENKINS_URL": "${JENKINS_URL}",
        "JENKINS_TOKEN": "${JENKINS_TOKEN}"
      },
      "description": "CI/CD pipeline integration"
    },
    "n8n": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-n8n"],
      "env": {
        "N8N_URL": "${N8N_URL}",
        "N8N_USERNAME": "${N8N_USERNAME}",
        "N8N_PASSWORD": "${N8N_PASSWORD}",
        "N8N_WEBHOOK_URL": "${N8N_WEBHOOK_URL}"
      },
      "description": "n8n workflow automation platform integration"
    },
    "crawl4ai_rag": {
      "command": "npx",
      "args": ["-y", "mcp-crawl4ai-rag"],
      "env": {
        "CRAWL4AI_API_KEY": "${CRAWL4AI_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      },
      "description": "Web crawling and RAG capabilities for intelligent content extraction and analysis"
    }
  }
}
```

### Enable All MCP Tools
Allow Claude Code to use all MCP server capabilities:

```bash
# Enable all MCP tools (use wildcards for each server)
claude --allowedTools "mcp__filesystem,mcp__github,mcp__gitlab,mcp__database,mcp__docker,mcp__kubernetes,mcp__aws,mcp__gcp,mcp__azure,mcp__slack,mcp__jira,mcp__confluence,mcp__notion,mcp__linear,mcp__monitoring,mcp__logging,mcp__api_testing,mcp__security,mcp__package_manager,mcp__ci_cd,mcp__n8n,mcp__crawl4ai_rag" \
  --mcp-config mcp-full-config.json
```

## Advanced System Prompts

### Comprehensive Development Assistant
Use this system prompt for maximum development capabilities:

```bash
claude --system-prompt "You are a senior full-stack software engineer with expertise in all programming languages, frameworks, and development tools. You have access to comprehensive tooling including:

- Full filesystem operations (read, write, create, delete, move, copy)
- Terminal and bash command execution
- Git version control operations
- Package managers (npm, pip, composer, etc.)
- Docker and Kubernetes container management
- Cloud platforms (AWS, GCP, Azure)
- Database operations and queries
- CI/CD pipeline management
- Security scanning and analysis
- API testing and documentation
- Team collaboration tools (Slack, Jira, Confluence, Notion, Linear)
- Monitoring and logging systems

CAPABILITIES:
1. Code Analysis & Review: Analyze code quality, security, performance, and best practices
2. Debugging & Testing: Identify bugs, write tests, and debug complex issues
3. Refactoring & Optimization: Improve code structure, performance, and maintainability
4. Documentation: Create comprehensive technical documentation
5. Deployment & DevOps: Handle deployments, infrastructure, and automation
6. Integration: Connect systems, APIs, and third-party services
7. Architecture: Design system architecture and technical solutions
8. Project Management: Track issues, manage tasks, and coordinate development

INSTRUCTIONS:
- Always use the most appropriate tools for each task
- Provide comprehensive solutions that consider all aspects of development
- Include error handling, testing, and documentation in all code
- Follow industry best practices and security guidelines
- Optimize for maintainability, scalability, and performance
- Communicate clearly about what you're doing and why
- Ask for clarification when requirements are ambiguous
- Suggest improvements and alternatives when appropriate

You have full access to all development tools and integrations. Use them effectively to provide the best possible assistance."
```

### Specialized Prompts for Different Scenarios

#### DevOps and Infrastructure
```bash
claude --append-system-prompt "Focus on infrastructure as code, containerization, CI/CD pipelines, monitoring, and cloud operations. Prioritize scalability, reliability, and security."
```

#### Security and Compliance
```bash
claude --append-system-prompt "Emphasize security best practices, vulnerability scanning, compliance requirements, and secure coding standards. Always consider security implications."
```

#### Performance Optimization
```bash
claude --append-system-prompt "Focus on performance optimization, profiling, load testing, and scalability improvements. Always measure and benchmark changes."
```

#### API Development
```bash
claude --append-system-prompt "Specialize in API design, documentation, testing, and integration. Follow RESTful principles and OpenAPI standards."
```

## Usage Examples

### Full-Capability Development Session
```bash
# Start a comprehensive development session
claude \
  --mcp-config mcp-full-config.json \
  --allowedTools "Read,Write,Bash,Git,mcp__filesystem,mcp__github,mcp__docker,mcp__aws,mcp__database,mcp__slack,mcp__jira" \
  --permission-mode acceptEdits \
  --max-turns 50 \
  --system-prompt "You are a senior full-stack engineer with access to all development tools and integrations." \
  --verbose
```

### Automated Project Setup
```bash
# Create a new project with full toolchain setup
claude -p "Create a new full-stack application with React frontend, Node.js backend, PostgreSQL database, Docker containerization, GitHub Actions CI/CD, and AWS deployment configuration" \
  --mcp-config mcp-full-config.json \
  --allowedTools "Read,Write,Bash,Git,mcp__filesystem,mcp__github,mcp__docker,mcp__aws,mcp__database,mcp__package_manager,mcp__ci_cd" \
  --permission-mode acceptEdits \
  --output-format json
```

### Code Review and Quality Analysis
```bash
# Comprehensive code review with security and performance analysis
claude -p "Perform a complete code review of the current project including security analysis, performance optimization, test coverage, documentation, and deployment readiness" \
  --mcp-config mcp-full-config.json \
  --allowedTools "Read,mcp__filesystem,mcp__security,mcp__github,mcp__database" \
  --max-turns 20
```

### Infrastructure and Deployment
```bash
# Full infrastructure setup and deployment
claude -p "Set up complete infrastructure for production deployment including Docker containers, Kubernetes manifests, CI/CD pipelines, monitoring, and logging" \
  --mcp-config mcp-full-config.json \
  --allowedTools "Write,Bash,mcp__docker,mcp__kubernetes,mcp__aws,mcp__ci_cd,mcp__monitoring,mcp__logging" \
  --permission-mode acceptEdits
```

## Environment Variables

Set these environment variables for full integration capabilities:

```bash
# Core authentication
export ANTHROPIC_API_KEY="your-anthropic-api-key"

# Version control
export GITHUB_TOKEN="your-github-token"
export GITLAB_TOKEN="your-gitlab-token"

# Cloud platforms
export AWS_ACCESS_KEY_ID="your-aws-access-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
export AWS_REGION="us-west-2"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/gcp-credentials.json"
export AZURE_CLIENT_ID="your-azure-client-id"
export AZURE_CLIENT_SECRET="your-azure-client-secret"
export AZURE_TENANT_ID="your-azure-tenant-id"

# Databases
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Container orchestration
export KUBECONFIG="/path/to/kubeconfig"

# Team collaboration
export SLACK_BOT_TOKEN="your-slack-bot-token"
export JIRA_URL="your-jira-instance"
export JIRA_TOKEN="your-jira-token"
export JIRA_EMAIL="your-email"
export CONFLUENCE_URL="your-confluence-instance"
export CONFLUENCE_TOKEN="your-confluence-token"
export CONFLUENCE_EMAIL="your-email"
export NOTION_TOKEN="your-notion-token"
export LINEAR_API_KEY="your-linear-api-key"

# Monitoring and logging
export PROMETHEUS_URL="your-prometheus-instance"
export ELASTICSEARCH_URL="your-elasticsearch-instance"

# API testing
export POSTMAN_API_KEY="your-postman-api-key"

# CI/CD
export JENKINS_URL="your-jenkins-instance"
export JENKINS_TOKEN="your-jenkins-token"

# n8n automation
export N8N_URL="https://pricklypair.app.n8n.cloud"
export N8N_USERNAME="pricklypairstudiosza@gmail.com"
export N8N_PASSWORD="your-n8n-password"
export N8N_WEBHOOK_URL="your-workflow-webhook-url"
# Note: API keys are typically configured per workflow/node in n8n

# Crawl4AI RAG integration
export CRAWL4AI_API_KEY="your-crawl4ai-api-key"
export OPENAI_API_KEY="your-openai-api-key"
```

## Best Practices

### 1. Tool Selection Strategy
- Use built-in tools for basic operations (Read, Write, Bash)
- Use MCP tools for specialized integrations
- Combine tools for complex workflows
- Always specify the most relevant tools for your use case

### 2. Permission Management
- Use `acceptEdits` for development workflows
- Use `plan` mode for review and verification
- Use `bypassPermissions` only for trusted automated processes
- Implement custom permission prompt tools for sensitive operations

### 3. Session Management
- Use `--continue` for iterative development
- Use `--resume` with specific session IDs for complex projects
- Save session IDs for long-running projects
- Use JSON output format for programmatic session handling

### 4. Error Handling
- Always check exit codes in scripts
- Use verbose mode for debugging
- Implement timeout mechanisms for long operations
- Log errors and responses for analysis

### 5. Security Considerations
- Rotate API keys regularly
- Use environment variables for sensitive data
- Implement proper access controls
- Audit tool usage and permissions
- Use secure credential storage systems

## Troubleshooting

### Common Issues and Solutions

#### MCP Server Connection Problems
```bash
# Test MCP server connectivity
claude --mcp-config mcp-full-config.json --verbose --allowedTools "mcp__filesystem__list_directory" -p "List current directory"
```

#### Tool Permission Errors
```bash
# Check available tools
claude --help

# Verify tool names and permissions
claude --allowedTools "Read,Write" --verbose -p "Test basic operations"
```

#### Authentication Issues
```bash
# Verify environment variables
env | grep -E "(ANTHROPIC|GITHUB|AWS|AZURE|GCP)"

# Test authentication
claude -p "Verify authentication status" --verbose
```

## Quick Start Templates

### Development Environment Setup
```bash
# Complete development environment with all tools
claude \
  --mcp-config mcp-full-config.json \
  --allowedTools "Read,Write,Bash,Git,mcp__filesystem,mcp__github,mcp__docker,mcp__package_manager" \
  --permission-mode acceptEdits \
  --append-system-prompt "Set up a complete development environment for the specified technology stack."
```

### Production Deployment
```bash
# Production deployment with monitoring
claude \
  --mcp-config mcp-full-config.json \
  --allowedTools "mcp__docker,mcp__kubernetes,mcp__aws,mcp__ci_cd,mcp__monitoring,mcp__logging" \
  --permission-mode plan \
  --append-system-prompt "Prepare production deployment with comprehensive monitoring and logging."
```

### Security Audit
```bash
# Security audit and compliance check
claude \
  --mcp-config mcp-full-config.json \
  --allowedTools "Read,mcp__security,mcp__github,mcp__filesystem" \
  --append-system-prompt "Perform comprehensive security audit including vulnerability scanning, dependency analysis, and compliance checking."
```

### Team Collaboration Setup
```bash
# Team tools integration
claude \
  --mcp-config mcp-full-config.json \
  --allowedTools "mcp__slack,mcp__jira,mcp__confluence,mcp__notion,mcp__linear,mcp__github" \
  --append-system-prompt "Configure team collaboration tools and integrate project management workflows."
```

## Advanced Configuration

### Custom MCP Server Examples
Create specialized MCP servers for your specific needs:

#### Database Migration Server
```json
{
  "mcpServers": {
    "db_migration": {
      "command": "node",
      "args": ["./custom-servers/db-migration-server.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "MIGRATION_PATH": "${MIGRATION_PATH}"
      }
    }
  }
}
```

#### Code Quality Server
```json
{
  "mcpServers": {
    "code_quality": {
      "command": "python",
      "args": ["./custom-servers/code-quality-server.py"],
      "env": {
        "SONAR_TOKEN": "${SONAR_TOKEN}",
        "CODECOV_TOKEN": "${CODECOV_TOKEN}"
      }
    }
  }
}
```

### Permission Prompt Tool Implementation
Example TypeScript implementation for custom permission handling:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";

const server = new McpServer({
  name: "Custom Permission Handler",
  version: "1.0.0",
});

server.tool(
  "permission_check",
  "Custom permission checking with project-specific rules",
  {
    tool_name: z.string().describe("The tool requesting permission"),
    input: z.object({}).passthrough().describe("The input for the tool"),
    project_context: z.string().optional().describe("Project context information"),
  },
  async ({ tool_name, input, project_context }) => {
    // Custom logic for permission checking
    const isAllowed = await checkProjectPermissions(tool_name, input, project_context);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            isAllowed
              ? {
                  behavior: "allow",
                  updatedInput: input,
                }
              : {
                  behavior: "deny",
                  message: `Permission denied for ${tool_name} in this project context`,
                }
          ),
        },
      ],
    };
  }
);
```

### Workflow Automation Scripts

#### Continuous Integration Script
```bash
#!/bin/bash
# CI/CD automation with Claude Code

set -e

PROJECT_DIR="$1"
ENVIRONMENT="${2:-staging}"

cd "$PROJECT_DIR"

# Run comprehensive project analysis
claude -p "Analyze project for CI/CD readiness including tests, documentation, security, and deployment configuration" \
  --mcp-config mcp-full-config.json \
  --allowedTools "Read,mcp__filesystem,mcp__security,mcp__github,mcp__ci_cd" \
  --output-format json \
  --max-turns 10 > analysis.json

# Extract recommendations
RECOMMENDATIONS=$(jq -r '.result' analysis.json)

# Apply recommendations if approved
echo "Analysis complete. Recommendations:"
echo "$RECOMMENDATIONS"

read -p "Apply recommendations? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    claude --continue "Apply the recommended changes for $ENVIRONMENT deployment" \
      --permission-mode acceptEdits \
      --max-turns 20
fi
```

#### Development Environment Bootstrap
```bash
#!/bin/bash
# Bootstrap new development environment

TECH_STACK="$1"
PROJECT_NAME="$2"

claude -p "Create a new $TECH_STACK project named $PROJECT_NAME with:
- Modern project structure and best practices
- Development dependencies and tooling
- Testing framework setup
- CI/CD pipeline configuration
- Docker containerization
- Documentation templates
- Git hooks and workflow" \
  --mcp-config mcp-full-config.json \
  --allowedTools "Write,Bash,Git,mcp__filesystem,mcp__github,mcp__docker,mcp__package_manager,mcp__ci_cd" \
  --permission-mode acceptEdits \
  --output-format json \
  --max-turns 25
```

This configuration enables Claude Code to utilize its full range of capabilities for comprehensive development assistance across all aspects of software engineering, from initial development through production deployment and maintenance.

---

## **🤖 N8N Workflow Templates Database**

A comprehensive collection of 400+ proven n8n workflow templates from top creators including Nick Saraev, Nate Herk, Cole Medin, and others. This database provides instant access to battle-tested automation workflows across multiple categories.

### **Template Categories**

1. **AI Agents & Assistants** - Personal assistants, multi-agent orchestrators, RAG systems
2. **Social Media Automation** - Content creation, posting, engagement tracking
3. **Content Creation** - Video generation, graphic design, copywriting automation
4. **Email & Communication** - Email management, outreach automation, customer support
5. **Data Scraping & Analysis** - Web scraping, data extraction, market research
6. **Business Process Automation** - CRM integration, lead management, sales processes
7. **Voice & Audio Processing** - Speech synthesis, transcription, voice assistants
8. **Image & Video Processing** - Media analysis, generation, editing workflows
9. **E-commerce & Marketing** - Product automation, ad management, price tracking
10. **Financial & Analytics** - Invoice processing, expense tracking, reporting

### **Template Manager CLI**

Access and manage templates via the command-line interface:

```bash
# Search for specific templates
node n8n-template-manager.js search "email automation"
node n8n-template-manager.js search "ai agent"

# Browse by creator
node n8n-template-manager.js creator "Nate Herk"
node n8n-template-manager.js creator "Nick Saraev"

# Browse by category
node n8n-template-manager.js category "AI Agents"
node n8n-template-manager.js category "Social Media"

# Get popular templates
node n8n-template-manager.js popular 10

# Download template reference
node n8n-template-manager.js download 0PJNiDuihBg

# Generate database report
node n8n-template-manager.js report

# List all creators and categories
node n8n-template-manager.js list-creators
node n8n-template-manager.js list-categories
```

### **Template Integration Examples**

#### **Quick Setup: Personal AI Assistant**
```bash
# Find personal assistant templates
node n8n-template-manager.js search "personal assistant"

# Get Nate Herk's popular assistant template
node n8n-template-manager.js download omw1MEvMCo0
```

#### **Social Media Automation**
```bash
# Find viral content creation templates
node n8n-template-manager.js search "viral"
node n8n-template-manager.js category "Social Media Automation"

# Download Instagram automation template
node n8n-template-manager.js download 9zBtU1mwOR4
```

#### **Business Process Automation**
```bash
# Find CRM and sales automation
node n8n-template-manager.js search "sales automation"
node n8n-template-manager.js search "lead generation"

# Get comprehensive sales templates
node n8n-template-manager.js creator "Jono Catliff"
```

### **Featured Template Collections**

#### **🌟 Beginner-Friendly Templates**
- **Email Auto Agent** (KIJHRq_Tg6o) - Automate email responses with AI
- **Google Sheets Automation** (c8D1PP2erbo) - Spreadsheet automation basics
- **Telegram Chatbot** (o8yhnqCF2gs) - Simple chat automation

#### **🚀 Advanced AI Systems**
- **Multi-Agent Orchestrator** (0iUNOmeU7O4) - Complex task delegation
- **Local AI Stack** (mNcXue7X8H0) - Self-hosted AI infrastructure
- **RAG AI Agent** (KC34sUqgU5A) - Knowledge-based AI assistants

#### **💼 Business Automation**
- **Lead Qualifier System** (oU8K3i5KqEc) - Automated lead qualification
- **CRM Data Automation** (_oNrsL0GJBw) - Customer data processing
- **Invoice Processing** (skHe-qIRkM4) - Financial document automation

#### **🎨 Content Creation**
- **Viral Shorts Machine** (BcfjIBd49C8) - Automated video creation
- **AI Copywriter Team** (GoDmjHs7o-M) - Content writing automation
- **Graphic Design AI** (DrqR7a7lmBE) - Visual content generation

### **Template Usage Workflow**

1. **Search & Discover**
   ```bash
   # Find templates matching your needs
   node n8n-template-manager.js search "your-use-case"
   ```

2. **Review Template Details**
   ```bash
   # Get comprehensive template information
   node n8n-template-manager.js download <template-id>
   ```

3. **Access Resources**
   - YouTube tutorial video for setup guidance
   - Template JSON file for direct import
   - Community resources and support

4. **Import & Customize**
   - Download the JSON template file
   - Import into your n8n instance
   - Customize credentials and configurations
   - Test and deploy

### **Template Development Standards**

All templates in the database follow these quality standards:

- **✅ Tested & Verified** - All workflows are tested by their creators
- **📚 Documentation** - Comprehensive setup instructions included
- **🎥 Video Tutorials** - Step-by-step video guides available
- **🆓 Free Access** - Most templates offer free versions
- **🔧 Customizable** - Easily adaptable to specific needs
- **🏷️ Properly Tagged** - Categorized for easy discovery

### **Template Creator Profiles**

- **Nate Herk** - AI automation specialist, 50+ templates
- **Nick Saraev** - Business automation expert, 25+ templates  
- **Cole Medin** - Local AI and infrastructure focus, 15+ templates
- **Jono Catliff** - Full-stack automation solutions, 30+ templates
- **Ben AI** - Enterprise automation workflows, 20+ templates
- **Mahmut Kasimoglu** - AI workflow optimization, 25+ templates

### **Quick Start Commands**

```bash
# Get overview of available templates
node n8n-template-manager.js report

# Find email automation templates
node n8n-template-manager.js search "email"

# Get all AI agent templates
node n8n-template-manager.js category "AI Agents"

# Popular recent templates
node n8n-template-manager.js popular 5

# Templates by difficulty level
node n8n-template-manager.js search "beginner"
```

This template database provides instant access to proven automation workflows, significantly reducing development time and ensuring best practices across all n8n implementations.

---

# Award-Winning UI Design Guide for Claude - 2025 Edition

This comprehensive guide provides Claude with the latest UI design trends, patterns, and best practices that are winning major design awards and trending on prestigious platforms like Awwwards, CSS Design Awards, Apple Design Awards, Dribbble, and Behance in 2025.

## **🏆 Award-Winning Design Principles**

### **Core Philosophy for 2025**
When designing UI/UX, prioritize these award-winning principles:

1. **Accessibility-First Design** - Every interface must be inclusive and accessible
2. **Meaningful Innovation** - Technology should enhance human experience, not complicate it
3. **Authentic Imperfection** - Embrace human touches over AI-generated perfection
4. **Sustainable Interaction** - Design for minimal cognitive load and energy efficiency
5. **Cultural Sensitivity** - Respect diverse backgrounds and global perspectives

### **Key Success Metrics from Award Winners**
- **Performance**: Sub-2 second load times, 60fps animations
- **Accessibility**: Full VoiceOver support, high contrast modes, keyboard navigation
- **Engagement**: 40%+ increase in user interaction time
- **Conversion**: 25-80% improvement in goal completion rates
- **Innovation**: Novel use of emerging technologies (AR/VR, AI, spatial design)

## **🎨 Trending Visual Aesthetics**

### **1. Interactive 3D Elements**
**Award-winning implementations:**
```css
/* Modern 3D card effect */
.award-winning-card {
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  backdrop-filter: blur(10px);
}

.award-winning-card:hover {
  transform: rotateY(15deg) rotateX(5deg) translateZ(50px);
}
```

**Best practices:**
- Use 3D for functional purposes, not just decoration
- Implement realistic lighting and shadows
- Create interactive product showcases with rotation capabilities
- Integrate AR elements for immersive experiences
- Optimize for performance across devices

### **2. Big Typography & Kinetic Text**
**Winning typography patterns:**
```css
/* Award-winning typography system */
.hero-typography {
  font-size: clamp(3rem, 8vw, 12rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.02em;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* Kinetic text animation */
@keyframes text-reveal {
  from { opacity: 0; transform: translateY(100px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Implementation guidelines:**
- Make typography the primary visual element
- Use oversized fonts (clamp 3rem to 12rem)
- Implement smooth text transitions and reveals
- Combine with minimal layouts for maximum impact
- Add interactive hover effects and micro-animations

### **3. Textured Grain Effects**
**Analog texture implementation:**
```css
/* Film grain overlay for authenticity */
.grain-texture {
  position: relative;
  overflow: hidden;
}

.grain-texture::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><filter id="grain"><feTurbulence baseFrequency="0.9" numOctaves="4"/></filter><rect width="100%" height="100%" filter="url(%23grain)" opacity="0.3"/></svg>');
  mix-blend-mode: multiply;
  pointer-events: none;
}
```

**Usage patterns:**
- Add subtle grain to combat AI-generated perfection
- Apply to backgrounds, images, and overlays
- Use for brand authenticity and tactile feel
- Implement with mix-blend-modes for integration
- Balance opacity (20-40%) for subtlety

### **4. Morphism & Blur Effects**
**Modern morphism techniques:**
```css
/* Glassmorphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
}

/* Neumorphism elements */
.neu-button {
  background: #e0e0e0;
  box-shadow: 
    20px 20px 60px #bebebe,
    -20px -20px 60px #ffffff;
  border-radius: 50px;
  transition: all 0.3s ease;
}
```

## **🚀 Award-Winning Interaction Patterns**

### **1. Voice User Interface (VUI)**
**Implementation framework:**
```javascript
// Award-winning VUI pattern
class VoiceInterface {
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.synthesis = window.speechSynthesis;
    this.setupVoiceCommands();
  }
  
  setupVoiceCommands() {
    const commands = {
      'navigate home': () => this.navigateTo('/'),
      'search for *': (query) => this.performSearch(query),
      'read this page': () => this.readContent(),
      'dark mode': () => this.toggleTheme(),
      'help': () => this.showHelp()
    };
    
    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      this.processCommand(command, commands);
    };
  }
}
```

### **2. AI-Powered Personalization**
**Adaptive interface system:**
```javascript
// Intelligent personalization engine
class PersonalizationEngine {
  constructor() {
    this.userProfile = this.loadUserProfile();
    this.behaviorTracker = new BehaviorTracker();
    this.contentAdaptation = new ContentAdaptation();
  }
  
  adaptInterface() {
    const preferences = this.analyzeUserBehavior();
    
    // Adaptive color scheme
    if (preferences.timeOfDay === 'evening') {
      this.enableDarkMode();
    }
    
    // Contextual navigation
    this.customizeNavigation(preferences.frequentSections);
    
    // Content prioritization
    this.reorderContent(preferences.interests);
    
    // Accessibility adjustments
    this.adjustAccessibility(preferences.accessibilityNeeds);
  }
}
```

### **3. Progressive Disclosure**
**Smart information architecture:**
```css
/* Progressive disclosure pattern */
.progressive-container {
  max-height: 200px;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.progressive-container.expanded {
  max-height: 2000px;
}

.show-more-trigger {
  background: linear-gradient(transparent, rgba(255,255,255,1));
  padding: 2rem 0 1rem;
  text-align: center;
}
```

## **📱 Platform-Specific Excellence**

### **Apple Design Award Standards**
**iOS/macOS best practices:**
```swift
// SwiftUI award-winning patterns
struct AwardWinningView: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Dynamic typography
            Text("Award-Winning Design")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundStyle(.linearGradient(
                    colors: [.blue, .purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
            
            // Interactive elements with haptics
            Button("Interact") {
                withAnimation(.spring(dampingFraction: 0.8)) {
                    isAnimating.toggle()
                }
                // Custom haptics
                let impact = UIImpactFeedbackGenerator(style: .medium)
                impact.impactOccurred()
            }
            .scaleEffect(isAnimating ? 1.1 : 1.0)
        }
        .accessibilityLabel("Main interaction button")
        .accessibilityHint("Double tap to trigger animation")
    }
}
```

### **Web Award Standards (Awwwards/CSS Design Awards)**
**Performance-optimized web patterns:**
```css
/* Award-winning page transitions */
.page-transition {
  --duration: 0.8s;
  --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-enter {
  opacity: 0;
  transform: translateY(100px);
  animation: pageEnter var(--duration) var(--ease) forwards;
}

@keyframes pageEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth scroll with momentum */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 2rem;
}

@media (prefers-reduced-motion: no-preference) {
  .scroll-container {
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
  }
}
```

## **🎯 Component Library Patterns**

### **Award-Winning Button System**
```css
/* Multi-state button system */
.btn {
  --btn-bg: #3b82f6;
  --btn-color: white;
  --btn-hover-bg: #2563eb;
  --btn-active-bg: #1d4ed8;
  
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: var(--btn-bg);
  color: var(--btn-color);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn:hover {
  background: var(--btn-hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.btn:active {
  background: var(--btn-active-bg);
  transform: translateY(0);
}

/* Accessibility states */
.btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### **Interactive Card System**
```css
/* Award-winning card pattern */
.interactive-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.interactive-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.interactive-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.interactive-card:hover::before {
  transform: scaleX(1);
}

/* Card content animations */
.card-content > * {
  transition: transform 0.3s ease;
}

.interactive-card:hover .card-content > * {
  transform: translateY(-2px);
}
```

## **🌟 Advanced Animation Techniques**

### **Award-Winning Micro-Interactions**
```javascript
// GSAP-based award-winning animations
class AwardWinningAnimations {
  constructor() {
    this.tl = gsap.timeline();
    this.setupScrollTriggers();
    this.initializeInteractions();
  }
  
  setupScrollTriggers() {
    // Parallax hero section
    gsap.registerPlugin(ScrollTrigger);
    
    gsap.to('.hero-bg', {
      yPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
    
    // Stagger animations for cards
    gsap.fromTo('.card', 
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.cards-container',
          start: 'top 80%'
        }
      }
    );
  }
  
  initializeInteractions() {
    // Magnetic buttons
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)'
        });
      });
    });
  }
}
```

### **Spatial Design for Vision Pro**
```css
/* Vision Pro spatial design patterns */
.spatial-container {
  transform-style: preserve-3d;
  perspective: 1000px;
  position: relative;
}

.spatial-layer {
  position: absolute;
  transform-style: preserve-3d;
  will-change: transform;
}

.spatial-layer:nth-child(1) { transform: translateZ(0px); }
.spatial-layer:nth-child(2) { transform: translateZ(50px); }
.spatial-layer:nth-child(3) { transform: translateZ(100px); }

/* Hand tracking responsive elements */
.hand-interactive {
  transition: all 0.2s ease;
  cursor: grab;
}

.hand-interactive:active {
  cursor: grabbing;
  transform: scale(1.05) translateZ(20px);
}

/* Eye tracking focus states */
.eye-trackable {
  transition: all 0.3s ease;
}

.eye-trackable:focus,
.eye-trackable.eye-focused {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(0, 123, 255, 0.3);
  z-index: 10;
}
```

## **♿ Accessibility Excellence**

### **Award-Winning Accessibility Patterns**
```css
/* Comprehensive accessibility system */
.accessible-component {
  /* Focus management */
  outline: none;
  position: relative;
}

.accessible-component::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid transparent;
  border-radius: inherit;
  transition: border-color 0.2s ease;
}

.accessible-component:focus-visible::before {
  border-color: #0066cc;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .accessible-component {
    border: 1px solid;
    background: Canvas;
    color: CanvasText;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .accessible-component,
  .accessible-component * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Color blind friendly patterns */
.status-indicator {
  /* Don't rely on color alone */
  position: relative;
}

.status-indicator.error {
  color: #d32f2f;
}

.status-indicator.error::before {
  content: '⚠';
  margin-right: 0.5rem;
}

.status-indicator.success {
  color: #388e3c;
}

.status-indicator.success::before {
  content: '✓';
  margin-right: 0.5rem;
}
```

### **Screen Reader Optimization**
```html
<!-- Award-winning semantic structure -->
<main role="main" aria-labelledby="main-heading">
  <h1 id="main-heading">Award-Winning Interface</h1>
  
  <!-- Skip navigation -->
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <!-- Interactive region -->
  <section aria-labelledby="interactive-section" role="region">
    <h2 id="interactive-section">Interactive Features</h2>
    
    <!-- Complex widget -->
    <div role="tabpanel" 
         aria-labelledby="tab-1"
         aria-describedby="panel-description">
      
      <!-- Live region for dynamic updates -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        Status updates will be announced here
      </div>
      
      <!-- Interactive elements -->
      <button aria-expanded="false" 
              aria-controls="dropdown-menu"
              aria-describedby="button-help">
        Open Menu
      </button>
      
      <div id="button-help" class="help-text">
        Use arrow keys to navigate menu items
      </div>
    </div>
  </section>
</main>
```

## **🎨 Color Systems & Typography**

### **Award-Winning Color Palettes 2025**
```css
/* Future Dust palette (Color of the Year) */
:root {
  --primary-future-dust: #4a4a5c;
  --primary-future-dust-light: #6b6b7d;
  --primary-future-dust-dark: #2a2a3c;
  
  /* Metallic accent system */
  --metallic-silver: #c0c0c0;
  --metallic-chrome: #e8e8e8;
  --metallic-platinum: #e5e4e2;
  
  /* High-energy complements */
  --accent-coral: #ff6b6b;
  --accent-teal: #4ecdc4;
  --accent-violet: #9b59b6;
  
  /* Adaptive color system */
  --surface: light-dark(#ffffff, #1a1a1a);
  --on-surface: light-dark(#1a1a1a, #ffffff);
  --surface-variant: light-dark(#f5f5f5, #2a2a2a);
}

/* Context-aware color adaptation */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-future-dust: #7d7d8f;
    --surface-opacity: 0.05;
  }
}
```

### **Typography Scale System**
```css
/* Award-winning typography scale */
:root {
  /* Fluid typography system */
  --font-size-xs: clamp(0.75rem, 0.5vw + 0.5rem, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.75vw + 0.625rem, 1rem);
  --font-size-base: clamp(1rem, 1vw + 0.75rem, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1.5vw + 0.875rem, 1.5rem);
  --font-size-xl: clamp(1.5rem, 2vw + 1rem, 2rem);
  --font-size-2xl: clamp(2rem, 3vw + 1.5rem, 3rem);
  --font-size-3xl: clamp(3rem, 5vw + 2rem, 6rem);
  --font-size-4xl: clamp(6rem, 8vw + 4rem, 12rem);
  
  /* Font families */
  --font-display: 'Inter Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  
  /* Typography spacing */
  --line-height-tight: 1.1;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.025em;
}

/* Responsive typography classes */
.typography-display {
  font-family: var(--font-display);
  font-size: var(--font-size-4xl);
  font-weight: 900;
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.typography-headline {
  font-family: var(--font-display);
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.typography-body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  font-weight: 400;
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}
```

## **📊 Performance Optimization**

### **Award-Winning Performance Patterns**
```javascript
// Critical performance optimizations
class PerformanceOptimizer {
  constructor() {
    this.setupCriticalResourceHints();
    this.implementLazyLoading();
    this.optimizeAnimations();
  }
  
  setupCriticalResourceHints() {
    // Preload critical resources
    const criticalResources = [
      { href: '/fonts/inter-display.woff2', as: 'font', type: 'font/woff2' },
      { href: '/images/hero-bg.webp', as: 'image' },
      { href: '/styles/critical.css', as: 'style' }
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.assign(link, resource);
      document.head.appendChild(link);
    });
  }
  
  implementLazyLoading() {
    // Intersection Observer for images
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  optimizeAnimations() {
    // Use transform and opacity for animations
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.transform = 'translateY(0)';
            entry.target.style.opacity = '1';
          }
        });
      },
      { threshold: 0.1 }
    );
    
    animatedElements.forEach(el => animationObserver.observe(el));
  }
}
```

## **🔧 Development Workflow**

### **Award-Winning Project Structure**
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Typography/
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── styles/
│   ├── globals.css        # Global styles and CSS custom properties
│   ├── components/        # Component-specific styles
│   └── utilities/         # Utility classes
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── constants/             # Design tokens and constants
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

### **Design Token System**
```javascript
// Design tokens for consistency
export const designTokens = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '800ms',
    },
    easing: {
      linear: 'linear',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};
```

## **🚀 Implementation Checklist**

### **Award-Winning Design Checklist**
- [ ] **Accessibility**: WCAG 2.1 AA compliance, screen reader testing
- [ ] **Performance**: <2s load time, >90 Lighthouse score
- [ ] **Responsive**: Works seamlessly across all devices
- [ ] **Interactive**: Meaningful micro-interactions and feedback
- [ ] **Typography**: Fluid, accessible typography scale
- [ ] **Colors**: High contrast ratios, dark mode support
- [ ] **Animations**: 60fps animations with reduced motion support
- [ ] **Navigation**: Intuitive, keyboard accessible
- [ ] **Forms**: Clear validation, error states
- [ ] **Loading States**: Skeleton screens, progressive enhancement
- [ ] **Error Handling**: Graceful error states and recovery
- [ ] **Cross-browser**: Testing in major browsers
- [ ] **SEO**: Semantic HTML, proper meta tags
- [ ] **Security**: Content Security Policy, HTTPS

### **Innovation Opportunities**
- [ ] **AI Integration**: Personalization, smart defaults
- [ ] **Voice Interface**: Voice commands, speech synthesis
- [ ] **Gesture Control**: Touch gestures, spatial interactions
- [ ] **AR/VR Elements**: Immersive experiences
- [ ] **Progressive Enhancement**: Works without JavaScript
- [ ] **Offline Support**: Service workers, cache strategies
- [ ] **Real-time Features**: Live updates, collaboration
- [ ] **Sustainability**: Energy-efficient design choices

This guide provides Claude with the comprehensive knowledge needed to create award-winning UI designs that follow 2025's best practices, accessibility standards, and innovative interaction patterns. Always prioritize user needs, accessibility, and meaningful innovation over purely aesthetic trends.

---

# Claude Code SDK - Programmatic Integration Guide

This section provides comprehensive instructions for integrating Claude Code programmatically into applications and workflows using the Claude Code SDK across command line, TypeScript, and Python environments.

## **🔧 SDK Overview**

The Claude Code SDK enables running Claude Code as a subprocess, providing a way to build AI-powered coding assistants and tools that leverage Claude's capabilities in non-interactive mode from your applications.

### **Available SDKs**
- **Command Line**: Direct CLI integration
- **TypeScript/Node.js**: `@anthropic-ai/claude-code` package
- **Python**: `claude-code-sdk` package on PyPI

## **🔑 Authentication Setup**

### **API Key Configuration**
```bash
# Create a dedicated API key in the Anthropic Console
export ANTHROPIC_API_KEY="your-api-key-here"

# For production environments, use secure storage
# GitHub Actions: Store as repository secret
# Docker: Use secrets management
# Kubernetes: Use secret objects
```

### **Security Best Practices**
- Create dedicated API keys for each integration
- Use environment-specific keys (dev, staging, prod)
- Implement key rotation policies
- Store keys in secure credential management systems
- Never commit API keys to version control

## **💻 Command Line SDK**

### **Basic Usage Patterns**
```bash
# Single prompt execution
claude -p "Write a function to calculate Fibonacci numbers"

# Pipe input from stdin
echo "Explain this code" | claude -p

# JSON output with metadata
claude -p "Generate a hello world function" --output-format json

# Streaming JSON output
claude -p "Build a React component" --output-format stream-json

# Multi-turn conversations
claude --continue "Now refactor this for better performance"

# Resume specific session
claude --resume 550e8400-e29b-41d4-a716-446655440000

# Custom system prompts
claude -p "Build a REST API" --system-prompt "You are a senior backend engineer. Focus on security, performance, and maintainability."

# Append to default system prompt
claude -p "Create a database schema" --append-system-prompt "Use PostgreSQL best practices and include proper indexing."
```

### **Advanced CLI Options**
```bash
# Maximum capability configuration
claude -p "Create a full-stack application" \
  --allowed-tools "Read,Write,Bash,Git,mcp__filesystem,mcp__github,mcp__docker" \
  --permission-mode acceptEdits \
  --max-turns 25 \
  --output-format json \
  --system-prompt "You are a senior full-stack engineer with access to all development tools."

# CI/CD integration
claude -p "Analyze code quality and security" \
  --allowed-tools "Read,mcp__security,mcp__github" \
  --output-format json \
  --max-turns 5 > analysis.json
```

## **🟦 TypeScript/Node.js SDK**

### **Installation & Setup**
```bash
npm install @anthropic-ai/claude-code
```

### **Basic Implementation**
```typescript
import { query, type SDKMessage } from "@anthropic-ai/claude-code";

// Simple query execution
const messages: SDKMessage[] = [];

for await (const message of query({
  prompt: "Write a haiku about foo.py",
  abortController: new AbortController(),
  options: {
    maxTurns: 3,
  },
})) {
  messages.push(message);
}

console.log(messages);
```

### **Advanced TypeScript Patterns**
```typescript
import { query, type SDKMessage, type ClaudeCodeOptions } from "@anthropic-ai/claude-code";

class ClaudeCodeIntegration {
  private abortController: AbortController;
  
  constructor() {
    this.abortController = new AbortController();
  }

  async generateCode(prompt: string, options?: Partial<ClaudeCodeOptions>): Promise<SDKMessage[]> {
    const messages: SDKMessage[] = [];
    
    const defaultOptions: ClaudeCodeOptions = {
      maxTurns: 10,
      allowedTools: ["Read", "Write", "Bash", "Git"],
      permissionMode: "acceptEdits",
      systemPrompt: "You are a senior full-stack engineer with expertise in modern development practices.",
      outputFormat: "json",
      ...options
    };

    try {
      for await (const message of query({
        prompt,
        abortController: this.abortController,
        options: defaultOptions,
        cwd: process.cwd(),
      })) {
        messages.push(message);
        
        // Real-time processing
        this.processMessage(message);
      }
    } catch (error) {
      console.error("Claude Code execution failed:", error);
      throw error;
    }

    return messages;
  }

  private processMessage(message: SDKMessage): void {
    // Handle different message types
    switch (message.type) {
      case 'tool_use':
        console.log(`Tool used: ${message.tool}`);
        break;
      case 'text':
        console.log(`Response: ${message.content}`);
        break;
      default:
        console.log('Unknown message type:', message);
    }
  }

  abort(): void {
    this.abortController.abort();
  }
}

// Usage examples
const claude = new ClaudeCodeIntegration();

// Generate a React component
await claude.generateCode("Create a responsive dashboard component with TypeScript", {
  allowedTools: ["Read", "Write", "mcp__filesystem"],
  maxTurns: 15
});

// Code review automation
await claude.generateCode("Review the current codebase for security vulnerabilities", {
  allowedTools: ["Read", "mcp__security", "mcp__github"],
  systemPrompt: "You are a security expert. Focus on identifying potential vulnerabilities and provide actionable recommendations."
});
```

### **Enterprise Integration Patterns**
```typescript
// GitHub Actions integration
export async function autoCodeReview(prNumber: string): Promise<void> {
  const claude = new ClaudeCodeIntegration();
  
  const messages = await claude.generateCode(
    `Review PR #${prNumber} for:
    - Code quality and best practices
    - Security vulnerabilities
    - Performance optimizations
    - Test coverage
    - Documentation completeness`,
    {
      allowedTools: ["Read", "mcp__github", "mcp__security"],
      outputFormat: "json",
      maxTurns: 8
    }
  );
  
  // Process review results and post comments
  await postReviewResults(prNumber, messages);
}

// Slack bot integration
export async function handleSlackCommand(command: string, channel: string): Promise<void> {
  const claude = new ClaudeCodeIntegration();
  
  const messages = await claude.generateCode(command, {
    allowedTools: ["Read", "Write", "Bash"],
    maxTurns: 5,
    systemPrompt: "You are a helpful development assistant. Provide concise, actionable responses suitable for Slack."
  });
  
  await sendSlackResponse(channel, messages);
}

// VS Code extension integration
export class ClaudeCodeExtension {
  async explainCode(selectedText: string, filePath: string): Promise<string> {
    const claude = new ClaudeCodeIntegration();
    
    const messages = await claude.generateCode(
      `Explain this code from ${filePath}:\n\n${selectedText}`,
      {
        allowedTools: ["Read"],
        maxTurns: 2,
        systemPrompt: "Provide clear, educational explanations of code. Focus on what the code does, why it works that way, and any potential improvements."
      }
    );
    
    return messages.map(m => m.content).join('\n');
  }

  async generateTests(filePath: string): Promise<void> {
    const claude = new ClaudeCodeIntegration();
    
    await claude.generateCode(
      `Generate comprehensive tests for ${filePath}. Include unit tests, integration tests, and edge cases.`,
      {
        allowedTools: ["Read", "Write"],
        maxTurns: 10,
        systemPrompt: "You are a test automation expert. Write thorough, maintainable tests following current best practices."
      }
    );
  }
}
```

## **🐍 Python SDK**

### **Installation & Setup**
```bash
pip install claude-code-sdk

# Prerequisites
# Python 3.10+
# Node.js
# Claude Code CLI: npm install -g @anthropic-ai/claude-code
```

### **Basic Implementation**
```python
import anyio
from claude_code_sdk import query, ClaudeCodeOptions, Message

async def main():
    messages: list[Message] = []
    
    async for message in query(
        prompt="Write a haiku about foo.py",
        options=ClaudeCodeOptions(max_turns=3)
    ):
        messages.append(message)
    
    print(messages)

anyio.run(main)
```

### **Advanced Python Patterns**
```python
import anyio
from claude_code_sdk import query, ClaudeCodeOptions, Message
from pathlib import Path
from typing import AsyncGenerator, List, Optional
import json

class ClaudeCodeIntegration:
    def __init__(self, project_path: Optional[Path] = None):
        self.project_path = project_path or Path.cwd()
        self.default_options = ClaudeCodeOptions(
            max_turns=10,
            allowed_tools=["Read", "Write", "Bash", "Git"],
            permission_mode="acceptEdits",
            system_prompt="You are a senior full-stack engineer with expertise in modern development practices.",
            cwd=self.project_path
        )
    
    async def generate_code(
        self, 
        prompt: str, 
        custom_options: Optional[ClaudeCodeOptions] = None
    ) -> List[Message]:
        """Generate code with Claude Code SDK"""
        options = custom_options or self.default_options
        messages: List[Message] = []
        
        try:
            async for message in query(prompt=prompt, options=options):
                messages.append(message)
                await self._process_message(message)
        except Exception as e:
            print(f"Claude Code execution failed: {e}")
            raise
        
        return messages
    
    async def _process_message(self, message: Message) -> None:
        """Process incoming messages in real-time"""
        if hasattr(message, 'type'):
            if message.type == 'tool_use':
                print(f"Tool used: {message.tool}")
            elif message.type == 'text':
                print(f"Response: {message.content}")
    
    async def stream_code_generation(
        self, 
        prompt: str, 
        custom_options: Optional[ClaudeCodeOptions] = None
    ) -> AsyncGenerator[Message, None]:
        """Stream code generation responses"""
        options = custom_options or self.default_options
        
        async for message in query(prompt=prompt, options=options):
            yield message

# Advanced usage examples
async def build_fastapi_app():
    """Build a complete FastAPI application"""
    claude = ClaudeCodeIntegration()
    
    options = ClaudeCodeOptions(
        max_turns=20,
        allowed_tools=["Read", "Write", "Bash", "mcp__filesystem"],
        permission_mode="acceptEdits",
        system_prompt="""You are a senior Python backend engineer. 
        Create production-ready code with:
        - Proper error handling
        - Type hints
        - Comprehensive tests
        - Security best practices
        - Performance optimization"""
    )
    
    await claude.generate_code(
        """Create a FastAPI application with:
        - User authentication with JWT
        - CRUD operations for a blog system
        - Database integration with SQLAlchemy
        - Input validation with Pydantic
        - Comprehensive test suite
        - Docker containerization
        - API documentation""",
        options
    )

async def automate_code_review():
    """Automated code review system"""
    claude = ClaudeCodeIntegration()
    
    options = ClaudeCodeOptions(
        max_turns=8,
        allowed_tools=["Read", "mcp__github", "mcp__security"],
        system_prompt="""You are a senior code reviewer. Analyze code for:
        - Security vulnerabilities
        - Performance issues
        - Code quality and maintainability
        - Best practices compliance
        - Test coverage gaps"""
    )
    
    messages = await claude.generate_code(
        "Review all Python files in the current repository and provide detailed feedback",
        options
    )
    
    # Generate review report
    review_report = {
        "timestamp": "2025-01-01T00:00:00Z",
        "findings": [msg.content for msg in messages],
        "recommendations": []
    }
    
    with open("code_review_report.json", "w") as f:
        json.dump(review_report, f, indent=2)

# Django integration
class DjangoClaudeIntegration:
    def __init__(self):
        self.claude = ClaudeCodeIntegration()
    
    async def generate_model(self, model_description: str) -> None:
        """Generate Django models with migrations"""
        await self.claude.generate_code(
            f"Create Django model: {model_description}. Include proper field types, relationships, and generate migration.",
            ClaudeCodeOptions(
                allowed_tools=["Read", "Write", "Bash"],
                max_turns=5,
                system_prompt="You are a Django expert. Follow Django best practices and conventions."
            )
        )
    
    async def generate_api_views(self, model_name: str) -> None:
        """Generate DRF API views"""
        await self.claude.generate_code(
            f"Create Django REST Framework views for {model_name} with full CRUD operations, serializers, and viewsets.",
            ClaudeCodeOptions(
                allowed_tools=["Read", "Write"],
                max_turns=8,
                system_prompt="You are a Django REST Framework expert. Create production-ready API endpoints with proper serialization, permissions, and pagination."
            )
        )

# Flask integration
class FlaskClaudeIntegration:
    def __init__(self):
        self.claude = ClaudeCodeIntegration()
    
    async def create_blueprint(self, blueprint_name: str, description: str) -> None:
        """Create Flask blueprint with routes"""
        await self.claude.generate_code(
            f"Create Flask blueprint '{blueprint_name}': {description}",
            ClaudeCodeOptions(
                allowed_tools=["Read", "Write"],
                max_turns=6,
                system_prompt="You are a Flask expert. Create modular, testable Flask applications with proper error handling."
            )
        )

# Usage examples
async def main():
    # Build FastAPI app
    await build_fastapi_app()
    
    # Automated code review
    await automate_code_review()
    
    # Django integration
    django_claude = DjangoClaudeIntegration()
    await django_claude.generate_model("User profile with avatar, bio, social links")
    await django_claude.generate_api_views("UserProfile")
    
    # Flask integration
    flask_claude = FlaskClaudeIntegration()
    await flask_claude.create_blueprint("auth", "User authentication with login, logout, registration")

if __name__ == "__main__":
    anyio.run(main)
```

## **🔧 Advanced Integration Patterns**

### **CI/CD Pipeline Integration**
```yaml
# GitHub Actions workflow
name: AI Code Review
on: [pull_request]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      - name: Run AI Code Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "Review this PR for security, performance, and best practices" \
            --allowed-tools "Read,mcp__security,mcp__github" \
            --output-format json \
            --max-turns 5 > review.json
      - name: Post Review Comments
        run: node scripts/post-review.js
```

### **Docker Integration**
```dockerfile
# Dockerfile for Claude Code integration
FROM node:18-alpine

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Install Python SDK
RUN apk add --no-cache python3 py3-pip
RUN pip3 install claude-code-sdk

# Copy application
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm install

# Set environment variables
ENV ANTHROPIC_API_KEY=""

# Run application
CMD ["node", "app.js"]
```

### **Kubernetes Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-code-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: claude-code-service
  template:
    metadata:
      labels:
        app: claude-code-service
    spec:
      containers:
      - name: claude-code
        image: your-registry/claude-code-app:latest
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: claude-code-secrets
              key: api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Secret
metadata:
  name: claude-code-secrets
type: Opaque
data:
  api-key: <base64-encoded-api-key>
```

## **🎯 Real-World Applications**

### **1. Automated Development Assistants**
```typescript
// Slack bot for development assistance
class SlackDevBot {
  private claude = new ClaudeCodeIntegration();
  
  async handleCommand(command: string, channel: string): Promise<void> {
    const responses = await this.claude.generateCode(command, {
      allowedTools: ["Read", "Write", "Bash"],
      maxTurns: 5,
      systemPrompt: "You are a helpful development assistant for Slack. Provide concise, actionable responses."
    });
    
    await this.postToSlack(channel, responses);
  }
}

// Discord bot for code help
class DiscordCodeBot {
  async explainCode(code: string): Promise<string> {
    const claude = new ClaudeCodeIntegration();
    const messages = await claude.generateCode(
      `Explain this code in simple terms:\n\n${code}`,
      { maxTurns: 2 }
    );
    return messages.map(m => m.content).join('\n');
  }
}
```

### **2. Custom Development Environments**
```python
# VS Code extension backend
class VSCodeClaudeExtension:
    def __init__(self):
        self.claude = ClaudeCodeIntegration()
    
    async def generate_function(self, description: str, language: str) -> str:
        """Generate function based on description"""
        prompt = f"Create a {language} function that {description}"
        options = ClaudeCodeOptions(
            max_turns=3,
            allowed_tools=["Write"],
            system_prompt=f"You are an expert {language} programmer. Write clean, efficient, well-documented code."
        )
        
        messages = await self.claude.generate_code(prompt, options)
        return messages[-1].content if messages else ""
    
    async def refactor_code(self, code: str, requirements: str) -> str:
        """Refactor existing code"""
        prompt = f"Refactor this code according to: {requirements}\n\nCode:\n{code}"
        options = ClaudeCodeOptions(
            max_turns=5,
            allowed_tools=["Read", "Write"],
            system_prompt="You are a refactoring expert. Improve code while maintaining functionality."
        )
        
        messages = await self.claude.generate_code(prompt, options)
        return messages[-1].content if messages else ""

# Web-based IDE integration
class WebIDEBackend:
    async def compile_and_run(self, code: str, language: str) -> dict:
        """Compile and run code with error handling"""
        claude = ClaudeCodeIntegration()
        
        prompt = f"Analyze this {language} code for errors and suggest fixes:\n\n{code}"
        options = ClaudeCodeOptions(
            max_turns=3,
            allowed_tools=["Read", "Bash"],
            system_prompt="You are a code analysis expert. Identify errors and provide solutions."
        )
        
        messages = await claude.generate_code(prompt, options)
        
        return {
            "analysis": messages,
            "suggestions": [msg.content for msg in messages if "suggestion" in msg.content.lower()]
        }
```

### **3. Enterprise Solutions**
```typescript
// Enterprise code migration tool
class CodeMigrationService {
  private claude = new ClaudeCodeIntegration();
  
  async migrateLegacyCode(
    sourcePath: string, 
    targetFramework: string
  ): Promise<MigrationResult> {
    const options: ClaudeCodeOptions = {
      allowedTools: ["Read", "Write", "mcp__filesystem"],
      maxTurns: 25,
      systemPrompt: `You are a legacy code migration expert. Convert code to ${targetFramework} while preserving functionality and improving maintainability.`
    };
    
    const messages = await this.claude.generateCode(
      `Migrate the codebase in ${sourcePath} to ${targetFramework}. Maintain all existing functionality while modernizing the code structure.`,
      options
    );
    
    return this.processMigrationResults(messages);
  }
  
  private processMigrationResults(messages: SDKMessage[]): MigrationResult {
    // Process migration results and generate report
    return {
      status: 'completed',
      migratedFiles: [],
      issues: [],
      recommendations: []
    };
  }
}

// Architecture analysis system
class ArchitectureAnalyzer {
  async analyzeCodebase(projectPath: string): Promise<ArchitectureReport> {
    const claude = new ClaudeCodeIntegration();
    
    const messages = await claude.generateCode(
      `Analyze the architecture of the codebase in ${projectPath}. Provide insights on:
      - Code organization and structure
      - Design patterns used
      - Potential architectural improvements
      - Scalability considerations
      - Technical debt assessment`,
      {
        allowedTools: ["Read", "mcp__filesystem"],
        maxTurns: 15,
        systemPrompt: "You are a senior software architect. Provide detailed architectural analysis and recommendations."
      }
    );
    
    return this.generateArchitectureReport(messages);
  }
}
```

### **4. Educational Tools**
```python
# Interactive coding tutor
class CodingTutor:
    def __init__(self):
        self.claude = ClaudeCodeIntegration()
    
    async def explain_concept(self, concept: str, level: str) -> str:
        """Explain programming concepts at different levels"""
        prompt = f"Explain {concept} for a {level} programmer with examples"
        options = ClaudeCodeOptions(
            max_turns=3,
            system_prompt="You are a patient programming instructor. Use clear explanations and practical examples."
        )
        
        messages = await self.claude.generate_code(prompt, options)
        return messages[-1].content if messages else ""
    
    async def grade_assignment(self, assignment: str, solution: str) -> dict:
        """Grade programming assignments"""
        prompt = f"Grade this assignment:\n\nAssignment: {assignment}\n\nStudent Solution: {solution}"
        options = ClaudeCodeOptions(
            max_turns=5,
            allowed_tools=["Read"],
            system_prompt="You are a programming instructor. Provide constructive feedback and suggestions for improvement."
        )
        
        messages = await self.claude.generate_code(prompt, options)
        
        return {
            "grade": "A",  # Extract grade from response
            "feedback": messages[-1].content,
            "suggestions": []
        }

# Learning path generator
class LearningPathGenerator:
    async def create_curriculum(self, topic: str, duration: str) -> list:
        """Generate personalized learning curricula"""
        claude = ClaudeCodeIntegration()
        
        prompt = f"Create a {duration} learning path for {topic} with hands-on projects"
        options = ClaudeCodeOptions(
            max_turns=8,
            system_prompt="You are an expert educator. Create structured, practical learning paths with clear milestones."
        )
        
        messages = await claude.generate_code(prompt, options)
        return self.parse_curriculum(messages)
```

## **🔒 Security & Best Practices**

### **API Key Management**
```typescript
// Secure API key management
class SecureClaudeIntegration {
  private apiKey: string;
  
  constructor() {
    this.apiKey = this.getSecureApiKey();
  }
  
  private getSecureApiKey(): string {
    // In production, use secure key management
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY environment variable not set");
    }
    return key;
  }
  
  // Implement key rotation
  async rotateApiKey(): Promise<void> {
    const newKey = await this.fetchNewApiKey();
    this.apiKey = newKey;
    process.env.ANTHROPIC_API_KEY = newKey;
  }
}
```

### **Rate Limiting & Error Handling**
```python
import asyncio
from functools import wraps
from typing import Callable

class RateLimitedClaudeIntegration:
    def __init__(self, max_requests_per_minute: int = 60):
        self.claude = ClaudeCodeIntegration()
        self.request_times = []
        self.max_requests = max_requests_per_minute
    
    async def rate_limited_query(self, prompt: str, options: ClaudeCodeOptions = None):
        """Query with rate limiting"""
        await self._check_rate_limit()
        
        try:
            return await self.claude.generate_code(prompt, options)
        except Exception as e:
            await self._handle_error(e)
            raise
    
    async def _check_rate_limit(self):
        """Implement rate limiting logic"""
        current_time = time.time()
        # Remove requests older than 1 minute
        self.request_times = [t for t in self.request_times if current_time - t < 60]
        
        if len(self.request_times) >= self.max_requests:
            sleep_time = 60 - (current_time - self.request_times[0])
            await asyncio.sleep(sleep_time)
        
        self.request_times.append(current_time)
    
    async def _handle_error(self, error: Exception):
        """Handle different types of errors"""
        if "rate_limit" in str(error).lower():
            await asyncio.sleep(60)  # Wait before retry
        elif "authentication" in str(error).lower():
            # Handle auth errors
            await self._refresh_credentials()
        else:
            # Log other errors
            print(f"Unexpected error: {error}")
```

## **📊 Monitoring & Analytics**

### **Usage Tracking**
```typescript
class ClaudeAnalytics {
  private metrics: Map<string, number> = new Map();
  
  trackUsage(operation: string, duration: number, success: boolean): void {
    const key = `${operation}_${success ? 'success' : 'failure'}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    
    // Track performance
    this.metrics.set(`${operation}_avg_duration`, 
      ((this.metrics.get(`${operation}_avg_duration`) || 0) + duration) / 2
    );
  }
  
  generateReport(): AnalyticsReport {
    return {
      totalRequests: Array.from(this.metrics.values()).reduce((a, b) => a + b, 0),
      successRate: this.calculateSuccessRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
      topOperations: this.getTopOperations()
    };
  }
}
```

This comprehensive SDK integration guide enables Claude Code to be embedded into any application or workflow, providing programmatic access to all AI-powered development capabilities across multiple programming languages and environments.

---

# **🕸️ Crawl4AI RAG MCP Server - Advanced Web Intelligence**

A powerful Model Context Protocol (MCP) server that provides AI agents and coding assistants with advanced web crawling and RAG (Retrieval-Augmented Generation) capabilities. This server enables intelligent content extraction, storage, and retrieval from web sources.

## **🎯 Overview & Vision**

The Crawl4AI RAG MCP server transforms how AI agents interact with web content by providing:

- **Smart Web Crawling**: Automatically detects and handles different URL types (webpages, sitemaps, text files)
- **Advanced RAG Strategies**: Multiple sophisticated retrieval techniques beyond basic lookups
- **Vector Database Integration**: Stores and searches content using Supabase with pgvector
- **Knowledge Graph Support**: AI hallucination detection and repository code analysis
- **Performance Optimization**: Parallel processing and intelligent chunking

### **Future Vision**
- Integration with Archon for comprehensive knowledge engines
- Multiple embedding models including local Ollama support
- Enhanced chunking strategies inspired by Context 7
- Real-time documentation indexing and retrieval

## **🛠️ Core Features & Tools**

### **Essential Tools (Always Available)**

#### **crawl_single_page**
```bash
# Quickly crawl and store a single webpage
claude -p "Crawl and analyze https://docs.anthropic.com/claude/docs"
```

#### **smart_crawl_url**
```bash
# Intelligently crawl entire websites based on URL type
claude -p "Crawl the entire documentation at https://fastapi.tiangolo.com/sitemap.xml"
```

#### **get_available_sources**
```bash
# List all available sources in the database
claude -p "Show me all available documentation sources for RAG queries"
```

#### **perform_rag_query**
```bash
# Search for relevant content with optional source filtering
claude -p "Search for 'async functions' in Python documentation only"
```

### **Advanced Tools (Conditional)**

#### **search_code_examples** (requires USE_AGENTIC_RAG=true)
```bash
# Search specifically for code examples and implementations
claude -p "Find code examples for FastAPI authentication middleware"
```

#### **Knowledge Graph Tools** (requires USE_KNOWLEDGE_GRAPH=true)

**parse_github_repository**
```bash
# Parse GitHub repository into knowledge graph
claude -p "Add https://github.com/pydantic/pydantic-ai.git to the knowledge graph"
```

**check_ai_script_hallucinations**
```bash
# Validate AI-generated code against knowledge graph
claude -p "Check this Python script for hallucinations against the pydantic-ai repository"
```

**query_knowledge_graph**
```bash
# Explore and query the Neo4j knowledge graph
claude -p "Show me all classes and methods available in the FastAPI repository"
```

## **⚙️ RAG Strategy Configuration**

The server supports five powerful RAG strategies that can be enabled independently:

### **1. Contextual Embeddings (USE_CONTEXTUAL_EMBEDDINGS)**
```env
USE_CONTEXTUAL_EMBEDDINGS=true
```
**Purpose**: Enhances chunk embeddings with document context for precision
**Use Case**: Technical documentation where context matters
**Trade-offs**: Slower indexing, higher accuracy

### **2. Hybrid Search (USE_HYBRID_SEARCH)**
```env
USE_HYBRID_SEARCH=true
```
**Purpose**: Combines keyword and semantic search
**Use Case**: Technical terms and function names
**Trade-offs**: Slightly slower queries, more robust results

### **3. Agentic RAG (USE_AGENTIC_RAG)**
```env
USE_AGENTIC_RAG=true
```
**Purpose**: Specialized code example extraction and storage
**Use Case**: AI coding assistants needing code examples
**Trade-offs**: Slower crawling, dedicated code search capabilities

### **4. Reranking (USE_RERANKING)**
```env
USE_RERANKING=true
```
**Purpose**: Cross-encoder reranking for result relevance
**Use Case**: Critical search precision requirements
**Trade-offs**: 100-200ms query overhead, better result ordering

### **5. Knowledge Graph (USE_KNOWLEDGE_GRAPH)**
```env
USE_KNOWLEDGE_GRAPH=true
```
**Purpose**: AI hallucination detection and repository analysis
**Use Case**: Code validation against real implementations
**Trade-offs**: Requires Neo4j, slower repository parsing

## **🚀 Installation & Setup**

### **Docker Installation (Recommended)**
```bash
# Clone repository
git clone https://github.com/coleam00/mcp-crawl4ai-rag.git
cd mcp-crawl4ai-rag

# Build Docker image
docker build -t mcp/crawl4ai-rag --build-arg PORT=8051 .

# Create environment configuration
cp .env.example .env
# Edit .env with your configuration

# Run server
docker run --env-file .env -p 8051:8051 mcp/crawl4ai-rag
```

### **Direct Python Installation**
```bash
# Clone repository
git clone https://github.com/coleam00/mcp-crawl4ai-rag.git
cd mcp-crawl4ai-rag

# Install uv
pip install uv

# Create virtual environment
uv venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate    # Windows

# Install dependencies
uv pip install -e .
crawl4ai-setup

# Run server
uv run src/crawl4ai_mcp.py
```

### **Database Setup (Supabase)**
```sql
-- Run in Supabase SQL Editor
-- Create pgvector extension and tables
CREATE EXTENSION IF NOT EXISTS vector;

-- Create crawled_pages table
CREATE TABLE crawled_pages (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    chunk_text TEXT,
    embedding VECTOR(1536),
    source_domain TEXT,
    crawled_at TIMESTAMP DEFAULT NOW(),
    chunk_index INTEGER DEFAULT 0
);

-- Create code_examples table (for Agentic RAG)
CREATE TABLE code_examples (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    code_content TEXT,
    summary TEXT,
    embedding VECTOR(1536),
    source_domain TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create similarity search functions
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.78,
    match_count INT DEFAULT 10,
    filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    url TEXT,
    title TEXT,
    chunk_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $
BEGIN
    RETURN QUERY
    SELECT 
        crawled_pages.id,
        crawled_pages.url,
        crawled_pages.title,
        crawled_pages.chunk_text,
        1 - (crawled_pages.embedding <=> query_embedding) as similarity
    FROM crawled_pages
    WHERE 
        (filter_source IS NULL OR crawled_pages.source_domain = filter_source)
        AND 1 - (crawled_pages.embedding <=> query_embedding) > match_threshold
    ORDER BY crawled_pages.embedding <=> query_embedding
    LIMIT match_count;
END;
$;
```

### **Knowledge Graph Setup (Neo4j - Optional)**
```bash
# Using Local AI Package (Recommended)
git clone https://github.com/coleam00/local-ai-packaged.git
cd local-ai-packaged
# Follow repository instructions to start Neo4j

# Manual Neo4j Installation
# Download from neo4j.com/download
# Create new database with credentials:
# URI: bolt://localhost:7687
# Username: neo4j
# Password: your_password
```

## **🔧 Environment Configuration**

### **Complete .env Configuration**
```env
# MCP Server Configuration
HOST=0.0.0.0
PORT=8051
TRANSPORT=sse

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
MODEL_CHOICE=gpt-4o-mini

# RAG Strategies Configuration
USE_CONTEXTUAL_EMBEDDINGS=false
USE_HYBRID_SEARCH=true
USE_AGENTIC_RAG=false
USE_RERANKING=true
USE_KNOWLEDGE_GRAPH=false

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Neo4j Configuration (optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
```

### **Recommended Configurations by Use Case**

#### **General Documentation RAG**
```env
USE_CONTEXTUAL_EMBEDDINGS=false
USE_HYBRID_SEARCH=true
USE_AGENTIC_RAG=false
USE_RERANKING=true
USE_KNOWLEDGE_GRAPH=false
```

#### **AI Coding Assistant with Code Examples**
```env
USE_CONTEXTUAL_EMBEDDINGS=true
USE_HYBRID_SEARCH=true
USE_AGENTIC_RAG=true
USE_RERANKING=true
USE_KNOWLEDGE_GRAPH=false
```

#### **Full AI Coding Assistant with Hallucination Detection**
```env
USE_CONTEXTUAL_EMBEDDINGS=true
USE_HYBRID_SEARCH=true
USE_AGENTIC_RAG=true
USE_RERANKING=true
USE_KNOWLEDGE_GRAPH=true
```

#### **Fast Basic RAG**
```env
USE_CONTEXTUAL_EMBEDDINGS=false
USE_HYBRID_SEARCH=true
USE_AGENTIC_RAG=false
USE_RERANKING=false
USE_KNOWLEDGE_GRAPH=false
```

## **🔌 MCP Client Integration**

### **Claude Code Integration**
```bash
# Add Crawl4AI RAG server to Claude Code
claude mcp add-json crawl4ai-rag '{"type":"http","url":"http://localhost:8051/sse"}' --scope user

# Use in prompts
claude -p "Crawl https://docs.fastapi.tiangolo.com and then answer questions about FastAPI authentication" \
  --allowed-tools "mcp__crawl4ai_rag"
```

### **MCP Client Configuration (SSE)**
```json
{
  "mcpServers": {
    "crawl4ai-rag": {
      "transport": "sse",
      "url": "http://localhost:8051/sse"
    }
  }
}
```

### **Windsurf Configuration**
```json
{
  "mcpServers": {
    "crawl4ai-rag": {
      "transport": "sse",
      "serverUrl": "http://localhost:8051/sse"
    }
  }
}
```

### **Stdio Configuration**
```json
{
  "mcpServers": {
    "crawl4ai-rag": {
      "command": "python",
      "args": ["path/to/crawl4ai-mcp/src/crawl4ai_mcp.py"],
      "env": {
        "TRANSPORT": "stdio",
        "OPENAI_API_KEY": "your_openai_api_key",
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_KEY": "your_supabase_service_key",
        "USE_HYBRID_SEARCH": "true",
        "USE_RERANKING": "true"
      }
    }
  }
}
```

### **Docker Stdio Configuration**
```json
{
  "mcpServers": {
    "crawl4ai-rag": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "TRANSPORT",
        "-e", "OPENAI_API_KEY",
        "-e", "SUPABASE_URL",
        "-e", "SUPABASE_SERVICE_KEY",
        "-e", "USE_HYBRID_SEARCH",
        "-e", "USE_RERANKING",
        "mcp/crawl4ai-rag"
      ],
      "env": {
        "TRANSPORT": "stdio",
        "OPENAI_API_KEY": "your_openai_api_key",
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_KEY": "your_supabase_service_key",
        "USE_HYBRID_SEARCH": "true",
        "USE_RERANKING": "true"
      }
    }
  }
}
```

## **🧠 Knowledge Graph Architecture**

### **Schema Design**
```cypher
// Node Types
(:Repository {name, url, description, language})
(:File {name, path, content_hash})
(:Class {name, docstring, line_number})
(:Method {name, parameters, return_type, docstring})
(:Function {name, parameters, return_type, docstring})
(:Attribute {name, type, value})

// Relationship Types
(:Repository)-[:CONTAINS]->(:File)
(:File)-[:DEFINES]->(:Class)
(:File)-[:DEFINES]->(:Function)
(:Class)-[:HAS_METHOD]->(:Method)
(:Class)-[:HAS_ATTRIBUTE]->(:Attribute)
(:Method)-[:CALLS]->(:Method)
(:Function)-[:CALLS]->(:Function)
```

### **Hallucination Detection Workflow**
```python
# Example workflow for AI hallucination detection
async def validate_ai_code():
    # 1. Parse GitHub repository into knowledge graph
    await parse_repository("https://github.com/fastapi/fastapi.git")
    
    # 2. Generate AI code
    ai_script = generate_fastapi_code()
    
    # 3. Check for hallucinations
    hallucinations = await check_hallucinations(ai_script)
    
    # 4. Report findings
    if hallucinations:
        print("Detected hallucinations:")
        for h in hallucinations:
            print(f"- {h.type}: {h.description} (confidence: {h.confidence})")
```

## **📊 Usage Examples & Workflows**

### **Documentation Crawling and RAG**
```bash
# Crawl comprehensive documentation
claude -p "Crawl the entire FastAPI documentation from https://fastapi.tiangolo.com/sitemap.xml"

# Query specific information
claude -p "Search for information about dependency injection in FastAPI documentation"

# Filter by source
claude -p "Find examples of async database operations, but only search in FastAPI docs"
```

### **Code Example Extraction**
```bash
# Enable Agentic RAG for code examples
export USE_AGENTIC_RAG=true

# Crawl documentation with code extraction
claude -p "Crawl Python asyncio documentation and extract all code examples"

# Search for specific code patterns
claude -p "Find code examples showing how to handle async exceptions"
```

### **Repository Analysis and Validation**
```bash
# Add repository to knowledge graph
claude -p "Parse https://github.com/pydantic/pydantic.git into the knowledge graph"

# Generate and validate code
claude -p "Create a Pydantic model for user authentication, then check it for hallucinations"

# Explore repository structure
claude -p "Show me all classes in the pydantic repository that handle validation"
```

### **Multi-Source RAG Queries**
```bash
# Crawl multiple sources
claude -p "Crawl both FastAPI and Pydantic documentation"

# Cross-reference information
claude -p "Compare how FastAPI and Pydantic handle data validation, using examples from both documentations"

# Source-filtered searches
claude -p "Find authentication examples in FastAPI docs and validation examples in Pydantic docs"
```

## **🔍 Advanced Features**

### **Intelligent URL Detection**
The server automatically detects and handles:
- **Regular Webpages**: Recursive crawling following internal links
- **Sitemaps**: XML sitemap parsing for comprehensive coverage
- **Text Files**: Direct content extraction (like llms-full.txt files)
- **GitHub Repositories**: Code structure analysis and knowledge graph creation

### **Content Chunking Strategy**
```python
# Enhanced chunking approach inspired by Context 7
def intelligent_chunking(content):
    """
    - Splits by headers for semantic boundaries
    - Maintains context between chunks
    - Optimizes chunk size for embedding models
    - Preserves code block integrity
    """
    return semantic_chunks
```

### **Parallel Processing**
```python
# Efficient concurrent crawling
async def crawl_website(url):
    """
    - Parallel page processing
    - Rate limiting and politeness
    - Content deduplication
    - Progress tracking
    """
    return crawled_content
```

## **🚀 Performance Optimization**

### **Crawling Performance**
```env
# Optimize crawling speed
MAX_CONCURRENT_REQUESTS=10
REQUEST_DELAY=0.5
CHUNK_SIZE=1000
OVERLAP_SIZE=200
```

### **Search Performance**
```python
# Vector search optimization
def optimized_search(query, filters=None):
    """
    - Pre-computed embeddings
    - Efficient vector operations
    - Result caching
    - Parallel reranking
    """
    return ranked_results
```

### **Memory Management**
```python
# Efficient resource usage
def memory_efficient_processing():
    """
    - Streaming content processing
    - Batch embedding generation
    - Lazy loading of large documents
    - Garbage collection optimization
    """
    return processed_content
```

## **🛡️ Security & Best Practices**

### **API Key Security**
```env
# Secure environment variable management
OPENAI_API_KEY=${OPENAI_API_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# Rotation policy
CRAWL4AI_API_KEY_ROTATION_DAYS=30
```

### **Content Filtering**
```python
# Safe content handling
def content_filter(content):
    """
    - PII detection and removal
    - Malicious content screening
    - Copyright compliance
    - Content sanitization
    """
    return safe_content
```

### **Rate Limiting**
```python
# Respectful crawling
class RateLimiter:
    """
    - Robots.txt compliance
    - Adaptive rate limiting
    - Server load monitoring
    - Retry logic with backoff
    """
```

## **🔧 Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Database Connection Issues**
```bash
# Check Supabase connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
     "$SUPABASE_URL/rest/v1/crawled_pages?select=count"

# Verify pgvector extension
psql -h db.xxx.supabase.co -p 5432 -d postgres -U postgres \
     -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### **Neo4j Connection Issues**
```bash
# Test Neo4j connection
python -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'password'))
with driver.session() as session:
    result = session.run('RETURN 1')
    print('Connected:', result.single()[0])
"
```

#### **Crawling Issues**
```python
# Debug crawling problems
import logging
logging.basicConfig(level=logging.DEBUG)

# Check robots.txt compliance
def check_robots_txt(url):
    urllib.robotparser.RobotFileParser(url + '/robots.txt')
```

#### **Memory Issues**
```bash
# Monitor memory usage
docker stats mcp-crawl4ai-rag

# Optimize for large documents
export CHUNK_SIZE=500
export MAX_CONCURRENT_REQUESTS=5
```

This comprehensive Crawl4AI RAG MCP server provides the foundation for building intelligent AI agents that can learn from and interact with web content effectively. The multiple RAG strategies and knowledge graph capabilities make it particularly powerful for AI coding assistants and technical documentation analysis.