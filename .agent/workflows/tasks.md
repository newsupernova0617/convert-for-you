---
description: Break down plan into actionable tasks
---

# /tasks - Create Task Breakdown

This workflow breaks down the implementation plan into specific, actionable tasks that can be executed sequentially.

## Purpose
Create a clear task list that:
- Breaks work into manageable chunks
- Defines clear completion criteria
- Establishes logical order
- Identifies dependencies
- Enables progress tracking

## Usage

```
/tasks
```

## Steps

1. **Review Implementation Plan**
   - Understand the full scope
   - Identify major components
   - Note dependencies
   - Review technical decisions

2. **Identify Major Phases**
   - Setup and scaffolding
   - Core functionality
   - Integration points
   - Testing
   - Documentation

3. **Break Down Into Tasks**
   - Create specific, actionable tasks
   - Each task should be completable in one session
   - Define clear acceptance criteria
   - Identify dependencies between tasks
   - Order tasks logically

4. **Create Task Document**
   - Use markdown checklist format
   - Include task IDs for tracking
   - Add descriptions and acceptance criteria
   - Note dependencies
   - Estimate complexity (optional)

5. **Review Task List**
   - Ensure nothing is missed
   - Check task order makes sense
   - Verify dependencies are clear
   - Confirm tasks are actionable

## Output

Creates: `.agent/tasks/[feature-id]/tasks.md`

## Task Format

```markdown
# Tasks for [Feature Name]

## Phase 1: Setup
- [ ] Task 1: Description <!-- id: 1 -->
  - Acceptance: Clear criteria
  - Dependencies: None
  
- [ ] Task 2: Description <!-- id: 2 -->
  - Acceptance: Clear criteria
  - Dependencies: Task 1

## Phase 2: Core Implementation
- [ ] Task 3: Description <!-- id: 3 -->
  - Acceptance: Clear criteria
  - Dependencies: Task 2
```

## Important Notes

- **Be specific**: "Add upload button" not "Update UI"
- **One concern per task**: Don't mix frontend and backend in one task
- **Clear acceptance**: Define what "done" means
- **Logical order**: Dependencies should flow naturally

## Example Output

```markdown
# Tasks for Batch Image Conversion

## Phase 1: Backend Setup
- [ ] Create batch upload endpoint in routes/uploadRoutes.js <!-- id: 1 -->
  - Acceptance: Endpoint accepts multiple files, validates each
  - Dependencies: None

- [ ] Add batch conversion logic to routes/convertRoutes.js <!-- id: 2 -->
  - Acceptance: Can process multiple files in parallel
  - Dependencies: Task 1

## Phase 2: Frontend Implementation
- [ ] Update upload UI to support multiple file selection <!-- id: 3 -->
  - Acceptance: Users can select multiple files via drag-drop or file picker
  - Dependencies: None

- [ ] Add individual progress bars for each file <!-- id: 4 -->
  - Acceptance: Each file shows separate progress indicator
  - Dependencies: Task 3
```
