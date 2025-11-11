// src/user/user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: Partial<UserService>;
  let mockAuthService: Partial<AuthService>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    mockUserService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByEmail: jest.fn(),
    };

    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        password: 'password123',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE, // ✅ Usar el enum correctamente
        planEstudioId: 1
      };

      const result = { id: 1, ...createUserDto };

      (mockUserService.create as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.create(createUserDto);

      // Assert
      expect(response).toEqual(result);
      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const result = [
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@example.com',
          legajo: '12345',
          dni: '12345678',
          rol: UserRole.ESTUDIANTE,
          planEstudioId: 1
        }
      ];

      (mockUserService.findAll as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findAll();

      // Assert
      expect(response).toEqual(result);
      expect(mockUserService.findAll).toHaveBeenCalled();
    });

    it('should accept explicit page and limit', async () => {
      (mockUserService.findAll as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });
      const res = await controller.findAll('2' as any, '5' as any);
      expect(res).toEqual({ data: [], total: 0, page: 2, limit: 5, totalPages: 0 });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // Arrange
      const result = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudioId: 1
      };

      (mockUserService.findById as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findOne('1');

      // Assert
      expect(response).toEqual(result);
      expect(mockUserService.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const updateUserDto: UpdateUserDto = {
        nombre: 'Juan Carlos',
      };

      const result = {
        id: 1,
        ...updateUserDto,
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudioId: 1
      };

      (mockUserService.update as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.update('1', updateUserDto);

      // Assert
      expect(response).toEqual(result);
      expect(mockUserService.update).toHaveBeenCalledWith(1, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      // Arrange
      (mockUserService.remove as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.remove('1');

      // Assert
      expect(mockUserService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('search', () => {
    it('should forward filters and defaults to service', async () => {
      (mockUserService.findWithFilters as jest.Mock) = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      const res = await controller.search('12', 'Ju', 'Pe', '1234', '2024' as any, undefined as any, undefined as any);
      expect(res).toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      expect(mockUserService.findWithFilters).toHaveBeenCalledWith({ legajo: '12', nombre: 'Ju', apellido: 'Pe', dni: '1234', year: 2024 }, 1, 10);
    });
    it('should use defaults when no args', async () => {
      (mockUserService.findWithFilters as jest.Mock) = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      await controller.search(undefined, undefined, undefined, undefined, undefined, undefined as any, undefined as any);
      expect(mockUserService.findWithFilters).toHaveBeenCalledWith({ legajo: undefined, nombre: undefined, apellido: undefined, dni: undefined, year: undefined }, 1, 10);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      // Arrange
      const result = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        legajo: '12345',
        dni: '12345678',
        rol: UserRole.ESTUDIANTE,
        planEstudioId: 1
      };

      (mockUserService.findByEmail as jest.Mock).mockResolvedValue(result);

      // Act
      const response = await controller.findByEmail('juan.perez@example.com');

      // Assert
      expect(response).toEqual(result);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('juan.perez@example.com');
    });
  });
});