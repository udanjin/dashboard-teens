# Dashboard Multi-Role Layout Approach

## Problem
Currently, the frontend dashboard uses mutually exclusive checks (e.g., `!canViewFclSummary && canViewFcl`) to decide which widget to show. This means that if a user has both the `fcl` and `leader` roles, the leader-specific widget (`LeaderCellGroupWidget`) gets hidden because the user has the `FCL_VIEW_SUMMARY` permission. The user needs a way to view both FCL overview widgets and their specific cell group trends.

## Solution: Unified Modular Grid
We will update the dashboard to render a "Bento Box" style unified grid. Widgets will no longer be mutually exclusive based on lacking permissions; instead, we will use positive permission/role checks to render all applicable widgets.

### Changes
1. **Remove Mutually Exclusive Checks**:
   - In `d:\Freelance\dashboard-teens\frontend\src\app\dashboard\page.tsx`, the logic for rendering `LeaderCellGroupWidget` will be changed from `!canViewFclSummary && canViewFcl` to `hasPermission(PERMISSIONS.FCL_MANAGE_MEMBERS)` (or `user.roles.includes("leader")`).
   - The logic for rendering `AttendanceTrendWidget` will remain `canViewFclSummary`.

2. **Dashboard Layout Updates**:
   - Both widgets will be rendered within the `Row` / `Col` masonry grid on the left side (`lg={15} xl={16}`).
   - They will render vertically stacked (or handled responsively) allowing the user to seamlessly scroll through all their authorized views without switching tabs.

## Verification
- We will login as a multi-role user (both `fcl` and `leader`).
- Verify that both `AttendanceTrendWidget` and `LeaderCellGroupWidget` are rendered on the dashboard simultaneously.
