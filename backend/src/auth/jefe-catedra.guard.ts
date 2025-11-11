// src/auth/jefe-catedra.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExamenService } from '../examen/examen.service';

@Injectable()
export class JefeDeCatedraGuard implements CanActivate {
  constructor(private examenService: ExamenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // { userId, rol }
    const examenId = parseInt(request.params.examenId, 10);

    if (!user || !examenId) return false;

    // Solo profesores pueden intentar cargar
    if (user.rol !== 'profesor') {
      return false;
    }

    // Verificar si es jefe de cátedra de esta materia
    return await this.examenService.esJefeDeCatedra(user.userId, examenId);
  }
}