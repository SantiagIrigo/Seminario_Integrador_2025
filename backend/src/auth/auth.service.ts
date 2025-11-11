import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User, UserRole } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(userData: CreateUserDto): Promise<UserResponseDto> {
    if (!userData.password) {
      throw new Error('La contraseña es obligatoria');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const rol: UserRole = userData.rol || UserRole.ESTUDIANTE;

    return this.userService.create({
      ...userData,
      password: hashedPassword,
      rol,
    });
  }

  async login(identifier: string, password: string): Promise<{ access_token: string; user: any } | null> {
    console.log('Login attempt for identifier:', identifier);
    
    if (!identifier || !password) {
      console.log('Missing identifier or password');
      throw new Error('Se requieren el correo/legajo y la contraseña');
    }
    
    // Intentar por legajo primero y luego por email para mayor flexibilidad
    let user = await this.userService.findByLegajoWithPassword(identifier);
    if (!user) {
      user = await this.userService.findByEmailWithPassword(identifier);
    }
    
    if (!user) {
      console.log('User not found');
      return null;
    }
    
    console.log('User found:', { id: user.id, email: user.email, legajo: user.legajo, rol: user.rol });
  
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('Invalid password');
      return null;
    }
  
    // Usar findById que ya carga planEstudio
    const fullUser = await this.userService.findById(user.id);
    if (!fullUser) {
      console.log('Error loading full user data');
      return null;
    }
  
    console.log('Full user data:', fullUser);
  
    const payload = { 
      sub: user.id, 
      email: user.email, 
      rol: fullUser.rol,
      legajo: user.legajo
    };
  
    const userResponse = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      legajo: user.legajo,
      rol: fullUser.rol,
      planEstudio: fullUser.planEstudio, // ← Esto es lo que faltaba
    };
  
    console.log('Login successful, returning user:', userResponse);
  
    return {
      access_token: this.jwtService.sign(payload),
      user: userResponse,
    };
  }
}
