# Project Constitution

## Overview
This document defines the core principles and governance for the Convert4U project. All development decisions should align with these principles.

## Code Quality Standards

### Code Style
- Use consistent formatting (Prettier/ESLint for JS, autopep8 for Python)
- Follow existing naming conventions in the codebase
- Write self-documenting code with clear variable and function names
- Add comments for complex logic, not obvious code

### Code Organization
- Follow the existing directory structure
- Keep files focused on a single responsibility
- Separate concerns (routes, utils, converters)
- Use modular design for reusability

### Error Handling
- Always validate user input
- Provide clear, actionable error messages
- Log errors with context for debugging
- Handle edge cases gracefully
- Never expose internal errors to users

## Security Principles

### Input Validation
- Validate all user input (file types, sizes, parameters)
- Use magic number validation, not just file extensions
- Sanitize file names and paths
- Implement rate limiting on all endpoints
- Protect against common attacks (XSS, CSRF, injection)

### Data Protection
- Use HTTPS in production
- Implement proper CORS policies
- Use Helmet for security headers
- Follow principle of least privilege
- Secure sensitive data (JWT secrets, API keys)

### File Handling
- Validate file types with magic numbers
- Enforce file size limits
- Clean up temporary files
- Implement file expiration (10 minutes default)
- Use secure storage (R2 with proper access controls)

## Performance Requirements

### Response Times
- API endpoints should respond within 2 seconds
- File conversions should show progress feedback
- Use worker threads for CPU-intensive tasks
- Implement proper caching strategies

### Scalability
- Use Piscina worker pools for parallel processing
- Implement proper database indexing
- Use WAL mode for SQLite concurrency
- Optimize R2 storage operations

### Resource Management
- Clean up expired files automatically
- Limit concurrent conversions per user
- Monitor memory usage in workers
- Implement graceful shutdown

## User Experience Principles

### Usability
- Drag-and-drop file upload
- Clear progress indicators
- Immediate feedback on actions
- Helpful error messages
- No registration required

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Clear visual hierarchy
- Responsive design for all devices

### Reliability
- Handle errors gracefully
- Provide retry mechanisms
- Show clear status updates
- Maintain data integrity
- Test edge cases thoroughly

## Testing Standards

### Test Coverage
- Write tests for all new features
- Maintain existing test coverage
- Test edge cases and error conditions
- Use Jest for unit and integration tests

### Test Types
- Unit tests for utilities and converters
- Integration tests for API endpoints
- End-to-end tests for critical flows
- Performance tests for conversion operations

## Documentation Requirements

### Code Documentation
- Document all public APIs
- Explain complex algorithms
- Include usage examples
- Keep documentation up-to-date

### Project Documentation
- Update README for new features
- Document configuration options
- Maintain API documentation
- Create user guides as needed

## Technical Decision Making

### When to Add Dependencies
- Evaluate if functionality can be built in-house
- Consider bundle size impact
- Check maintenance status and community
- Prefer well-established libraries
- Document why dependency was added

### When to Refactor
- When code becomes hard to understand
- When adding similar functionality repeatedly
- When performance becomes an issue
- When tests become brittle
- Always refactor with tests

### Technology Choices
- Prefer simplicity over complexity
- Use proven technologies
- Consider long-term maintenance
- Align with existing stack
- Document architectural decisions

## Development Workflow

### Git Practices
- Create feature branches for new work
- Write clear commit messages
- Keep commits focused and atomic
- Review code before merging
- Use meaningful branch names

### Code Review
- Review for security issues
- Check alignment with constitution
- Verify tests are included
- Ensure documentation is updated
- Test locally before approving

## Maintenance Principles

### Backwards Compatibility
- Don't break existing APIs without versioning
- Maintain database migrations
- Document breaking changes
- Provide migration guides

### Monitoring
- Log important events
- Monitor error rates
- Track performance metrics
- Set up alerts for critical issues

---

**Last Updated**: 2026-01-15

This constitution should evolve as the project grows. Propose changes through the normal development workflow.
