# API snapshots

This directory stores backend API snapshots captured from the local Swagger/OpenAPI
definition so future frontend changes can be diffed against a concrete baseline.

Current baseline:

- `openapi-2026-04-22.json`: snapshot fetched from `http://localhost:8080/v3/api-docs`
- `latest.json`: copy of the current baseline for quick comparison scripts or tooling

Notable changes recorded on 2026-04-22:

- `DELETE /posts/{postId}/comments/{commentId}` replaced the previous top-level comment delete path
- `DELETE /posts/{postId}/comments/{commentId}/replies/{replyId}` was added for deleting second-level replies
- comment/reply list and create endpoints remain under the nested post/comment path structure
