# ADR-0001: Backend framework — NestJS
- **Status:** accepted · **Date:** 2026-08-11 · **Deciders:** Ganesh, Mohan
## Context
Docs contradicted each other (Overview: NestJS; Handbook Vol III: Express). We committed to Clean Architecture + feature modules + DI + Prisma + Zod + OpenAPI.
## Decision
Use NestJS — it provides modular structure, DI, validation, and Swagger natively; Express would mean hand-rolling all of it.
## Consequences
(+) enforced structure, cheaper uniform layering. (−) steeper curve, more boilerplate for trivial endpoints. Full log: ARCHITECTURE.md §14.
