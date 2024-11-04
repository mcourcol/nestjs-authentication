/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { RefreshJwtAuthGuard } from 'src/common/guards/refresh-jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../models/user/user.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-token'),
            verify: jest.fn().mockReturnValue({ userId: 1 }),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 1, firstName: 'John', lastName: 'Doe' }),
          },
        },
        {
          provide: 'CONFIGURATION(refresh-jwt)',
          useValue: {
            secret: 'test-secret',
          },
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => true),
      })
      .overrideGuard(RefreshJwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => true),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => true),
      })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return user and tokens', async () => {
      const req = { user: { id: 1, firstName: 'John', lastName: 'Doe' } };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      jest.spyOn(authService, 'login').mockResolvedValue(tokens);

      expect(await authController.login(req)).toEqual({
        user: req.user,
        tokens,
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens', async () => {
      const req = { user: { id: 1, firstName: 'John', lastName: 'Doe' } };
      const tokens = { accessToken: 'newAccess', refreshToken: 'newRefresh' };
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(tokens);

      expect(await authController.refreshToken(req)).toEqual(tokens);
    });
  });

  describe('signout', () => {
    it('should sign out the user', async () => {
      const req = { user: { id: 1 } };
      jest.spyOn(authService, 'signOut').mockResolvedValue(undefined);

      await authController.signout(req);
      expect(authService.signOut).toHaveBeenCalledWith(req.user.id);
    });
  });
});
