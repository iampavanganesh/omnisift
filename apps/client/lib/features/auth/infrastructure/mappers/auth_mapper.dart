import '../../domain/entities/auth_session.dart';
import '../models/session_dto.dart';

/// DTO → domain entity. UI never sees the DTO.
AuthSession sessionDtoToEntity(SessionDto dto) => AuthSession(
      userId: dto.userId,
      email: dto.email,
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
      expiresAt: dto.expiresAt,
    );
