import { PartialType } from '@nestjs/mapped-types';
import { CreateMateriaDto } from './create-materia.dto';

// Hereda de CreateMateriaDto pero hace todos los campos opcionales
export class UpdateMateriaDto extends PartialType(CreateMateriaDto) {}