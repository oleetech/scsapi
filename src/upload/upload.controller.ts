import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  Query,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { Public } from 'src/resourses/decorator';
import { Prisma } from '@prisma/client';

// @Public()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @Post('register/mawb/company')
  create(@Body() createUploadDto: CreateUploadDto) {
    console.log('------------------------------STARTS HERE');

    return this.uploadService.uploadTable(createUploadDto);

    // return this.uploadService.createCompany(createUploadDto);
  }

  @Public()
  @Get('getByMAWB-ID/:mawb')
  async getAll_MAWBID(@Param('mawb') mawb: string) {
    const mawbNumber = parseInt(mawb, 10);
    return await this.uploadService.getAll_MAWBIB(mawbNumber);
  }

  @Get()
  findAll() {
    return this.uploadService.findAll();
  }

  @Public()
  @Get('getByMAWB/:mawb')
  async getAll_MAWB(@Param('mawb') mawb: string) {
    const result = await this.uploadService.findAll_MAWB({ mawb: mawb });

    if (result == 404)
      return { message: `No data found`, status: HttpStatus.NOT_FOUND };

    return result;
  }

  @Get('getOne/:uploadid')
  async getOne_uploadID(@Param('uploadid') uploadid: string) {
    const idNumber = parseInt(uploadid, 10);
    return await this.uploadService.find_uploadID(idNumber);
  }

  @Get('getAll/:month/:year')
  async getAll_Month_Year(
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.uploadService.findAll_Month_Year(month, year);
  }

  @Get('getAll/:date')
  async getAll_Date(@Param('date') date: string) {
    return this.uploadService.getAll_Date(date);
  }

  @Get('getAll/:customerName/:month/:year')
  async getAll_CustomerName_Month_year(
    @Param('customerName') customerName: string,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return await this.uploadService.getAll_CustomerName_Month_Year(
      customerName,
      month,
      year,
    );
  }

  @Get('getAllCustomer/:customerName')
  async getAll_CustomerName(@Param('customerName') customerName: string) {
    const result = await this.uploadService.getAll_CustomerName(customerName);
    console.log(result);

    if (result.length === 0) {
      throw new NotFoundException(`Customer ${customerName} not found`);
    }
    return result;
  }

  @Get('mawb-list')
  async getMAWBList(): Promise<string[]> {
    return this.uploadService.getAllMAWBLIst();
  }

  @Get('customer-list')
  async getCustomerList() {
    return this.uploadService.getAllCustomerList();
  }

  @Get('month-year-list')
  async getMonthYear() {
    return this.uploadService.getAllMAWBMonthYear_List();
  }

  @Put('billGenerate/:uploadID')
  async billGenerate(@Param('uploadID', ParseIntPipe) uploadID: number) {
    return await this.uploadService.billGenerateStatusChange(uploadID);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() updateUploadDto: Prisma.uploadtableUpdateInput,
  ) {
    return this.uploadService.update(+id, updateUploadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadService.remove(+id);
  }
}
