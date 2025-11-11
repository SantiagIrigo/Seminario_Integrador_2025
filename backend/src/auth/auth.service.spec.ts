// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { TestDatabaseModule } from '../test-utils/test-database.module';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserRole } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserService: Partial<UserService>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    // Mock de los servicios dependientes
    mockUserService = {
      findByEmail: jest.fn(),
      findByLegajo: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByLegajoWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('test-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      // Arrange
      const userData: CreateUserDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        password: 'password123',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const createdUser: Partial<User> = {
        id: 1,
        ...userData,
        password: hashedPassword,
        rol: UserRole.ESTUDIANTE,
      };

      // Mock del servicio de usuario con tipos correctos
      (mockUserService.create as jest.Mock).mockResolvedValue(createdUser as User);
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      // Act
      const result = await service.register(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserService.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
        rol: UserRole.ESTUDIANTE,
      });
    });

    it('should throw when password is missing', async () => {
      const userData = {
        nombre: 'Sin', apellido: 'Pass', email: 's@p.com', legajo: '1', dni: '2',
      } as any;
      await expect(service.register(userData)).rejects.toThrow('La contraseña es obligatoria');
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should register a user with default role if not provided', async () => {
      // Arrange
      const userData: CreateUserDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        password: 'password123',
        legajo: '12345',
        dni: '12345678',
        rol: undefined, // Sin rol especificado
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const createdUser: Partial<User> = {
        id: 1,
        ...userData,
        password: hashedPassword,
        rol: UserRole.ESTUDIANTE, // Debe usar el valor por defecto
      };

      // Mock del servicio de usuario con tipos correctos
      (mockUserService.create as jest.Mock).mockResolvedValue(createdUser as User);
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      // Act
      const result = await service.register(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockUserService.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
        rol: UserRole.ESTUDIANTE, // Debe usar el valor por defecto
      });
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      // Arrange
      const email = 'juan.perez@example.com';
      const password = 'password123';
      const user: Partial<User> = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email,
        password: '$2b$10$somehashedpassword', // Password hasheado
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
      };

      // Mock de los servicios con tipos correctos
      (mockUserService.findByLegajoWithPassword as jest.Mock).mockResolvedValue(null);
      (mockUserService.findByEmailWithPassword as jest.Mock).mockResolvedValue(user as User);
      (bcrypt.compare as any).mockResolvedValue(true);

      // Arrange full user
      (mockUserService.findById as jest.Mock).mockResolvedValue({
        id: 1,
        rol: 'estudiante',
        planEstudio: undefined,
      });

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toEqual({ 
        access_token: 'test-jwt-token',
        user: {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@example.com',
          legajo: '12345',
          rol: 'estudiante'
        }
      });
      expect(mockUserService.findByLegajoWithPassword).toHaveBeenCalledWith(email);
      expect(mockUserService.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        legajo: user.legajo,
        rol: user.rol,
      });
    });

    it('should throw when identifier or password missing', async () => {
      await expect(service.login('', '')).rejects.toThrow('Se requieren el correo/legajo y la contraseña');
      await expect(service.login('a', '')).rejects.toThrow('Se requieren el correo/legajo y la contraseña');
      await expect(service.login('', 'b')).rejects.toThrow('Se requieren el correo/legajo y la contraseña');
    });

    it('should return null when user is not found', async () => {
      // Arrange
      const email = 'juan.perez@example.com';
      const password = 'password123';

      // Mock de los servicios con tipos correctos
      (mockUserService.findByLegajoWithPassword as jest.Mock).mockResolvedValue(null);
      (mockUserService.findByEmailWithPassword as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockUserService.findByEmailWithPassword).toHaveBeenCalledWith(email);
    });

    it('should return null when full user cannot be loaded', async () => {
      const email = 'a@b.com';
      const user: any = { id: 1, email, password: 'h', legajo: 'L', rol: 'estudiante' };
      (mockUserService.findByLegajoWithPassword as jest.Mock).mockResolvedValue(null);
      (mockUserService.findByEmailWithPassword as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as any).mockResolvedValue(true);
      (mockUserService.findById as jest.Mock).mockResolvedValue(null);
      const res = await service.login(email, 'p');
      expect(res).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      const email = 'juan.perez@example.com';
      const password = 'wrongpassword';
      const user: Partial<User> = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email,
        password: '$2b$10$somehashedpassword',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
      };

      // Mock de los servicios con tipos correctos
      (mockUserService.findByLegajoWithPassword as jest.Mock).mockResolvedValue(null);
      (mockUserService.findByEmailWithPassword as jest.Mock).mockResolvedValue(user as User);
      (bcrypt.compare as any).mockResolvedValue(false);

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockUserService.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });
  });
});