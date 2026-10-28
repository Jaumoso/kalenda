# PRD — Product Requirements Document

## Product Summary

Kalenda is a self-hosted web platform for building highly customized wall calendars with print-ready exports.
It targets users who need full creative control, long-term ownership of their data, and predictable output quality.

## Problem Statement

Commercial services often restrict customization and impose workflow constraints.
Kalenda provides full control over layout, styling, assets, and export quality without vendor lock-in.

## Target Users

- Standard user: creates and manages calendar projects
- Administrator: manages users, settings, and operations

## Core Requirements

### Must-have

- Multi-project calendar management
- Full-page visual editing (images, text, stickers, layers)
- Editable calendar grid and day-cell customization
- Persistent asset library with folder organization
- Holiday and event support
- Template system
- Print-grade PDF/PNG export
- Authentication and role-based access

### Should-have

- Advanced onboarding and contextual help
- Operational monitoring and backup automation
- End-to-end test coverage for critical flows

## Non-functional Requirements

- Reliable autosave and data integrity
- Secure auth and session lifecycle
- Production-ready deployment via containers
- High-quality rendering consistency

## Success Criteria

- Users can complete a 12-month calendar end-to-end
- Export quality is suitable for home or professional printing
- Production deployment is reproducible and maintainable

## Current implementation status

The MVP currently supports project management, calendar and canvas editing, asset folders,
events and holidays, templates, PDF/PNG export, authentication, role-based administration,
Docker deployment, development image publishing, automated backups and critical end-to-end
tests.

The remaining functional and operational work is deliberately limited to:

- user documentation;
- profile and password management;
- validation with the primary user on the real server;
- controlled backup restoration testing;
- documented and verified update/rollback between development and stable image channels.

Advanced editor, calendar-import and sharing ideas remain deferred to the v2 backlog.
