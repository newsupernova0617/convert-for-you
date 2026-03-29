# Spec-Driven Development for Convert4U

This project uses a Spec-Driven Development workflow inspired by GitHub's Spec-Kit. This approach helps build high-quality software faster by creating clear specifications before implementation.

## 🤔 What is Spec-Driven Development?

Spec-Driven Development flips traditional software development on its head. Instead of jumping straight into code, you:

1. **Define principles** - Establish project governance and standards
2. **Write specifications** - Describe WHAT you want to build (not HOW)
3. **Create technical plans** - Define HOW to build it with specific technologies
4. **Break into tasks** - Create actionable, ordered task lists
5. **Execute implementation** - Build according to the plan

## 📁 Directory Structure

```
.agent/
├── workflows/          # Workflow definitions (slash commands)
│   ├── constitution.md
│   ├── specify.md
│   ├── clarify.md
│   ├── plan.md
│   ├── tasks.md
│   └── implement.md
├── memory/            # Project-wide memory and principles
│   └── constitution.md
├── specs/             # Feature specifications
│   └── [feature-id]/
│       ├── spec.md
│       └── clarifications.md
├── plans/             # Technical implementation plans
│   └── [feature-id]/
│       ├── plan.md
│       ├── architecture.md
│       ├── api-spec.md
│       └── data-model.md
└── tasks/             # Task breakdowns
    └── [feature-id]/
        └── tasks.md
```

## ⚡ Quick Start

### Available Slash Commands

Once set up, you can use these commands in Antigravity IDE:

- `/constitution` - Establish project principles and governance
- `/specify` - Create functional specifications for a feature
- `/clarify` - Clarify and refine specifications before planning
- `/plan` - Create technical implementation plan
- `/tasks` - Break down plan into actionable tasks
- `/implement` - Execute implementation tasks

### Typical Workflow

1. **First Time Setup** (do once per project)
   ```
   /constitution Create principles for this project focusing on security, performance, and maintainability
   ```

2. **For Each New Feature**
   ```
   /specify [Describe what you want to build]
   /clarify [Optional: ask for clarification on specific areas]
   /plan [Specify technology stack and approach]
   /tasks [Generate task breakdown]
   /implement [Execute the implementation]
   ```

## 📋 Detailed Workflow

### STEP 1: Establish Project Principles

Use `/constitution` to create your project's governing principles:

```
/constitution Create principles focused on:
- Modern web development best practices
- Security-first approach with input validation
- Performance optimization for large files
- Clean, maintainable code structure
- Comprehensive error handling
```

This creates `.agent/memory/constitution.md` which guides all future development.

### STEP 2: Create Specifications

Use `/specify` to describe WHAT you want to build (not HOW):

```
/specify Build a batch image conversion feature that allows users to upload 
multiple images at once and convert them all to a target format. Users should 
see individual progress for each file, be able to cancel individual conversions, 
and download all converted files as a ZIP archive.
```

This creates:
- Git branch: `001-batch-image-conversion`
- `.agent/specs/001-batch-image-conversion/spec.md`

### STEP 3: Clarify Specifications (Optional)

Use `/clarify` to identify gaps or ambiguities:

```
/clarify Focus on error handling, performance requirements, and browser compatibility
```

### STEP 4: Create Technical Plan

Use `/plan` to specify HOW to build it:

```
/plan Implement using:
- Frontend: Alpine.js for state management
- Backend: New route in Express.js
- Use existing Piscina worker pool pattern
- Leverage existing R2 integration
- Follow current error handling patterns
```

This creates `.agent/plans/001-batch-image-conversion/plan.md`

### STEP 5: Break Down Into Tasks

Use `/tasks` to create actionable task list:

```
/tasks
```

This creates `.agent/tasks/001-batch-image-conversion/tasks.md` with checkboxes.

### STEP 6: Execute Implementation

Use `/implement` to build the feature:

```
/implement
```

The AI will execute each task sequentially, following the plan and spec.

## 🎯 Benefits

- **Clarity**: Everyone knows what's being built and why
- **Quality**: Specifications ensure requirements are met
- **Consistency**: Constitution ensures consistent decisions
- **Traceability**: Clear path from idea to implementation
- **Collaboration**: Specs and plans are easy to review
- **Maintainability**: Documentation is built into the process

## 📚 Core Philosophy

1. **Specifications First**: Define what before how
2. **Principle-Driven**: Let constitution guide decisions
3. **Iterative Refinement**: Clarify before implementing
4. **Task-Oriented**: Break work into manageable chunks
5. **Documentation Built-In**: Specs and plans are documentation

## 🔧 Tips

- **Be explicit in specs**: The more detail, the better the implementation
- **Use /clarify liberally**: Better to ask questions upfront
- **Follow the plan**: Don't deviate without updating the plan
- **Update as you go**: If you learn something, update the docs
- **Review the constitution**: Make sure decisions align with principles

## 📖 Learn More

- Read individual workflow files in `.agent/workflows/` for detailed instructions
- Check existing specs in `.agent/specs/` for examples
- Review the constitution in `.agent/memory/constitution.md`

---

**Remember**: Spec-Driven Development is about building the right thing, the right way, with clear documentation and consistent quality.
