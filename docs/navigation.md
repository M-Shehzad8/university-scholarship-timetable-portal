# Navigation and Dashboard Design

> **Status:** Phase 4 complete. The portal requires authentication, navigation is filtered by role, dashboards show the signed-in user, coordinators can manage accounts, the scholarship module is live, and the timetable and room modules are live. Dashboard figures and reports remain placeholders until Phase 5.

## 1. Goals

- Keep the two academic modules easy to reach.
- Make role differences obvious without creating separate applications.
- Use one consistent page shell, typography scale, table style, and empty/error treatment.
- Keep the dashboard small and action-oriented rather than an analytics surface.

## 2. Route map

| Route                  | Audience                          | Current state                                      | Final purpose                                             |
| ---------------------- | --------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `/`                    | Public overview                   | Public landing page                                | Explains the portal and links to sign in                  |
| `/login`               | Anonymous                         | Login form with demo-account hint                  | Authenticate and start a session                          |
| `/dashboard`           | All authenticated roles           | Protected, role-specific summary with placeholders | Role-specific live summaries and shortcuts                |
| `/scholarships`        | Students; staff management        | Live catalogue, filters, bookmarks, staff CRUD     | Search, filter, detail, save, and staff maintenance       |
| `/timetable`           | Students; staff/coordinator views | Live filtered schedule and student batch view      | Weekly timetable, batch/teacher views, conflict checks    |
| `/timetable/new`       | Staff                             | Live create form                                   | Add a conflict-checked timetable row                      |
| `/timetable/[id]/edit` | Staff                             | Live edit form                                     | Update a row and re-check conflicts                       |
| `/timetable/courses`   | Staff; coordinator read-only      | Live course CRUD                                   | Maintain department course reference data                 |
| `/timetable/teachers`  | Staff; coordinator read-only      | Live teacher CRUD                                  | Maintain department teacher reference data                |
| `/timetable/batches`   | Staff; coordinator read-only      | Live batch/section CRUD                            | Maintain department batch reference data                  |
| `/rooms`               | Staff and coordinator             | Live room CRUD and today's usage                   | Department room records and availability                  |
| `/reports`             | Staff and coordinator             | Protected report definition cards                  | Active/expiring scholarships, timetable, rooms, conflicts |
| `/users`               | Coordinator                       | Live account, role, and activation controls        | User, role, batch, and department management              |

The portal routes are grouped under `app/(portal)/` so the shared shell does not wrap the public landing page. The route group does not appear in the URL.

## 3. Navigation groups

The shell renders only the groups available to the signed-in role. The server remains the security boundary: page guards and server actions reject access even if a URL is typed directly. Hiding a link is never sufficient authorization.

| Group          | Items                   | Visible to            |
| -------------- | ----------------------- | --------------------- |
| Overview       | Dashboard               | Every signed-in role  |
| Academic       | Scholarships, Timetable | Every signed-in role  |
| Operations     | Rooms, Reports          | Staff and coordinator |
| Administration | People                  | Coordinator           |

