---
description: Create functional specifications for a feature
---

# /specify - Create Functional Specifications

This workflow helps you create detailed functional specifications for what you want to build, focusing on the "what" and "why" rather than the "how".

## Purpose
Create a clear, comprehensive specification that describes:
- What the feature does
- Why it's needed
- User interactions and flows
- Business requirements
- Success criteria

## Usage

```
/specify [feature description]
```

## Steps

1. **Create Feature Branch**
   - Generate unique feature ID (e.g., `001-feature-name`)
   - Create git branch: `git checkout -b [feature-id]`
   - Create spec directory: `.agent/specs/[feature-id]/`

2. **Gather Requirements**
   - What problem does this solve?
   - Who are the users?
   - What are the key user flows?
   - What are the constraints?
   - What defines success?

3. **Write Specification Document**
   - Create `.agent/specs/[feature-id]/spec.md`
   - Include:
     - Overview and goals
     - User stories
     - Functional requirements
     - Non-functional requirements
     - Acceptance criteria
     - Out of scope items

4. **Review Against Constitution**
   - Check alignment with project principles
   - Ensure consistency with existing features
   - Validate against quality standards

5. **Create Supporting Documents**
   - User flows (if applicable)
   - Mockups or wireframes (if applicable)
   - Data requirements

## Output

Creates:
- Git branch: `[feature-id]`
- `.agent/specs/[feature-id]/spec.md`
- `.agent/specs/[feature-id]/user-flows.md` (optional)

## Important Notes

- **Focus on WHAT, not HOW**: Don't specify technology stack or implementation details
- **Be explicit**: The more detailed your requirements, the better the implementation
- **Think user-first**: Describe from the user's perspective
- **Define success**: Clear acceptance criteria prevent scope creep

## Example Prompt

```
/specify Build a batch image conversion feature that allows users to upload multiple images at once and convert them all to a target format. Users should see individual progress for each file, be able to cancel individual conversions, and download all converted files as a ZIP archive. The feature should handle up to 50 images at once and provide clear error messages if any conversions fail.
```
