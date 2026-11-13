# Lab 4 – File Upload, External APIs & JWT Authentication

**Course:** Web Application and Database Development Practicum (Backend & Database) – CSBU109
**Student:** Nguyen Minh Tri – 23560042

| Folder | Content | Port |
|---|---|---|
| `lab4-ex1/` | Exercise 1 – Product API with CORS + Web UI using the Fetch API (update, category filter, visible errors) | 5001 |
| `lab4-ex2/` | Exercise 2 – Upload / download / list / delete files with Multer + gallery UI | 5001 |
| `lab4-ex3/` | Exercise 3 – Weather API that calls Open-Meteo with axios (cache, 504 timeout, timing log, retry) | 5001 |
| `lab4-ex4/` | Exercise 4 – Task Manager: 10 backend bugs found with DevTools and fixed (see `lab4-ex4/BUGS.md`) | 5002 |
| `lab4-homework/` | Homework – ShopAdmin backend (Express + MySQL + bcryptjs + JWT + Multer) for the provided UI | 4000 |

Exercises 1–3 all use port 5001, so run them one at a time.

## Run an exercise

```bash
cd lab4-ex1          # or lab4-ex2, lab4-ex3, lab4-ex4/be
npm install
npm start
```

Then open the client page (`client/index.html`, `client/upload.html`, `fe/index.html`) with Live Server.

The homework has its own setup guide: [`lab4-homework/README.md`](lab4-homework/README.md).

Homework video demo: https://drive.google.com/drive/folders/1qkfUXyxvsPg4zUpYghGIZ7HbA1ot9jZS?usp=sharing