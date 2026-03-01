WORKLIENT FRONTEND – COMPLETE ARCHITECTURAL FINGERPRINT
1. Framework & Runtime Overview

Next.js version

App Router usage

Rendering model (CSR / SSR / SSG)

Build-time vs runtime behavior

Environment variable usage

Deployment assumptions

2. Folder Structure (FULL TREE)

Provide a structured tree of:

src/
  app/
  components/
  lib/
  hooks/
  providers/
  styles/
  etc...

For each major folder:

Responsibility

Key files

Architectural role

3. Routing Architecture
3.1 App Router Structure

List ALL route groups:

(public)

(protected)

(auth)

(blog)

(landing-pages)

(legal)

Root routes

For EACH route:

Route: /example

File path:

Route group:

Layout applied:

Static or dynamic:

Server component or client component:

Uses 'use client'? (Yes/No)

Fetches data? (Yes/No)

Requires session? (Yes/No)

Redirect logic:

Uses React Query? (Yes/No)

API calls made:

Middleware enforced? (Yes/No)

List EVERY page file in app directory.

4. Rendering Strategy

For every page:

Is it statically generated?

Is it dynamically rendered?

Does it export dynamic?

Does it export revalidate?

Is it fully client-rendered?

Does it depend on session?

Does it block rendering while loading?

Explain:

Why it behaves that way

Impact on SEO

Impact on performance

5. Layout Architecture
5.1 Root Layout

Provider hierarchy

Which providers wrap entire app

Which are client-only

Which are server components

5.2 Public Layout

Behavior

Session awareness

Redirect logic

5.3 Protected Layout

Authentication enforcement flow

Onboarding enforcement flow

Loading behavior

Redirect sequence

UseEffect timing implications

Flash-of-unauthorized-content risk analysis

6. Middleware Analysis

File: middleware.ts

Matcher configuration

Excluded paths

Public routes list

Route matching logic

Cookie check behavior

Redirect behavior

Error handling behavior

Query param preservation

Security implications

Limitations

7. Session Architecture
7.1 SessionProvider

File location

Query key

Endpoint used

React Query configuration

Retry behavior

Cache time

Stale time

Error behavior

7.2 Session Value Logic

How session null is determined

How errors are interpreted

Loading behavior

Edge cases

7.3 401 Handling System

Where 401 is intercepted

CustomEvent dispatch logic

Event listener location

Query invalidation behavior

Resulting UI behavior

7.4 Session Lifecycle

When session is fetched

When it is invalidated

When it refetches

When user is redirected

Logout behavior

8. Authentication Flow (Frontend Side)
8.1 Signup Flow

Form schema (Zod)

Validation logic

API mutation used

Redirect behavior

Invite token handling

8.2 Login Flow

Form schema

Mutation used

Redirect after login

Error display mechanism

8.3 Email Verification Flow

Required query params

Session redirect logic

Resend code behavior

Invite token support

8.4 Reviewer Activation Flow

Token handling

Redirect flow

Session dependency

8.5 Complete Signup – Internal

Access validation

Actor type enforcement

Form structure

Mutation used

8.6 Complete Signup – Reviewer

Access validation

Default name extraction

Mutation behavior

9. API Client Architecture

File: lib/api/client.ts

apiFetch implementation

credentials handling

CORS mode

Header injection

Error normalization

401 handling

Type safety

Path normalization

Environment variable dependency

SSR safety analysis

10. Service / Data Layer Structure

List all API-related layers:

apiFetch

hooks (useQuery, useMutation)

mutation files

service wrappers

error handling utilities

For each:

Responsibility

Coupling level

Abstraction depth

Reusability

11. React Query Configuration

Default options

Retry configuration

RefetchOnWindowFocus

staleTime

gcTime

Global vs local overrides

Session query special behavior

Cache invalidation strategy

12. Form Handling Architecture

Zod schemas

react-hook-form usage

register usage

error display strategy

Root-level form errors

Validation timing

Password confirmation logic

Error normalization usage

13. State Management

Context providers

Local component state usage

React Query cache as state layer

Any global state patterns

Event-driven state changes

14. UI Composition Architecture

Shell structure

MainShell usage

Page-level composition pattern

Loader usage pattern

Alert usage pattern

Toast provider usage

15. Security Posture (Frontend)

CSRF protection assumptions

Cookie handling

Session exposure risk

XSS risk mitigation

SSR vs CSR security implications

Middleware limitations

Flash-of-unauthenticated risk

16. Performance Characteristics

Initial load behavior

Session blocking behavior

Client-side redirect cost

React Query caching impact

Unnecessary refetch risks

Over-render risk

Static page impact

17. Architectural Constraints & Tradeoffs

Client-side redirects vs server redirects

Session always fetched on all pages

Middleware cookie-only validation

No server-side session validation

Dual enforcement model (middleware + layout)

Any observed technical debt

REQUIREMENTS

No summarizing.

No recommendations.

No refactoring advice.

No omissions.

No assumptions.

Only describe what exists.

Cite file paths.

Explicitly state “NOT IMPLEMENTED” where applicable.

Be exhaustive.

Depth > brevity.

This must be a true architectural fingerprint.

Return only the Markdown document.