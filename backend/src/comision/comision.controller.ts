// src/comision/comision.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ComisionService } from './comision.service';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

@Controller('comision')
export class ComisionController {
  constructor(private readonly comisionService: ComisionService) {}

  @Post()
  create(@Body() createComisionDto: CreateComisionDto) {
    return this.comisionService.create(createComisionDto);
  }

  @Get()
  findAll() {
    return this.comisionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comisionService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateComisionDto: UpdateComisionDto) {
    return this.comisionService.update(+id, updateComisionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.comisionService.remove(+id);
  }

  // Endpoint para obtener comisiones de una materia específica
  @Get('materia/:materiaId')
  findByMateria(@Param('materiaId') materiaId: string) {
    return this.comisionService.findByMateria(+materiaId);
  }
}