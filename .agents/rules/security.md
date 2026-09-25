# Security Rule

Tokens, credentials, callbacks, and Tauri permissions are sensitive.
Never expose provider secrets, persist long-lived secrets in localStorage, weaken auth, or add broad native permissions.
Notes marked private/diary are excluded from the shared RAG index by default — never include them in cross-domain AI context unless the user has explicitly opted that note in.
