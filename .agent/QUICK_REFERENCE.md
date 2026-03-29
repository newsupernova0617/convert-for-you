# Spec-Driven Development - Quick Reference

## 🚀 Slash Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/constitution` | Establish project principles | Once at project start, update as needed |
| `/specify` | Create functional spec | Start of each new feature |
| `/clarify` | Refine specifications | After `/specify`, before `/plan` |
| `/plan` | Create technical plan | After spec is clear |
| `/tasks` | Break into actionable tasks | After plan is complete |
| `/implement` | Execute implementation | After tasks are defined |

## 📝 Typical Feature Workflow

```
1. /specify [what you want to build]
   ↓
2. /clarify [optional: ask questions]
   ↓
3. /plan [how to build it technically]
   ↓
4. /tasks
   ↓
5. /implement
```

## 💡 Tips

### Writing Good Specifications
- ✅ Focus on WHAT and WHY, not HOW
- ✅ Be explicit about user interactions
- ✅ Define success criteria clearly
- ✅ Include edge cases and constraints
- ❌ Don't specify technology stack (that's for /plan)
- ❌ Don't describe implementation details

### Creating Effective Plans
- ✅ Follow existing project patterns
- ✅ Justify technology choices
- ✅ Consider maintainability
- ✅ Include testing strategy
- ❌ Don't contradict the constitution
- ❌ Don't ignore existing architecture

### Breaking Down Tasks
- ✅ Make tasks specific and actionable
- ✅ One concern per task
- ✅ Define clear acceptance criteria
- ✅ Order tasks logically
- ❌ Don't make tasks too large
- ❌ Don't mix unrelated concerns

## 🎯 Example Usage

### Example 1: Simple Feature
```
/specify Add a "dark mode" toggle that persists user preference across sessions

/plan Use localStorage for persistence, add CSS variables for theming, 
follow existing Alpine.js patterns for state management

/tasks

/implement
```

### Example 2: Complex Feature
```
/specify Build a batch conversion feature that allows users to upload up to 
50 files at once, see individual progress for each file, cancel individual 
conversions, and download all results as a ZIP archive

/clarify Focus on error handling, memory management, and user feedback during 
long operations

/plan Use existing Piscina worker pool, add batch processing to convertRoutes, 
implement progress tracking with WebSockets or polling, use Archiver for ZIP 
creation

/tasks

/implement
```

## 📂 File Locations

After running workflows, you'll find:

```
.agent/
├── memory/
│   └── constitution.md          # Project principles
├── specs/
│   └── 001-feature-name/
│       └── spec.md              # What to build
├── plans/
│   └── 001-feature-name/
│       └── plan.md              # How to build it
└── tasks/
    └── 001-feature-name/
        └── tasks.md             # Task checklist
```

## 🔍 Troubleshooting

**Q: Should I use /clarify every time?**
A: Use it when your spec has ambiguities or you want to explore edge cases. It's optional but recommended for complex features.

**Q: Can I skip /plan and go straight to /implement?**
A: Not recommended. The plan ensures you're building the right way and following project patterns.

**Q: What if I need to change the plan during implementation?**
A: Update the plan document, then continue. Documentation should reflect reality.

**Q: How do I handle multiple features at once?**
A: Each feature gets its own ID (001, 002, etc.) and separate directories. Work on one at a time for clarity.

## 🎓 Learning Resources

- Read `.agent/README.md` for full documentation
- Check `.agent/workflows/*.md` for detailed workflow instructions
- Review `.agent/memory/constitution.md` for project principles
- Look at existing specs/plans/tasks for examples

---

**Remember**: The goal is to build better software faster by thinking before coding!
