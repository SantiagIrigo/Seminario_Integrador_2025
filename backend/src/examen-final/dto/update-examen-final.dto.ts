import { PartialType } from '@nestjs/mapped-types';
import { CreateExamenFinalDto } from './create-examen-final.dto';

export class UpdateExamenFinalDto extends PartialType(CreateExamenFinalDto) {}
