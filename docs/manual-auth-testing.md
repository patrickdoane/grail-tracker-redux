# Authentication Flow Manual Test Checklist

To supplement the automated integration tests, run the backend locally (e.g., `cd grail-server && ./mvnw spring-boot:run`) and exercise the authentication APIs with a REST client such as curl, HTTPie, or Postman. The steps below mirror the manual verification process we have been using when diagnosing regressions in the auth stack.

1. **Happy-path registration**
   - `POST /api/auth/register` with a unique username, email, and password.
   - Expect `201 Created` and verify the response contains a JWT token plus the user payload described by `AuthResponse`.
   - Decode the JWT with a tool like [jwt.io](https://jwt.io) to confirm the subject matches the username and the expiration aligns with the configured `auth.jwt.expiration-minutes`.

2. **Login and token reuse**
   - `POST /api/auth/login` with either the username or email along with the password; confirm a `200 OK` with a new token and the same user payload.
   - Call `GET /api/auth/me` with `Authorization: Bearer <token>` and verify it returns the authenticated user details.
   - Repeat the `GET /api/auth/me` request without the header to ensure the API responds with `401 Unauthorized`.

3. **Protected resource enforcement**
   - Hit any mutating endpoint (for example, `POST /api/items`) without an `Authorization` header and expect `401` or `403`.
   - Repeat the request with a valid Bearer token and confirm it succeeds, matching the security rules that allow anonymous `GET` access but gate other verbs.

4. **Conflict and validation handling**
   - Attempt to register another account using the same username or email and verify that the service rejects the request with a conflict response, demonstrating duplicate protection.

5. **Token expiry simulation (optional)**
   - Temporarily reduce `auth.jwt.expiration-minutes` in `application.properties`, restart the server, obtain a token through login, wait for expiry, and assert that subsequent protected requests are denied.

Document any deviations you observe so that regression tests can be added or bugs can be tracked.
