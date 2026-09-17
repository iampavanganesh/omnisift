String? validatePassword(String? value) {
  final v = value ?? '';
  if (v.isEmpty) return 'Password is required';
  if (v.length < 8) return 'At least 8 characters';
  if (!RegExp(r'[A-Z]').hasMatch(v)) return 'Add an uppercase letter';
  if (!RegExp(r'[a-z]').hasMatch(v)) return 'Add a lowercase letter';
  if (!RegExp(r'[0-9]').hasMatch(v)) return 'Add a number';
  return null;
}

String? validateRequired(String? value, String label) =>
    (value ?? '').trim().isEmpty ? '$label is required' : null;

class PasswordRule {
  const PasswordRule(this.label, this.met);
  final String label;
  final bool met;
}

enum PasswordStrength { none, weak, medium, strong }

List<PasswordRule> passwordRules(String value) => [
      PasswordRule('At least 8 characters', value.length >= 8),
      PasswordRule('One uppercase letter', RegExp(r'[A-Z]').hasMatch(value)),
      PasswordRule('One lowercase letter', RegExp(r'[a-z]').hasMatch(value)),
      PasswordRule('One number', RegExp(r'[0-9]').hasMatch(value)),
    ];

PasswordStrength passwordStrength(String value) {
  if (value.isEmpty) return PasswordStrength.none;
  var score = passwordRules(value).where((r) => r.met).length;
  if (value.length >= 12) score++;
  if (RegExp(r'[^A-Za-z0-9]').hasMatch(value)) score++; // symbol bonus
  if (score <= 2) return PasswordStrength.weak;
  if (score <= 4) return PasswordStrength.medium;
  return PasswordStrength.strong;
}