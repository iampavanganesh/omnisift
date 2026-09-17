import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/errors/failure.dart';

/// Wraps the native Google Sign-In SDK. Returns the Google ID token, or null if
/// the user cancels. The backend exchanges this token for an Omnisift session.
class GoogleAuthDatasource {
  Future<String?> getIdToken() async {
    try {
      final account = await GoogleSignIn.instance.authenticate();
      final idToken = account.authentication.idToken;
      if (idToken == null) {
        throw const AuthFailure('Google sign-in returned no token.');
      }
      return idToken;
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) return null;
      throw const AuthFailure('Google sign-in failed. Please try again.');
    }
  }
}