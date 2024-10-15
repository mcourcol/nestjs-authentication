import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private UserRepo: Repository<User>) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.UserRepo.create(createUserDto);
    return await this.UserRepo.save(user);
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return this.UserRepo.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'refreshToken'],
    });
  }

  async findByEmail(email: string) {
    return await this.UserRepo.findOne({
      where: { email },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const user = this.UserRepo.create(updateUserDto);
    return this.UserRepo.save(user);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  updateRefreshToken(id: number, hashedRefreshToken: string) {
    return this.UserRepo.update(id, { refreshToken: hashedRefreshToken });
  }
}