## 4. Page shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Sidebar / mobile navigation                                  │
│  University Portal                                           │
│  Dashboard · Scholarships · Timetable                        │
│  Rooms · Reports · People (role-filtered)                    │
│  Signed-in name · role badge · email · scope                 │
├──────────────────────────────────────────────────────────────┤
│ Top bar: Signed in as ... · Public overview · Sign out       │
│                                                              │
│ Page header: eyebrow, title, description, actions            │
│ Alerts, cards, tables, empty states                          │
│                                                              │
│ Footer: project name · current phase                         │
└──────────────────────────────────────────────────────────────┘
```

Behaviour:

- Desktop: a persistent left sidebar with grouped navigation.
- Mobile: the sidebar becomes a compact top block and the navigation scrolls horizontally.
- The sidebar account card shows the signed-in name, role, email, and batch or department scope.
- The top bar always provides a sign-out action, including on mobile.
- A skip link moves keyboard focus directly to the main content.
- `aria-current="page"` identifies the active navigation item.
- The shell uses a maximum content width of `7xl` and responsive padding.
- Unauthenticated visits to any portal route redirect to `/login`.

## 5. Dashboard structure

### 5.1 Student dashboard

| Card                | Source rule                                            |
| ------------------- | ------------------------------------------------------ |
| Active scholarships | Published records whose deadline has not passed        |
| Deadlines soon      | Active records with a deadline within 14 days          |
| Saved scholarships  | Bookmarks belonging to the signed-in student           |
| Today's classes     | Entries for the student's batch on the current weekday |
| Next class          | The next upcoming entry for the student's batch        |

The dashboard renders only the metrics and shortcuts for the signed-in role. A student sees the student summary; staff and coordinators see the operational summary. The coordinator additionally receives the People shortcut and account-management access.

Each card links to the relevant filtered list or timetable view.

### 5.2 Staff and coordinator dashboard

| Card                | Source rule                                        |
| ------------------- | -------------------------------------------------- |
| Active scholarships | Published records whose deadline has not passed    |
| Expiring soon       | Active records with a deadline within 14 days      |
| Total rooms         | Department rooms                                   |
| Classes scheduled   | Timetable entries in scope                         |
| Free rooms today    | Department rooms with no class in the current slot |
| Timetable conflicts | Overlaps present in data that need staff attention |

The coordinator has the same operational signal as staff, plus access to people and department-wide reports. The dashboard is not a full analytics product.

## 6. UI component foundation

| Component            | File                                            | Purpose                                                  |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `Button`             | `components/ui/button.tsx`                      | Primary, secondary, ghost, and danger actions            |
| `Badge`              | `components/ui/badge.tsx`                       | Neutral, success, warning, danger, and info labels       |
| `Card` family        | `components/ui/card.tsx`                        | Consistent content grouping                              |
| `Input`              | `components/ui/input.tsx`                       | Text input with shared control styles                    |
| `Select`             | `components/ui/select.tsx`                      | Native select with the same control styles               |
| `Textarea`           | `components/ui/textarea.tsx`                    | Multi-line input                                         |
| `Field`              | `components/ui/field.tsx`                       | Label, hint, and field-level error                       |
| `Table` family       | `components/ui/table.tsx`                       | Responsive, readable data tables                         |
| `EmptyState`         | `components/ui/empty-state.tsx`                 | Clear no-data guidance                                   |
| `Alert`              | `components/ui/alert.tsx`                       | Inline information, success, warning, and error          |
| `PageHeader`         | `components/ui/page-header.tsx`                 | Page title, description, and action area                 |
| `StatCard`           | `components/ui/stat-card.tsx`                   | Dashboard metric demonstration                           |
| `PortalShell`        | `components/portal/portal-shell.tsx`            | Sidebar, account card, top bar, content area, and footer |
| `PortalNav`          | `components/portal/portal-nav.tsx`              | Active-route navigation, filtered by role                |
| `LoginForm`          | `app/login/login-form.tsx`                      | Client login form using `useActionState`                 |
| `CreateUserForm`     | `app/(portal)/users/create-user-form.tsx`       | Coordinator account creation with role-aware fields      |
| `TimetableTable`     | `components/timetable/timetable-table.tsx`      | Shared day/time/course/batch/teacher/room table          |
| `TimetableEntryForm` | `components/timetable/timetable-entry-form.tsx` | Client create/edit form with server feedback             |
| `ReferenceManager`   | `components/timetable/reference-manager.tsx`    | Shared reference table plus staff create/edit panel      |
| `StudentTimetable`   | `components/timetable/student-timetable.tsx`    | Student today, next-class, and weekly views              |

Navigation data and the role filter live in `lib/portal/navigation.ts`. Authentication modules live in `lib/auth/`. The class-name helper lives in `lib/utils/cn.ts`.

## 7. State handling

Every data screen introduced later must define:

- **Loading:** a skeleton or pending indicator that preserves layout.
- **Empty:** a specific explanation and a next action where one makes sense.
- **Error:** a readable message with a retry path; errors never expose internals.
- **Success:** the normal content with no misleading placeholder values.

The portal includes a route-level loading skeleton, in-shell and root error boundaries, explicit empty/placeholder states, and login, user-management, scholarship, and timetable mutation feedback. Live dashboard summaries and reports remain Phase 5 work.

## 8. Responsive and accessibility rules

- Content remains readable at mobile widths without horizontal page scrolling.
- Tables scroll inside their card rather than widening the page.
- Navigation uses real links and `aria-current`.
- Form controls always have a visible label; hints and errors are connected by ID.
- Colour is not the only signal: status labels include text.
- Focus outlines remain visible; buttons and links have keyboard focus styles.
- Page headings follow a single `h1` and nested section headings.
- Decorative marks are hidden from assistive technology.

## 9. Phase boundaries

- Phase 2 is implemented: authentication, session handling, role checks, protected routes, role-specific navigation, role-specific dashboards, and coordinator user management.
- Phase 3 is implemented: the scholarship catalogue, search, filters, detail pages, bookmarks, and staff lifecycle actions.
- Phase 4 is implemented: timetable and room reference data, timetable row CRUD, conflict checks, automatic room assignment, role-aware timetable views, and today's room usage.
- Phase 5 replaces dashboard placeholders and report definitions with live summaries.
