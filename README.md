# Playwright Quality Framework

![tests](https://github.com/rovil111/playwright-quality-framework/actions/workflows/tests.yml/badge.svg)

A layered Playwright and TypeScript test framework covering UI, API and accessibility checks. It ships with its own small demo app, so anyone can clone it and run the whole suite with no external environment.

## Run it

Requires Node.js 20 or later.

```bash
npm ci
npx playwright install chromium
npm test
npm run report   # opens the HTML report
```

Run one layer with `npm run test:ui`, `npm run test:api` or `npm run test:a11y`.

## Design decisions

| Decision | Why |
| --- | --- |
| Each test gets its own data board through a fixture | Tests run fully in parallel and can't interfere with each other |
| State is seeded through the API | UI tests stay fast and only exercise the behaviour they are named after |
| Role and label locators, kept in page objects | Tests survive markup changes, and locators double as a basic accessibility check |
| axe-core scans plus a keyboard journey | Automated rules catch WCAG A/AA issues, and the journey covers what rules can't |
| Network mocking for a UI-only scenario | The front end can be tested independently of the backend |
| Traces and screenshots kept on failure, uploaded by CI | A CI failure can be diagnosed without reproducing it locally |

## Layout

```text
app/            demo app under test (no dependencies)
src/pages/      page objects
src/fixtures/   typed fixtures and API client
tests/ui/       user journeys
tests/api/      contract and negative tests
tests/a11y/     WCAG scans and keyboard use
```
