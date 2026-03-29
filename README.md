# Convert4U - Media Conversion Platform

> See [CLAUDE.md](./CLAUDE.md) for detailed technical documentation.

## 🌱 Spec-Driven Development

This project uses **Spec-Driven Development** workflow for building new features. This approach helps us build high-quality software faster by creating clear specifications before implementation.

### Available Workflows

Use these slash commands in Antigravity IDE:

- `/constitution` - Establish or update project principles
- `/specify` - Create functional specifications for a feature
- `/clarify` - Clarify and refine specifications
- `/plan` - Create technical implementation plan
- `/tasks` - Break down plan into actionable tasks
- `/implement` - Execute implementation

### Quick Start

For a new feature:
```
/specify [describe what you want to build]
/plan [specify technical approach]
/tasks
/implement
```

### Documentation

- **Full Guide**: [.agent/README.md](./.agent/README.md)
- **Quick Reference**: [.agent/QUICK_REFERENCE.md](./.agent/QUICK_REFERENCE.md)
- **Setup Complete**: [.agent/SETUP_COMPLETE.md](./.agent/SETUP_COMPLETE.md)
- **Project Principles**: [.agent/memory/constitution.md](./.agent/memory/constitution.md)

---

## Project Overview

**Convert4U** is a full-stack web application that converts 28+ file formats including PDF, Office documents, Images, Audio, and Video.

### Key Features

- 🚀 Fast conversion using worker threads
- 🔒 Secure with input validation and rate limiting
- ☁️ Cloud storage with Cloudflare R2
- 📊 Admin dashboard with JWT authentication
- ⏱️ Automatic file cleanup (10-minute expiration)
- 🎨 89 dedicated conversion pages

### Tech Stack

- **Backend**: Node.js, Express, SQLite, Piscina
- **Frontend**: Bootstrap 5, Alpine.js, Vanilla JS
- **Storage**: Cloudflare R2
- **Processing**: LibreOffice, FFmpeg, Sharp

### Getting Started

```bash
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

For detailed documentation, see [CLAUDE.md](./CLAUDE.md).
