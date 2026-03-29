---
description: Create technical implementation plan
---

# /plan - Create Technical Implementation Plan

This workflow creates a detailed technical plan for implementing the specification, including technology choices, architecture, and implementation approach.

## Purpose
Define the technical approach:
- Technology stack and tools
- Architecture and design patterns
- File structure and organization
- API contracts and interfaces
- Database schema (if applicable)
- Third-party integrations

## Usage

```
/plan [technical requirements and constraints]
```

## Steps

1. **Review Specification**
   - Understand functional requirements
   - Identify technical constraints
   - Review project constitution
   - Check existing codebase patterns

2. **Choose Technology Stack**
   - Select appropriate libraries/frameworks
   - Justify technology choices
   - Consider existing project dependencies
   - Document version requirements

3. **Design Architecture**
   - Define component structure
   - Identify design patterns to use
   - Plan data flow
   - Design API contracts
   - Plan database schema (if needed)

4. **Create Implementation Plan**
   - Break down into logical components
   - Define file structure
   - Specify interfaces and contracts
   - Identify reusable code
   - Plan for testing

5. **Document Technical Decisions**
   - Create `.agent/plans/[feature-id]/plan.md`
   - Document architecture decisions
   - Explain technology choices
   - Include diagrams if helpful

6. **Create Supporting Documents**
   - API specifications
   - Data models
   - Component diagrams
   - Research notes

## Output

Creates:
- `.agent/plans/[feature-id]/plan.md`
- `.agent/plans/[feature-id]/architecture.md`
- `.agent/plans/[feature-id]/api-spec.md` (if applicable)
- `.agent/plans/[feature-id]/data-model.md` (if applicable)
- `.agent/plans/[feature-id]/research.md`

## Important Notes

- **Follow existing patterns**: Maintain consistency with current codebase
- **Justify decisions**: Explain why you chose specific approaches
- **Consider maintainability**: Plan for future changes
- **Think about testing**: Include testing strategy in the plan

## Example Prompt

```
/plan Implement using:
- Frontend: Vanilla JavaScript with Alpine.js for state management
- Backend: Add new route in Express.js
- File processing: Use existing Piscina worker pool pattern
- Storage: Leverage existing R2 integration
- Add new converter in utils/converters/ following existing patterns
- Use existing rate limiting and security middleware
- Follow current error handling patterns
```
