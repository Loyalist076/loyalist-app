---
trigger: always_on
---

# Production-Level Engineering Standards: Express.js & Vanilla Web Stack

Apply these rules strictly to transform the project into a high-performance, secure, and maintainable "FAANG-level" codebase.

---

## 1. Express.js: Backend Architecture & Security
* **Layered Architecture:** Implement the **Controller-Service-Repository** pattern.
    * `Routes`: Route definitions and middleware mapping only.
    * `Controllers`: Extract data from `req`, call services, and send `res`. No business logic.
    * `Services`: All business logic, calculations, and third-party API calls.
    * `Models/Repository`: Database interactions and data schemas.
* **Global Error Handling:** Prohibit `try-catch` in every controller. Use an `asyncWrapper` utility and a centralized Error Middleware to handle all exceptions and prevent server crashes.
* **Input Validation:** Use `Zod` or `Joi` to validate `req.body`, `req.query`, and `req.params`. If validation fails, return `400 Bad Request` before reaching the controller.
* **Security Headers:** Middleware must include `helmet()` for secure headers and `cors()` with a strict whitelist.
* **Performance:** Enable `compression()` for all responses and `express-rate-limit` for API protection.

## 2. Vanilla JavaScript: Frontend Modularization
* **ESM Architecture:** Strictly use `<script type="module">`. Split logic into:
    * `api.js`: Centralized fetch/axios calls with error handling.
    * `dom.js`: Reusable UI manipulation functions.
    * `app.js`: Main execution and event orchestration.
* **State Management:** Do not store data in the DOM (e.g., in `data-` attributes). Maintain a clean JavaScript `state` object and update the UI based on state changes.
* **Event Delegation:** Minimize memory leaks. Attach listeners to parent elements instead of multiple child nodes.
* **Sanitization:** Always use `textContent` instead of `innerHTML` when handling user-generated data to prevent XSS.

## 3. CSS: Scalability & Performance
* **Design Tokens:** Use CSS Variables (`:root`) for colors, typography, spacing, and transitions. No hardcoded hex codes in the body.
* **BEM Convention:** Use Block-Element-Modifier (e.g., `.nav__item--active`) to prevent style bleeding and ensure flat specificity.
* **Responsive Integrity:** Use a Mobile-First approach. Use `rem` for font sizes and `em` for media queries to maintain accessibility.

## 4. Documentation & Code Quality
* **JSDoc Typing:** Every function must have JSDoc comments defining `@param` types and `@returns`. This acts as a "poor man's TypeScript" for VS Code intellisense.
* **Environmental Parity:** Use a `config.js` to load `process.env` variables. Never call `process.env` directly inside business logic.
* **Logging:** Use `morgan` for HTTP request logging and `winston` for systematic application logs (Error, Warn, Info).

---

## 5. Directory Structure
```text
/
├── public/                 # Static assets (HTML, CSS, Client JS)
│   ├── css/
│   ├── js/
│   └── index.html
├── src/                    # Backend Source
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── app.js
├── .env.example            # Template for env variables
├── .gitignore
└── server.js               # Entry point