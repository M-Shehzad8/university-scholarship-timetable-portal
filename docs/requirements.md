# Requirements

This document captures the baseline scope of the portal. Detailed use cases, acceptance criteria, and screen flows are finalised in Phase 1. The authoritative scope and constraints remain [plan.md](../plan.md).

## Purpose

Provide two useful university academic services in one focused application:

1. A maintained catalogue of scholarship opportunities that students can browse, search, filter, and save.
2. A departmental timetable that staff can maintain, with conflict checking and simple automatic room assignment.

## Users and roles

| Role             | Needs                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Student          | Find relevant scholarships, track deadlines, save opportunities, and view their batch timetable |
| Authorised staff | Maintain scholarship information and timetable records accurately                               |
| Coordinator      | Manage portal users and department records, and monitor scholarship and timetable status        |

## Functional scope

### Scholarships

- **Students:** list active scholarships, search by title/provider/keyword, filter by eligibility fields, open a detail page, view benefits and required documents, follow the official application link, save/bookmark opportunities, and distinguish active from expired records.
- **Staff:** create, edit, publish, archive/expire, and delete scholarship records; keep the last-updated information current.

Minimum record fields: title, provider, description, eligibility, benefits, required documents, deadline, application URL, status, and timestamps.

### Timetable

- **Students:** view the timetable for their batch/section, including today's and upcoming classes.
- **Staff:** maintain courses, teachers, batches/sections, rooms, and timetable entries; run conflict checks and request automatic room assignment.

Minimum timetable entry fields: course, batch/section, teacher, day, start time, end time, and room.

### Conflict rules

Before a timetable entry is saved, reject it when any of the following overlap:

- the same teacher has another class;
- the same batch/section has another class;
- the same room is assigned to another class.

Overlap is evaluated with standard interval logic.

### Automatic room assignment

For a selected day and time interval, search the department's rooms, discard occupied rooms, and assign the first free room in a deterministic order. Report clearly when no room is available.

### Dashboards and notifications

- **Student dashboard:** active scholarships, deadlines soon, saved scholarships, today's classes, next class.
- **Staff/coordinator dashboard:** active scholarships, expiring soon, rooms, scheduled classes, free rooms today, timetable conflicts.
- **Notifications:** in-system only, covering scholarship publication/deadline/expiry and timetable changes, room assignments, and conflicts.

### Reports

Small, useful views only: active scholarships, expiring scholarships, timetable by batch, timetable by teacher, room usage, and a conflict summary.

## Out of scope

The following are explicitly excluded unless the project scope is formally changed:

- Web scraping or crawling scholarship data.
- Automatic scholarship applications or recommendations.
- Full automatic timetable generation or scheduling optimisation.
- Attendance, fees, hostel, library, transport, LMS, or ERP integration.
- Chat, video calls, SMS, WhatsApp, or native mobile applications.
- Custom machine-learning training or large data collection.
- Blockchain, microservices, or multi-university tenancy.

## Non-functional requirements

- **Security:** server-side authentication and authorization; hashed passwords; secrets only in environment variables; validated input.
- **Usability:** clear navigation, responsive layouts, tidy table-oriented timetable input, and explicit loading, empty, and error states.
- **Maintainability:** TypeScript types, shared domain functions, centralized data access, and no duplicated business rules.
- **Testability:** conflict and room-assignment logic must be unit-testable without a browser.
- **Explainability:** every business rule must have a short, accurate viva explanation.

## Current status

Phase 0 established the runnable foundation. Requirements, use cases, and acceptance criteria are scheduled for completion in Phase 1.
