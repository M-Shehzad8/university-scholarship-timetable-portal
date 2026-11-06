# Navigation and Dashboard Design

> **Status:** Phase 1 foundation. The route shell, navigation groups, dashboard structure, and shared UI components exist. Authentication, live data, and role filtering arrive in later phases.

## 1. Goals

- Keep the two academic modules easy to reach.
- Make role differences obvious without creating separate applications.
- Use one consistent page shell, typography scale, table style, and empty/error treatment.
- Keep the dashboard small and action-oriented rather than an analytics surface.

## 2. Route map

| Route           | Audience                          | Current Phase 1 state                   | Final purpose                                             |
| --------------- | --------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| `/`             | Public overview                   | Public landing page                     | Explains the portal and links into the preview            |
| `/dashboard`    | All authenticated roles           | Static dashboard structure              | Role-specific summaries and shortcuts                     |
| `/scholarships` | Students; staff management        | Empty catalogue preview                 | Search, filter, detail, save, and staff maintenance       |
| `/timetable`    | Students; staff/coordinator views | Empty schedule preview and rule summary | Weekly timetable, batch/teacher views, conflict checks    |
| `/rooms`        | Staff and coordinator             | Empty room list preview                 | Department room records and availability                  |
| `/reports`      | Staff and coordinator             | Report definition cards                 | Active/expiring scholarships, timetable, rooms, conflicts |
| `/users`        | Coordinator                       | Role matrix preview                     | User, role, batch, and department management              |
| `/login`        | Anonymous                         | Not built                               | Login form                                                |

The portal routes are grouped under `app/(portal)/` so the shared shell does not wrap the public landing page. The route group does not appear in the URL.

## 3. Navigation groups

| Group          | Items                   | Notes                           |
| -------------- | ----------------------- | ------------------------------- |
| Overview       | Dashboard               | Visible to every signed-in role |
| Academic       | Scholarships, Timetable | Visible to every signed-in role |
| Operations     | Rooms, Reports          | Staff and coordinator           |
| Administration | People                  | Coordinator                     |

The current shell shows every group because authentication is not implemented. Phase 2 hides unavailable groups for the signed-in role, but the server remains the security boundary. Hiding a link is never sufficient authorization.

## 4. Page shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Sidebar / mobile navigation                                  │
│  University Portal                                           │
│  Dashboard · Scholarships · Timetable                        │
│  Rooms · Reports · People                                    │
│  Foundation status                                          │
├──────────────────────────────────────────────────────────────┤
│ Top bar: Portal preview · Public overview                    │
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
- A skip link moves keyboard focus directly to the main content.
- `aria-current="page"` identifies the active navigation item.
- The shell uses a maximum content width of `7xl` and responsive padding.

## 5. Dashboard structure

### 5.1 Student dashboard

| Card                | Source rule                                            |
| ------------------- | ------------------------------------------------------ |
| Active scholarships | Published records whose deadline has not passed        |
| Deadlines soon      | Active records with a deadline within 14 days          |
| Saved scholarships  | Bookmarks belonging to the signed-in student           |
| Today's classes     | Entries for the student's batch on the current weekday |
| Next class          | The next upcoming entry for the student's batch        |

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

| Component      | File                                 | Purpose                                            |
| -------------- | ------------------------------------ | -------------------------------------------------- |
| `Button`       | `components/ui/button.tsx`           | Primary, secondary, ghost, and danger actions      |
| `Badge`        | `components/ui/badge.tsx`            | Neutral, success, warning, danger, and info labels |
| `Card` family  | `components/ui/card.tsx`             | Consistent content grouping                        |
| `Input`        | `components/ui/input.tsx`            | Text input with shared control styles              |
| `Select`       | `components/ui/select.tsx`           | Native select with the same control styles         |
| `Textarea`     | `components/ui/textarea.tsx`         | Multi-line input                                   |
| `Field`        | `components/ui/field.tsx`            | Label, hint, and field-level error                 |
| `Table` family | `components/ui/table.tsx`            | Responsive, readable data tables                   |
| `EmptyState`   | `components/ui/empty-state.tsx`      | Clear no-data guidance                             |
| `Alert`        | `components/ui/alert.tsx`            | Inline information, success, warning, and error    |
| `PageHeader`   | `components/ui/page-header.tsx`      | Page title, description, and action area           |
| `StatCard`     | `components/ui/stat-card.tsx`        | Dashboard metric demonstration                     |
| `PortalShell`  | `components/portal/portal-shell.tsx` | Sidebar, top bar, content area, and footer         |
| `PortalNav`    | `components/portal/portal-nav.tsx`   | Active-route navigation                            |

Navigation data lives in `lib/portal/navigation.ts`. The class-name helper lives in `lib/utils/cn.ts`.

## 7. State handling

Every data screen introduced later must define:

- **Loading:** a skeleton or pending indicator that preserves layout.
- **Empty:** a specific explanation and a next action where one makes sense.
- **Error:** a readable message with a retry path; errors never expose internals.
- **Success:** the normal content with no misleading placeholder values.

The Phase 1 portal includes a route-level loading skeleton and explicit empty/placeholder states. Live errors and mutation feedback are added with the relevant module.

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

- Phase 2 adds authentication, session handling, role checks, and role-specific navigation.
- Phase 3 replaces the scholarship placeholder with the real catalogue and staff forms.
- Phase 4 replaces the timetable and room placeholders with real scheduling.
- Phase 5 replaces dashboard placeholders and report definitions with live summaries.
