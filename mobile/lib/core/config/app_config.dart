class AppConfig {
  AppConfig._();

  // Update this when backend host changes.
  static const String apiBaseUrl = 'http://192.168.1.38:3000/api';

  static const String loginUrl = '$apiBaseUrl/auth/login';
  static const String currentUserUrl = '$apiBaseUrl/auth/me';
  static const String pendingScansUrl = '$apiBaseUrl/mobile-scan/pending';
  static const String searchPassportsUrl = '$apiBaseUrl/passports';
  static const String updateNameUrl = '$apiBaseUrl/user/name';
  static const String updatePasswordUrl = '$apiBaseUrl/user/password';
}
