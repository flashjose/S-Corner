# ADR-0001: Use React for Frontend

## Status

Accepted

## Context

We need a frontend framework for the language learning application. The application requires:
- Interactive UI for viewing exam papers
- State management for user progress
- Responsive design for mobile and desktop

## Decision

We will use React with TypeScript and Vite for the frontend.

## Consequences

- **Positive**: Large ecosystem, good TypeScript support, fast development with Vite
- **Negative**: Requires build step, learning curve for new developers
- **Risks**: Performance with large PDF files, mobile compatibility