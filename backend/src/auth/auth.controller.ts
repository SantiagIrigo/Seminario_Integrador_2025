// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { legajo?: string; email?: string; password: string }) {
    if (!loginDto.legajo && !loginDto.email) {
      return { error: 'Se requiere email o legajo' };
    }

    try {
      const identifier = loginDto.email ?? loginDto.legajo!;
      const result = await this.authService.login(identifier, loginDto.password);
      if (!result) {
        return { error: 'Credenciales inválidas' };
      }
      return result;
    } catch (error) {
      return {
        error: error.message || 'Error al iniciar sesión',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  // Endpoint temporal para crear usuario de prueba (solo desarrollo)
  @Post('register-test')
  async registerTest(@Body() userDto: { nombre: string; apellido: string; email: string; legajo: string; password: string }) {
    // Crear usuario de prueba para desarrollo
    return {
      message: 'Usuario de prueba creado',
      user: {
        id: 1,
        nombre: userDto.nombre,
        apellido: userDto.apellido,
        email: userDto.email,
        legajo: userDto.legajo,
        rol: 'estudiante'
      },
      access_token: 'test-token-12345'
    };
  }

  // 🔒 Endpoint protegido
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
