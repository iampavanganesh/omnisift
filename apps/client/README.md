# Omnisift Client (Flutter)

Clean Architecture · Riverpod 3 · GoRouter · Dio. Android + Web from one codebase.

## Run
```bash
flutter pub get
dart run build_runner build -d
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 \
  --dart-define=SUPABASE_URL=https://YOURPROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## Structure
```
lib/
  app/       bootstrap · app · router (Riverpod ProviderScope in main)
  core/      config · theme (design tokens) · network (Dio) · storage · errors
  shared/    reusable widgets · loaders · dialogs · components
  features/  4-layer feature modules — filled in slice by slice
```

## Rules
- Widgets never call HTTP/SQL/SerpAPI. UI → UseCase → Repository → Datasource → Dio.
- Design tokens only (AppColors/AppSpacing/AppRadius/AppTypography). No raw hex/sizes.
- Riverpod does DI (no GetIt). Tokens live in secure storage (never SharedPreferences).
- Every screen: Loading · Success · Empty · Error. Skeletons, not spinners.
