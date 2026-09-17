import 'package:freezed_annotation/freezed_annotation.dart';

part 'session_dto.freezed.dart';
part 'session_dto.g.dart';

/// Wire model — mirrors the backend SessionResponseDto exactly.
@freezed
abstract class SessionDto with _$SessionDto {
  const factory SessionDto({
    required String userId,
    required String email,
    required String accessToken,
    required String refreshToken,
    required int expiresAt,
  }) = _SessionDto;

  factory SessionDto.fromJson(Map<String, dynamic> json) =>
      _$SessionDtoFromJson(json);
}
