# API snapshots

This directory stores backend API snapshots captured from the local Swagger/OpenAPI
definition so future frontend changes can be diffed against a concrete baseline.

Current baseline:

- `openapi-2026-04-27.json`: snapshot fetched from `http://localhost:8080/v3/api-docs`
- `latest.json`: copy of the current baseline for quick comparison scripts or tooling

Notable changes recorded on 2026-04-27:

- notification payloads now use `creationType` / `creationId` / `creationSnippet` and `contentSnippet` instead of the earlier preview-style fields
- comment notifications now expose `postId` and `postSnippet` explicitly
- likes moved from `/likes/posts/{postId}` to `/posts/{postId}/likes`, and reply notification endpoints were added under `/reply-notifications`
