import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsTimeZone, Matches } from 'class-validator';

export class CreateExamenFinalDto {
  @IsInt()
  @IsNotEmpty()
  materiaId: number;

  @IsInt()
  @IsNotEmpty()
  docenteId: number;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hora de inicio teórico debe estar en formato HH:MM',
  })
  horaInicioTeorico: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hora de fin teórico debe estar en formato HH:MM',
  })
  horaFinTeorico: string;

  @IsString()
  @IsNotEmpty()
  aulaTeorico: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hora de inicio práctico debe estar en formato HH:MM',
  })
  @IsOptional()
  horaInicioPractico?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Hora de fin práctico debe estar en formato HH:MM',
  })
  @IsOptional()
  horaFinPractico?: string;

  @IsString()
  @IsOptional()
  aulaPractico?: string;

  @IsInt()
  @IsOptional()
  cupo?: number;
}
