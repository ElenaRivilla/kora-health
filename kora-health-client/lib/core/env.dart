/// Environment configuration. Override at build/run time with:
///   flutter run --dart-define=API_BASE_URL=http://localhost:5299
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5001',
  );
}
