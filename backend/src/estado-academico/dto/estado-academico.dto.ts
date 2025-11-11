export class EstadoAcademicoDto {
  materiasCursando: any[];
  historial: any[];
}

export class VerificacionAprobacionDto {
  inscripcionId: number;
  puedeAprobar: boolean;
  motivos?: string[];
}