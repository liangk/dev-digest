# Modern Fullstack Authentication Boilerplate: A Comprehensive Guide  
**Secure Angular + Express + PostgreSQL Starter with HTTP-only Cookies**

Authentication is one of the most critical—and often most misunderstood—parts of fullstack development. Get it wrong, and your app is vulnerable to XSS, CSRF, token theft, or session hijacking. Get it right, and you've still spent weeks on boilerplate before writing a single business feature.

That's why I built the **[Fullstack Auth Boilerplate](https://github.com/liangk/fullstack-auth-boilerplate)** — a secure, production-ready starter kit using **Angular**, **Express**, **PostgreSQL**, and **Prisma**, with authentication implemented the right way: **JWT in HTTP-only cookies**, refresh token rotation, and end-to-end TypeScript.

👉 **GitHub Repo**: [https://github.com/liangk/fullstack-auth-boilerplate](https://github.com/liangk/fullstack-auth-boilerplate)

In this **comprehensive guide**, you'll learn:
- Why this boilerplate is different from typical starters
- How secure authentication works under the hood
- A deep dive into each layer (frontend, backend, database)
- Best practices for security and scalability
- How to run it locally and deploy it
- How to extend it for your next project

Whether you're building an admin dashboard, internal tool, or SaaS platform, this guide will help you **build faster and safer**.

---

## 🚀 What Is This Boilerplate?

The **Fullstack Auth Boilerplate** is not just another "login form + Express API" starter. It's a thoughtfully designed, secure-by-default foundation that reflects real-world best practices.

It includes:
- ✅ User registration & login
- ✅ JWT in **HTTP-only, SameSite cookies** (no localStorage)
- ✅ Refresh token rotation
- ✅ Protected routes (frontend and backend)
- ✅ Type-safe API with **Zod** and **TypeScript**
- ✅ Clean UI with **Angular Material**
- ✅ Database modeling with **Prisma ORM**
- ✅ Automatic token refresh
- ✅ CORS and environment configuration
- ✅ bcrypt password hashing

No Firebase. No Auth0. No email services. No third-party dependencies for auth.

Just pure, secure, and customizable code you fully control.

This is the starter I wish I had when I began building fullstack apps.

---

## 🔐 Why This Approach? The Problem with Common Auth Patterns

Before we dive in, let's address why this boilerplate **does things differently**—and why those differences matter.

### ❌ The Problem: Storing JWTs in `localStorage`

Most tutorials (and even production apps) store JWTs in `localStorage` or `sessionStorage`. Example:

```ts
localStorage.setItem('token', jwt);
```

But this is **dangerous** because:
- `localStorage` is accessible via JavaScript
- If an attacker injects a script (XSS), they can steal the token
- Once stolen, the attacker can impersonate the user indefinitely

> 🚨 **localStorage is not secure for tokens** — it's a common anti-pattern.

### ✅ The Solution: HTTP-only Cookies

This boilerplate uses **HTTP-only cookies** to store JWTs:

```http
Set-Cookie: accessToken=abc123; HttpOnly; Secure; SameSite=Strict
```

Benefits:
- ❌ **Inaccessible to JavaScript** → immune to XSS
- ✅ Automatically sent with requests
- ✅ Can be scoped with `Secure` (HTTPS-only) and `SameSite` flags
- ✅ Supported by all modern browsers

This is the **industry-standard** way to handle session tokens—used by GitHub, Google, and most security-conscious platforms.

---

## 🧱 Architecture Overview

Here's how the system is structured:

```
+-------------------+       +------------------+
|                   |       |                  |
|   Angular App     |<----->|   Express API    |
| (Angular Material)|  HTTPS  (TypeScript)    |
|                   |       |                  |
+-------------------+       +------------------+
                                |
                                | Prisma ORM
                                v
                         +------------------+
                         |   PostgreSQL     |
                         | (User, RefreshToken) |
                         +------------------+
```

### Key Components:
- **Frontend**: Angular handles UI, form validation, and route protection.
- **Backend**: Express validates credentials, issues tokens, and protects routes.
- **Database**: Stores users and refresh tokens securely.
- **Auth Flow**: JWT in HTTP-only cookies + refresh token rotation.

---

## 🔐 Deep Dive: How Authentication Works

Let's walk through the full authentication lifecycle.

### 1. **User Registration**

**Frontend (Angular)**:
- User fills out email and password in an Angular Material form.
- Form validation ensures valid input.
- Data sent to `POST /api/auth/register`.

**Backend (Express)**:
```ts
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: { email, password: hashedPassword }
});
```
- Password is hashed with `bcrypt` (salt + slow hash).
- User saved to PostgreSQL.

✅ No token returned — user must log in.

---

### 2. **Login**

**Frontend**:
- Sends credentials to `POST /api/auth/login`.

**Backend**:
```ts
// Validate credentials
const user = await prisma.user.findUnique({ where: { email } });
if (!user || !await bcrypt.compare(password, user.password)) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

// Generate tokens
const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Store refresh token in DB
await prisma.refreshToken.create({
  data: {
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});

// Set HTTP-only cookie
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000
});
```

✅ Access token in HTTP-only cookie  
✅ Refresh token stored in database

---

### 3. **Protected Routes**

**Frontend (Angular Guard)**:
```ts
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    const res = await fetch('/api/auth/me');
    if (res.ok) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
```

**Backend (Middleware)**:
```ts
export const authenticate = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = payload.userId;
    next();
  });
};
```

✅ Route protection on both sides  
✅ `/me` endpoint returns current user

---

### 4. **Token Refresh (Silent Reauthentication)**

Access tokens expire every 15 minutes. But users shouldn't log in every 15 minutes.

So we use **refresh tokens**:

**Frontend**:
- Detects 401 (token expired)
- Calls `POST /api/auth/refresh`

**Backend**:
```ts
const refreshToken = req.cookies.refreshToken;
const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

if (!stored || stored.expiresAt < new Date()) {
  return res.status(401).json({ error: 'Refresh token invalid' });
}

// Rotate: delete old, create new
await prisma.refreshToken.delete({ where: { token: refreshToken } });
const newRefreshToken = jwt.sign({ userId: stored.userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
await prisma.refreshToken.create({
  data: {
    token: newRefreshToken,
    userId: stored.userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});

// Issue new access token
const newAccessToken = jwt.sign({ userId: stored.userId }, JWT_SECRET, { expiresIn: '15m' });
res.cookie('accessToken', newAccessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000
});
```

✅ **Refresh token rotation** prevents replay attacks  
✅ User stays logged in seamlessly

---

### 5. **Logout**

```ts
// Remove refresh token from DB
await prisma.refreshToken.deleteMany({ where: { userId: req.userId } });

// Clear cookie
res.clearCookie('accessToken');
res.clearCookie('refreshToken');
```

✅ Session fully invalidated  
✅ No lingering tokens

---

## 🛠️ Tech Stack Deep Dive

### Frontend: Angular + Angular Material
- **Angular 17+**: Modern change detection, standalone components, and reactive forms.
- **Angular Material**: `mat-card`, `mat-form-field`, `mat-input`, `mat-button` — consistent, accessible UI.
- **Type Safety**: Services use typed HTTP clients.
- **Route Guards**: `AuthGuard` protects dashboard routes.

### Backend: Express + TypeScript + Zod
- **Express**: Lightweight, flexible, and widely supported.
- **TypeScript**: Shared types with frontend.
- **Zod**: Runtime validation for all API inputs:
  ```ts
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });
  ```
- **Prisma ORM**: Type-safe database queries and migrations.

### Database: PostgreSQL + Prisma
```prisma
model User {
  id       Int      @id @default(autoincrement())
  email    String   @unique
  password String
  tokens   RefreshToken[]
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
}
```

✅ Schema enforces data integrity  
✅ Prisma Migrate handles versioning

---

## 🚦 How to Run It Locally

### Step 1: Clone the Repo
```bash
git clone https://github.com/liangk/fullstack-auth-boilerplate.git
cd fullstack-auth-boilerplate
```

### Step 2: Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Set Up PostgreSQL

Ensure you have PostgreSQL running locally (or use a cloud instance like Neon, Supabase, etc.).

Create a database:
```sql
CREATE DATABASE authdb;
```

### Step 4: Environment Variables

**`backend/.env`**:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/authdb"
JWT_SECRET=your_strong_jwt_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
NODE_ENV=development
PORT=5000
```

> 🔐 Use strong, randomly generated values for JWT secrets in production.

**`frontend/src/environments/environment.ts`**:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};
```

### Step 5: Run Prisma Migrations
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

This creates the `User` and `RefreshToken` tables in your database.

### Step 6: Start Servers
```bash
# Backend
npm run dev

# Frontend
cd ../frontend
ng serve
```

👉 **Frontend**: http://localhost:4200  
👉 **Backend API**: http://localhost:5000/api/auth/me (protected)

You can now:
- Register a new user
- Log in
- Access protected routes
- Test token refresh

---

## 🛡️ Security Best Practices Implemented

| Practice | Implemented? | Why It Matters |
|--------|--------------|---------------|
| HTTP-only cookies | ✅ | Prevents XSS token theft |
| Secure flag | ✅ (in production) | HTTPS-only |
| SameSite=strict | ✅ | Prevents CSRF |
| bcrypt hashing | ✅ | Secure password storage |
| Refresh token rotation | ✅ | Prevents replay attacks |
| Zod validation | ✅ | Prevents injection |
| CORS configured | ✅ | Limits origin access |
| No localStorage | ✅ | Eliminates XSS risk |

---

## 🚀 How to Extend This Boilerplate

This is a **starter**, not a final product. Here's how to build on it:

### 1. Add OAuth (Google, GitHub)
- Use `@auth/core` or Passport.js
- Add `provider` and `providerId` to `User` model

### 2. Add Roles & Permissions
```prisma
enum Role { USER, ADMIN }
model User { ... role Role @default(USER) }
```
- Add middleware: `requireRole('ADMIN')`

### 3. Add Email Verification
- Send verification link on registration
- Add `emailVerified` boolean to `User`

### 4. Add 2FA
- TOTP (Google Authenticator) or SMS
- Store `twoFactorSecret` in DB

### 5. Add Audit Logs
- Log login attempts, token refreshes, etc.

---

## 🧰 Troubleshooting Tips

| Issue | Solution |
|------|---------|
| `P1001` (Can't reach database) | Ensure PostgreSQL is running and `DATABASE_URL` is correct |
| Token not set in cookie | Check `httpOnly`, `secure`, and domain settings |
| 401 on `/me` | Ensure cookie is sent (same origin, no CORS issues) |
| Prisma migration errors | Delete `migrations` folder and start over (dev only) |
| CORS error | Verify `cors` origin matches frontend URL |

---

## 📦 Production Checklist

Before deploying:
- 🔐 Use HTTPS (e.g., Let's Encrypt)
- 🗝️ Generate strong JWT secrets (use `openssl rand -base64 32`)
- 🌐 Set `secure: true` in cookie options
- 🧹 Run `npx prisma migrate deploy` in production
- 🐳 Use PM2, Docker, or a PaaS (Render, Railway, AWS, etc.)
- 🔄 Set up monitoring and logging
- 🧼 Never commit `.env` files to Git

---

## 🌟 Why This Over Auth0 or Firebase?

| Factor | This Boilerplate | Auth0/Firebase |
|-------|------------------|----------------|
| Cost | $0 (host your own) | Scales with users |
| Control | Full | Limited |
| Customization | Unlimited | Restricted |
| Data Ownership | Yours | Third-party |
| Learning Value | High | Abstracted |
| Offline Support | Yes | Partial |

Use this boilerplate if you want **control, clarity, and long-term maintainability**.

---

## 🤝 Contribute & Feedback

This project is open source (MIT licensed). I welcome your help!

- 🐛 Report bugs: [GitHub Issues](https://github.com/liangk/fullstack-auth-boilerplate/issues)
- 💡 Suggest features: OAuth, dark mode, audit logs
- 🛠️ Submit PRs: UI improvements, security hardening, docs

I'd love to see what you build with it!

---

## 📣 Final Thoughts

Authentication doesn't have to be a bottleneck. With the **[Fullstack Auth Boilerplate](https://github.com/liangk/fullstack-auth-boilerplate)**, you get a secure, modern, and well-documented foundation that handles the hard parts — so you can focus on building what makes your app unique.

It's minimal, but not minimalistic.  
Secure, but not complex.  
Built for developers who value **control**, **clarity**, and **correctness**.

👉 **Get started today**: [https://github.com/liangk/fullstack-auth-boilerplate](https://github.com/liangk/fullstack-auth-boilerplate)

⭐ Star it, use it, and tag me — I'd love to see your projects!

---

**Happy coding,**  
— LiangK

*Follow me on GitHub: [@liangk](https://github.com/liangk)*

---

### 👉 Enjoyed this guide?  
Clap, share, and follow for more fullstack deep dives, security tips, and Angular/Node.js guides.