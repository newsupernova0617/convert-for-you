---
description: Establish project principles and governance
---

# /constitution - Establish Project Principles

This workflow helps you create the foundational principles that will guide all development decisions in your project.

## Purpose
The constitution defines:
- Code quality standards
- Testing requirements
- User experience principles
- Performance requirements
- Security guidelines
- Technical decision-making governance

## Usage

```
/constitution [optional: specific focus areas]
```

## Steps

1. **Understand Current Project Context**
   - Review existing codebase structure
   - Identify current patterns and conventions
   - Note any existing documentation

2. **Define Core Principles**
   - Code quality standards (formatting, naming, structure)
   - Testing requirements (coverage, types of tests)
   - User experience consistency
   - Performance benchmarks
   - Security best practices
   - Accessibility requirements

3. **Create Governance Rules**
   - How to make technical decisions
   - When to deviate from principles
   - Review and approval processes
   - Documentation requirements

4. **Write Constitution Document**
   - Create `.agent/memory/constitution.md`
   - Use clear, actionable language
   - Include examples where helpful
   - Make it easy to reference

5. **Review and Refine**
   - Ensure principles are realistic
   - Check for conflicts or gaps
   - Get team alignment if applicable

## Output

Creates or updates: `.agent/memory/constitution.md`

This file will be referenced by the AI agent during all subsequent specification, planning, and implementation phases.

## Example Prompt

```
/constitution Create principles focused on:
- Modern web development best practices
- Security-first approach with input validation
- Performance optimization for large files
- Clean, maintainable code structure
- Comprehensive error handling
- User-friendly interfaces with clear feedback
```
