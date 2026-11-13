# Lab 4 Homework – ShopAdmin backend

REST API for the provided **ShopAdmin** Web UI (admin & storefront).
Stack: **Node.js + Express 5, MySQL (mysql2), bcryptjs, jsonwebtoken, Multer**.

```
lab4-homework/
├── backend/
│   ├── config/          db.js (MySQL pool + auto create tables), schema.sql
│   ├── controllers/     auth, user, category, product
│   ├── middleware/      auth.js (protect / adminOnly), upload.js (Multer), validateId.js, errorHandler.js
│   ├── models/          SQL queries for users, categories, products
│   ├── routes/          auth, user, category, product
│   ├── uploads/         avatar files (served at /uploads)
│   ├── .env.example
│   └── server.js
└── frontend/            the provided Web UI (not modified)
```

## Setup

1. Install **Node.js 18+** and **MySQL 8**.
2. Install the packages:
   ```bash
   cd lab4-homework/backend
   npm install
   ```
3. Create the `.env` file from the example and fill in your MySQL password and a JWT secret:
   ```bash
   cp .env.example .env
   ```
4. Start the API (the database `lab4_shop` and its 3 tables are created automatically on the first run):
   ```bash
   npm run dev      # or: npm start
   ```
   You should see `ShopAdmin API running at http://localhost:4000`.
5. Open `frontend/index.html` with Live Server. `frontend/config.js` already points to `http://localhost:4000/api/v1`.

## Database

| Table | Columns | Notes |
|---|---|---|
| `users` | id, full_name, age, gender, email, password_hash, avatar_url, type, created_at | `email` UNIQUE, `type` is `normal` or `admin`, password stored as a bcrypt hash |
| `categories` | id, name | `name` UNIQUE |
| `products` | id, category_id, name, quantity, price | `category_id` → `categories.id` (ON DELETE RESTRICT) |

The API returns camelCase fields (`fullName`, `avatarUrl`, `categoryId`, …) and **never** returns `password_hash`.

## API

Base URL: `http://localhost:4000/api/v1` – all responses are JSON `{ success, message?, data? }`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Create an account (`fullName, age, gender, email, password, type`) → 201, duplicate email → 409 |
| POST | `/auth/login` | public | Check the password with bcrypt and return `{ token, user }` |
| GET | `/auth/me` | logged in | The current user's profile |
| PUT | `/users/me` | logged in | Update `fullName`, `age`, `gender` of the current user |
| POST | `/users/me/avatar` | logged in | Upload / replace the avatar (`multipart/form-data`, field `avatar`, JPG/PNG/WEBP, max 2 MB) |
| GET | `/categories` | logged in | List categories |
| POST / PUT / DELETE | `/categories`, `/categories/:id` | **admin** | Create / rename / delete a category |
| GET | `/products?categoryId=` | logged in | List products (optionally of one category) |
| GET | `/products/:id` | logged in | One product |
| POST / PUT / DELETE | `/products`, `/products/:id` | **admin** | Create / update / delete a product |

### Authentication & permissions

- Login signs a JWT with the payload `{ id, type }` using `JWT_SECRET` from `.env` (expires after `JWT_EXPIRES_IN`, default 1 day).
- The UI sends it as `Authorization: Bearer <token>`.
- No token, an invalid token or an expired token → **401 Unauthorized**.
- A valid token of a `normal` user on a create / edit / delete route → **403 Forbidden**
  (`"Forbidden: only admin users can perform this action."`).
- The avatar route always uses `req.user.id` from the token, so users can only change their own avatar.

### Status codes

`200` OK · `201` Created · `400` invalid data / invalid id · `401` not logged in · `403` not admin ·
`404` not found · `409` duplicate email or category name, or deleting a category that still has products ·
`413` avatar larger than 2 MB · `500` server error
