# Weekly Scrum Report – Week 3 
(Sep 22 – Sep 29, 2025)

## Team: Team_15

Scrum Master: Manoj

Sprint: 2

---

## Andrew

**1. What tasks did I work on / complete?**

- Created temporary schema model using mongoose for Listing, Category, and User and seeded with sample data,
- Created API endpoint for searching with filters (name, category, price, date) and pagination (how many per page, how many pages, how many total)
- Create Postman Collection to test API with seeded dummy data.
- Created API endpoint for search listing by id
- Committed code onto git for cross-referencing schema models with Karan
- Converted files to TypeScript to match the team’s tech stack.
- Worked on mocking up the frontend UI on figma.

**2. What am I planning to work on next?**

- Refactor code structure to match Manoj’s code structure
- Include product id in the Listing’s schema instead of using the default id given by mongo (and cross-reference with Manoj’s schema)
- Continue to work on frontend UI, meet with Karan to work together on Viewing/Creating Listing UI.

**3. What tasks are blocked waiting on another team member?**

- No blockers at the moment.

---

## Karan

**1. What tasks did I work on / complete?**

- Designed and implemented the **Listing schema** in TypeScript with fields for user reference, category, title, description, price, photos, and status.
- Built Express routes for:
    - **Creating a new listing** with details and photos.
    - **Marking a listing as SOLD** so it won’t be visible to buyers.

**2. What am I planning to work on next?**

- Start building the **frontend for listings** so sellers can create listings and update status visually.
- Connect the backend APIs to **MongoDB** .
- Test with **mock data** in MongoDB to ensure the complete flow (create → view → mark as sold) is working.

**3. What tasks are blocked waiting on another team member?**

- No blockers

---

## Abhishek

**1. What tasks did I work on / complete?**

- Designed and implemented **user sign-up flow** with email verification, including token hashing, domain validation, and pending-to-active status transitions.
- Built **login flow with MFA support**, including password verification, TOTP validation, and rate-limit checks for failed login attempts.
- Developed **refresh token rotation mechanism**, ensuring old tokens are revoked and new ones are issued securely.
- Implemented **database schema** for authentication system: `users`, `sessions`, `email_verifications`, `password_resets`, `login_attempts`, `audit_log`, and `roles`.
- Integrated **email service** for sending verification links and password reset requests.
- Added **audit logging** for critical actions (sign-up, login, logout, refresh, role changes, etc.).

**2. What am I planning to work on next?**

- Implement **password reset flow**, including generating reset tokens, validating them, and updating password hashes.
- Add **role-based access control (RBAC)** enforcement in API endpoints using `user_roles` and `roles` tables.
- Enhance **security monitoring** by building queries on `login_attempts` to detect suspicious activity.
- Begin work on **admin tools** for suspending/reactivating users and managing roles.
- Start development on **edit listing feature** once dependency is unblocked.

**3. What tasks are blocked waiting on another team member?**

- Dependency on **Karan** to complete the **add listing feature**, which is a prerequisite for starting work on **edit listing**.
- Waiting on **frontend** integration of the new sign-up/login/verification flows into the client app.

---

## Manoj

**1. What tasks did I work on / complete?**

- Implemented a real-time chat system using both HTTP (REST) and WebSockets (Socket.IO).
- Broke the entire codebase into the following:
    - models — defined Conversation (unique per product-buyer-seller) and Message schemas with indexing for performance.
    - handlers — built controller logic for initiating chats, fetching conversation history, and sending messages.
    - routes — wired REST endpoints to handlers, enforcing buyer-only initiation.
    - middleware — added JWT-based authentication to secure both REST and WebSocket flows.
    - utils  — implemented socket.ts for Socket.IO server setup and rateLimit.ts for basic message throttling.
- Restructured entry points for clarity:
    - index.ts at the top-level (server + socket initialization).
    - app.ts as the Express application setup (middleware, routes, etc.).

**2. What am I planning to work on next?**

- Build the UI for chat conversations, including real-time message updates and optimistic sending.
- Once the chat UI is stable, start designing and implementing the report listing functionality to allow better moderation and user tracking.
- Begin with the report listing feature after the UI is fixed and locked.

**3. What tasks are blocked waiting on another team member?**

- While not fully blocked, adjustments are needed in the **User** and **Product** models (e.g., ensuring product → sellerId references and user IDs are standardized). These changes are required to fully enable buyer-to-seller chat initiation as per the req.
