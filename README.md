
## Deploying the frontend to Vercel

This repository contains the React/Vite frontend. Authentication, registration, learner records and progress require the separate ASP.NET Core API and SQL Server database described above; Vercel does not host that backend or database automatically.

1. Import `BridgetNdlovu/CodeBloom` into Vercel and use the repository root as the project root.
2. Set the build command to `npm run build` and the output directory to `dist` (the install command is `npm install`).
3. In Vercel Project Settings → Environment Variables, set `VITE_API_BASE_URL` to the public HTTPS base URL of the deployed CodeBloom ASP.NET Core API. Do not use `localhost` for a production deployment. Redeploy after changing this variable. The frontend defaults to `http://localhost:5202` only for local development.
4. Configure the API's CORS policy to allow the Vercel production domain and credentials. If the API uses the `cb_token` HttpOnly cookie across different sites, its cookie settings must support secure cross-site use (`Secure` and `SameSite=None`), and the API must allow credentialed requests. Keep secrets such as the Gemini key on the backend, never in `VITE_*` variables.
5. Check the Vercel deployment build log and test `/login` and `/register` against the deployed API. A successful frontend deployment alone does not confirm API, database, or authentication availability.

`vercel.json` rewrites client-side routes to the Vite app so direct navigation and refreshes on routes such as `/login` and `/app` load the application correctly.

### Registration and accounts

The registration screen supports student and instructor roles. Accounts are created through `POST /api/auth/register`; login uses `POST /api/auth/login` and the backend-issued HttpOnly `cb_token` cookie. User creation, role validation, password hashing, duplicate prevention, and database persistence are backend responsibilities. Ensure the API is reachable and configured as above; the frontend deliberately does not create local or demo accounts when the API is unavailable.
