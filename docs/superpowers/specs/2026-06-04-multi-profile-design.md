# Multi Profile Design

## Goal

Allow one authenticated user to manage multiple birth profiles while keeping the existing default-profile consultation and chart flows stable.

## Scope

- Convert `Profile.userId` from one-to-one to one-to-many.
- Add `label` for relationship naming and `isDefault` for backward-compatible default selection.
- Keep `POST /api/v1/users/me/profile` as the default-profile upsert endpoint.
- Add authenticated profile management endpoints for listing, creating, and setting the default profile.
- Surface the first usable UI on the account page.

## Out Of Scope

- Full profile switcher on every chart and consultation page.
- Compatibility chart analysis.
- Invite links.

## API

- `GET /api/v1/users/me/profiles` returns all profiles owned by the current user and the default profile id.
- `POST /api/v1/users/me/profiles` creates a profile. If it is the user's first profile, it becomes default.
- `PATCH /api/v1/users/me/profiles/:id/default` makes the selected profile default.
- Existing `POST /api/v1/users/me/profile` updates the current default profile or creates one if none exists.

## Data Model

`Profile` keeps all existing birth fields and adds:

- `label String?`
- `isDefault Boolean @default(false)`

`User` changes from `profile Profile?` to `profiles Profile[]`.

## Testing

- Profile service tests cover creating multiple profiles, first-profile defaulting, explicit default switching, and default-profile upsert compatibility.
- User chart archive tests cover using the default profile after `userId` is no longer unique.
- Frontend API tests cover new profile endpoints.
