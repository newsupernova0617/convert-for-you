---
description: Clarify and refine specifications before planning
---

# /clarify - Clarify Specifications

This workflow helps identify gaps, ambiguities, or potential issues in your specification before moving to the planning phase.

## Purpose
Ensure specifications are:
- Complete and unambiguous
- Technically feasible
- Aligned with project principles
- Free of contradictions
- Ready for implementation planning

## Usage

```
/clarify [optional: specific areas to focus on]
```

## Steps

1. **Review Current Specification**
   - Read the spec document thoroughly
   - Identify the current feature being specified
   - Check for completeness

2. **Ask Clarifying Questions**
   - What happens in edge cases?
   - Are there any undefined behaviors?
   - What are the performance expectations?
   - How should errors be handled?
   - What about accessibility?
   - Are there security considerations?

3. **Identify Gaps**
   - Missing user flows
   - Undefined error states
   - Unclear acceptance criteria
   - Missing constraints
   - Unspecified integrations

4. **Check Feasibility**
   - Are requirements realistic?
   - Are there technical constraints?
   - Are there conflicting requirements?
   - Are dependencies clear?

5. **Update Specification**
   - Add clarifications to spec.md
   - Document assumptions
   - Update acceptance criteria
   - Add notes for implementation

6. **Validate Against Constitution**
   - Ensure alignment with project principles
   - Check consistency with existing features
   - Verify quality standards are met

## Output

Updates: `.agent/specs/[feature-id]/spec.md`

May also create:
- `.agent/specs/[feature-id]/clarifications.md`
- `.agent/specs/[feature-id]/assumptions.md`

## Example Prompt

```
/clarify Focus on:
- Error handling scenarios
- Performance requirements for large file batches
- User feedback during long-running operations
- Browser compatibility requirements
- Accessibility considerations
```
