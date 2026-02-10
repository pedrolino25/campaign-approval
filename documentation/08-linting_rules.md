# Linting & Formatting Enforcement

You are responsible for maintaining enterprise-grade code quality standards.

You must configure and respect ESLint, Prettier, and TypeScript strictness rules exactly as defined below.

These rules are mandatory and cannot be relaxed.

---

# Objectives

The codebase must:

- Enforce strict TypeScript safety.
- Prevent architectural violations.
- Eliminate dead code.
- Prevent unsafe patterns.
- Avoid console logging.
- Maintain consistent formatting.
- Fail fast on type issues.
- Enforce layered architecture boundaries.

---

# TypeScript Configuration

You must ensure `tsconfig.json` contains:

- "strict": true
- "noImplicitAny": true
- "strictNullChecks": true
- "noUncheckedIndexedAccess": true
- "noImplicitReturns": true
- "noFallthroughCasesInSwitch": true
- "forceConsistentCasingInFileNames": true

TypeScript must fail on any unsafe pattern.

Never disable strict mode.

---

# ESLint Configuration

You must configure ESLint with:

- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- eslint-config-prettier
- eslint-plugin-import
- eslint-plugin-simple-import-sort
- eslint-plugin-unused-imports

Optional but recommended:
- eslint-plugin-boundaries

---

# ESLint Mandatory Rules

The following rules must be enforced:

## Type Safety

- no-explicit-any = error
- explicit-function-return-type = error
- no-floating-promises = error
- consistent-type-imports = error

## Unused Code

- unused-imports/no-unused-imports = error
- unused-imports/no-unused-vars = error

## Console Usage

- no-console = error
- no-debugger = error

## Clean Code

- no-var = error
- prefer-const = error
- no-duplicate-imports = error
- require-await = error
- no-return-await = error

## Complexity Limits

- max-lines-per-function <= 80
- cyclomatic complexity <= 10

## Comment Discipline

- No TODO
- No FIXME
- No HACK

Comments indicating incomplete work are forbidden.

---

# Import Sorting

You must enforce:

- simple-import-sort/imports
- simple-import-sort/exports

Imports must be automatically sorted.

---

# Prettier Configuration

You must configure Prettier with:

- semi: false
- singleQuote: true
- printWidth: 100
- trailingComma: all
- arrowParens: always
- tabWidth: 2

Formatting must be automated.

Never manually format code.

---

# Architecture Boundary Enforcement

If using eslint-plugin-boundaries:

You must enforce:

- /api can only import from /services
- /services can import from /models, /repositories, /providers
- /models cannot import from any other internal layer
- /repositories cannot import from /services
- /providers cannot import from /services

If boundary violation occurs, ESLint must fail.

---

# Forbidden Practices

You must NOT:

- Disable ESLint rules inline.
- Use // eslint-disable-next-line.
- Bypass linting.
- Add new ESLint plugins without approval.
- Reduce rule severity from error to warning.

Lint violations must be fixed, not silenced.

---

# NPM Scripts

You must ensure the project includes:

- lint
- lint:fix
- format
- typecheck

Code must pass:

- npm run lint
- npm run typecheck

before being considered complete.

---

# CI Enforcement

All code must pass:

- ESLint
- TypeScript compilation
- Prettier formatting

before merging.

No feature is complete if linting fails.

---

# Code Generation Discipline

When generating code:

- Always comply with strict TypeScript rules.
- Always define explicit return types.
- Never introduce `any`.
- Never leave unused imports.
- Never leave dead code.
- Never use console.log.
- Never exceed function size limits.
- Never violate architectural boundaries.

If a rule would be violated, refactor the implementation.

---

# Final Rule

If linting or type checking fails, the feature is incomplete.

You must refactor until:

- ESLint passes.
- TypeScript passes.
- Architecture boundaries are respected.
- No unsafe patterns exist.