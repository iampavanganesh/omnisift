import { Module } from '@nestjs/common';
import { UsersController } from './presentation/controllers/users.controller';
import { GetProfileUseCase } from './application/usecases/get-profile.usecase';
import { UpdateProfileUseCase } from './application/usecases/update-profile.usecase';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
})
export class UsersModule {}
