import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { DatabaseService } from 'src/dbs_config/database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerService {
  constructor(private readonly databaseService: DatabaseService
  ){

  }

  async findAll() {
    return await this.databaseService.customer.findMany({
      select:{
        name: true,
        customerid: true
      }
    }
    )
  }

  async findOne(id: number) {
    return await this.databaseService.customer.findFirst({
      where:{
        customerid: id
      }
    })
  }

  async update(id: number, updateCustomerDto: Prisma.CustomerUpdateInput) {
    return await this.databaseService.customer.update({
      where:{
        customerid: id
      },
      data:{
        name: updateCustomerDto.name
      }
    });
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
