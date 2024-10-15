import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

@Controller('dummy')
export class DummyController {
  @Get()
  findAll() {
    return 'This action returns all dummies';
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} dummy`;
  }

  @Post()
  create(@Body() body: any) {
    return body;
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return `This action updates a #${id} dummy`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} dummy`;
  }
}
