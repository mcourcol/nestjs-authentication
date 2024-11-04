/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/models/user/user.service';
import { ConfigType } from '@nestjs/config';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { compare } from 'bcrypt';
import * as argon2 from 'argon2';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let refreshTokenConfig: ConfigType<typeof refreshJwtConfig>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            findByEmail: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: refreshJwtConfig.KEY,
          useValue: {
            secret: 'testSecret',
            signOptions: { expiresIn: '60s' },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenConfig = module.get<ConfigType<typeof refreshJwtConfig>>(
      refreshJwtConfig.KEY,
    );
  });

  describe('validateUser', () => {
    it('should return user data if credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        'test@example.com',
        'password',
      );

      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };
      (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return accessToken and refreshToken', async () => {
      const userId = 1;
      const firstName = 'John';
      const lastName = 'Doe';
      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      jest.spyOn(argon2, 'hash').mockResolvedValue('hashedRefreshToken');

      jest.spyOn(userService, 'updateRefreshToken').mockResolvedValue({
        raw: '',
        affected: 1,
        generatedMaps: [],
      });

      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        accessToken,
        refreshToken,
      });

      const result = await authService.login(userId, firstName, lastName);

      expect(argon2.hash).toHaveBeenCalledWith(refreshToken);
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        userId,
        'hashedRefreshToken',
      );
      expect(result).toEqual({ accessToken, refreshToken });
    });

    it('should throw an error if generateTokens fails', async () => {
      const mockUserId = 1;
      const mockFirstName = 'John';
      const mockLastName = 'Doe';

      jest
        .spyOn(authService, 'generateTokens')
        .mockRejectedValue(new Error('Token generation failed'));

      await expect(
        authService.login(mockUserId, mockFirstName, mockLastName),
      ).rejects.toThrow('Token generation failed');
    });

    it('should throw an error if updateRefreshToken fails', async () => {
      const mockUserId = 1;
      const mockFirstName = 'John';
      const mockLastName = 'Doe';
      const mockAccessToken = 'accessToken';
      const mockRefreshToken = 'refreshToken';
      const mockHashedRefreshToken = 'hashedRefreshToken';

      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      jest.spyOn(argon2, 'hash').mockResolvedValue(mockHashedRefreshToken);
      jest
        .spyOn(authService['userService'], 'updateRefreshToken')
        .mockRejectedValue(new Error('Update failed'));

      await expect(
        authService.login(mockUserId, mockFirstName, mockLastName),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('generateTokens', () => {
    it('should return accessToken and refreshToken', async () => {
      const userId = 1;
      const firstName = 'John';
      const lastName = 'Doe';
      const payload = { sub: userId, name: `${firstName} ${lastName}` };
      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      const result = await authService.generateTokens(
        userId,
        firstName,
        lastName,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(payload);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        payload,
        refreshTokenConfig,
      );
      expect(result).toEqual({ accessToken, refreshToken });
    });

    it('should throw an error if signAsync fails', async () => {
      const mockUserId = 1;
      const mockFirstName = 'John';
      const mockLastName = 'Doe';

      jest
        .spyOn(jwtService, 'signAsync')
        .mockRejectedValue(new Error('Token generation failed'));

      await expect(
        authService.generateTokens(mockUserId, mockFirstName, mockLastName),
      ).rejects.toThrow('Token generation failed');
    });
  });

  describe('refreshToken', () => {
    it('should return accessToken and refreshToken', async () => {
      const userId = 1;
      const firstName = 'John';
      const lastName = 'Doe';
      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        accessToken,
        refreshToken,
      });

      jest.spyOn(argon2, 'hash').mockResolvedValue('hashedRefreshToken');

      const result = await authService.refreshToken(
        userId,
        firstName,
        lastName,
      );

      expect(authService.generateTokens).toHaveBeenCalledWith(
        userId,
        firstName,
        lastName,
      );
      expect(argon2.hash).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual({ accessToken, refreshToken });
    });
  });

  describe('validateRefreshToken', () => {
    it('should return user data if refresh token is valid', async () => {
      const userId = 1;
      const refreshToken = 'validRefreshToken';
      const mockUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        refreshToken: 'hashedRefreshToken',
        hashPassword: jest.fn(),
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      const result = await authService.validateRefreshToken(
        userId,
        refreshToken,
      );

      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.refreshToken,
        refreshToken,
      );
      expect(result).toEqual({ id: userId, name: 'John Doe' });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const userId = 1;
      const refreshToken = 'validRefreshToken';

      jest.spyOn(userService, 'findOne').mockResolvedValue(null);

      await expect(
        authService.validateRefreshToken(userId, refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no refresh token', async () => {
      const userId = 1;
      const refreshToken = 'validRefreshToken';
      const mockUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        refreshToken: null,
        hashPassword: jest.fn(),
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      await expect(
        authService.validateRefreshToken(userId, refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const userId = 1;
      const refreshToken = 'invalidRefreshToken';
      const mockUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        refreshToken: 'hashedRefreshToken',
        hashPassword: jest.fn(),
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(
        authService.validateRefreshToken(userId, refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('should update user refresh token to null', async () => {
      const userId = 1;

      jest.spyOn(userService, 'updateRefreshToken').mockResolvedValue({
        raw: '',
        affected: 1,
        generatedMaps: [],
      });

      await authService.signOut(userId);

      expect(userService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });

    it('should throw an error if updateRefreshToken fails', async () => {
      const userId = 1;

      jest
        .spyOn(userService, 'updateRefreshToken')
        .mockRejectedValue(new Error('Update failed'));

      await expect(authService.signOut(userId)).rejects.toThrow();
    });
  });
});
