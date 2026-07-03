# Notifications API — backend implementation spec

This is a handoff spec for the `tfc-userstories` backend (the frontend in `apps/web` already
calls these endpoints through proxy routes and degrades gracefully — empty list, no crash —
until they exist).

## 1. Data model

```
Notification
  id          int/uuid, PK
  user_id     FK -> users.id   (the recipient)
  message     string           (fully formed, human-readable; frontend just displays it)
  read        bool, default false
  created_at  timestamp, default now()
```

One row per recipient. There is no separate "event" or "broadcast" concept — if an action
needs to tell five people, insert five rows with the same `message` and each person's
`user_id`. A small helper is enough:

```python
def notify(recipient_ids: list[int], message: str) -> None:
    for uid in recipient_ids:
        Notification.create(user_id=uid, message=message)
```

## 2. Endpoints

All endpoints use the same Bearer-token auth as `/auth/me` (resolve the caller from the
token; never trust a `user_id` param for "whose notifications am I reading").

| Method | Path | Behavior |
|---|---|---|
| GET | `/notifications` | Return the caller's notifications, newest first, max 50. `[{ id, message, read, created_at }]` |
| PATCH | `/notifications/{id}/read` | Mark one notification as read. 404 if it doesn't belong to the caller. |
| PATCH | `/notifications/read-all` | Mark all of the caller's notifications as read. |

No websocket/push is required — the frontend polls `GET /notifications` periodically.

## 3. Triggers — call `notify(...)` from these existing endpoints

For "other team/project members", look up the current membership (the same query backing
`GET /teams/{id}/members`) **before** removing a row, and exclude the acting admin from that
list (the admin gets their own tailored message separately).

| Action | Endpoint | Recipients | Message |
|---|---|---|---|
| Add team member | `POST /teams/{id}/members` | new member; other existing members of that team; acting admin | new member: `You were added to "{team}".` <br> others: `{newMember.name} joined "{team}".` <br> admin: `You added {email} to "{team}".` |
| Remove team member | `DELETE /teams/{id}/members/{user_id}` | removed user; remaining team members; acting admin | removed: `You were removed from "{team}".` <br> remaining: `{removed.name} left "{team}".` <br> admin: `You removed {email} from "{team}".` |
| Create team | `POST /projects/{id}/teams` | acting admin only (team has no members yet) | `You created team "{team}" in "{project}".` |
| Delete team | `DELETE /projects/{id}/teams/{teamId}` | all members of that team at time of deletion; acting admin | members: `Team "{team}" was deleted.` <br> admin: `You deleted team "{team}".` |
| Create project | `POST /organizations/{id}/projects` | acting admin only | `You created project "{project}".` |
| Delete project | `DELETE /organizations/{id}/projects/{projectId}` | every member across every team under that project; acting admin | members: `Project "{project}" was deleted.` <br> admin: `You deleted project "{project}".` |
| Configure/replace organization | `POST /organizations` (+ the `PATCH /auth/me/organization` association) | acting admin only (org is single-admin in this product) | `Organization "{org}" was configured.` |
| Delete/disassociate organization | `DELETE /organizations/{id}` | acting admin only | `You disassociated from organization "{org}".` |

**Out of scope** — don't create notifications for these, they have no other recipient:
achievement tag equip, user-story evaluation create/delete.

## 4. Frontend contract reminder

The Next.js app calls these through `/api/notifications`, `/api/notifications/{id}/read`,
and `/api/notifications/read-all`, forwarding the caller's `Authorization` header as-is. Keep
response shapes exactly as in section 2 — the frontend maps `created_at` to a display
timestamp and does no other transformation.
