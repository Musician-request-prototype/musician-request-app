Customer Page V4 - Public View Test (read-only)

Upload all five files to a NEW GitHub Pages folder, such as customer-test-v4-view/; do not overwrite existing V3 or V4.

The browser queries only public.customer_request_songs (not musicians or songs).
The Supabase publishable key is public by design. No secret key is included.
Requests, votes and tips remain simulated; no database writes occur.
If more than one musician ID is returned, this diagnostic deliberately fails instead of mixing accounts. This is not the final multi-musician routing design.
Do not invite beta testers yet. A real per-musician public identifier and integration/security testing are still required.
