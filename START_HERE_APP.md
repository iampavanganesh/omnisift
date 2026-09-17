# ▶ Run the app — Auth screens (after the backend works)

Prerequisite: the **backend** is running and register/login worked in Swagger
(see START_HERE_AUTH.md). The app talks to that backend.

## 1. Point the app at your backend
- **Android emulator:** base URL `http://10.0.2.2:3000/api/v1` (default).
- **Physical phone over USB (your vivo T3):** run once, with the phone plugged in:
  ```bash
  adb reverse tcp:3000 tcp:3000
  ```
  then use base URL `http://localhost:3000/api/v1`.

## 2. Install + generate code
```bash
cd apps/client
flutter pub get
dart run build_runner build -d      # generates session_dto.freezed.dart + .g.dart
```

## 3. Run
```bash
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000/api/v1 \
  --dart-define=SUPABASE_URL=https://YOURPROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 4. What you should see
1. **Splash** (brown Omnisift screen) → **Welcome**
2. Tap **Create account** → enter name / email / password → submit
3. On success you land on the real **Home** screen (banner carousel, Shop by Category,
   Top Deals, Most Searched) with the bottom nav — Home / Search / Wishlist / Alerts / Profile.
4. Log out from **Profile** → back to Welcome. Tap **Log in** → sign back in.
5. Check Supabase → `users` table: your row is there.

That's the Auth slice working end to end — backend + app.

> Note: signing in is **not** required to browse. Home, Search, Categories, Brands, Products,
> Compare, Price history and Deals all work as a guest; only Wishlist, Alerts, Notifications
> and Account need an account. See the root `AGENTS.md` for the full policy.

## If something breaks
- `build_runner` errors → paste the output; usually a version nudge in pubspec.
- Login spins then shows an error → backend isn't reachable. Recheck step 1
  (emulator uses 10.0.2.2; USB phone needs `adb reverse`).
- "Incorrect email or password" → register that email first.
