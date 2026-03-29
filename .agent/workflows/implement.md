---
description: Execute implementation tasks
---

# /implement - Execute Implementation

This workflow guides the execution of all tasks defined in the task breakdown, implementing the feature according to the plan and specification.

## Purpose
Execute the implementation by:
- Following the task list sequentially
- Adhering to the technical plan
- Meeting specification requirements
- Maintaining code quality standards
- Testing as you go

## Usage

```
/implement [optional: specific task IDs or phase]
```

## Steps

1. **Review All Documents**
   - Read constitution.md for principles
   - Review spec.md for requirements
   - Study plan.md for technical approach
   - Check tasks.md for task list

2. **Set Up Development Environment**
   - Ensure you're on the correct feature branch
   - Install any new dependencies
   - Set up any required tools
   - Verify existing tests pass

3. **Execute Tasks Sequentially**
   - Start with first uncompleted task
   - Follow the technical plan
   - Write clean, documented code
   - Add tests for new functionality
   - Update task checklist as you complete each task

4. **For Each Task:**
   - Read task description and acceptance criteria
   - Implement according to plan
   - Follow project constitution principles
   - Write/update tests
   - Verify acceptance criteria met
   - Mark task as complete

5. **Continuous Validation**
   - Run tests frequently
   - Check for regressions
   - Verify against specification
   - Ensure code quality standards

6. **Documentation**
   - Update code comments
   - Update README if needed
   - Document any deviations from plan
   - Note any issues or learnings

7. **Final Review**
   - All tasks completed
   - All tests passing
   - Code follows constitution
   - Specification requirements met
   - Ready for review/merge

## Output

- Implemented code in project files
- Updated tests
- Completed task checklist
- Updated documentation

## Important Notes

- **Follow the plan**: Don't deviate without good reason
- **Test continuously**: Don't wait until the end
- **Document as you go**: Comments and docs should be part of implementation
- **Ask for clarification**: If something is unclear, use /clarify

## Example Usage

```
/implement
```

This will execute all tasks in order.

```
/implement Phase 2
```

This will execute only tasks in Phase 2.

```
/implement tasks 3-5
```

This will execute tasks 3, 4, and 5.

## During Implementation

If you encounter issues:
- Document the problem
- Consider if spec needs clarification (/clarify)
- Check if plan needs adjustment
- Update tasks if needed
- Keep stakeholders informed

## Completion Checklist

Before marking implementation complete:
- [ ] All tasks checked off
- [ ] All tests passing
- [ ] Code reviewed against constitution
- [ ] Specification requirements verified
- [ ] Documentation updated
- [ ] No regressions introduced
- [ ] Ready for code review
