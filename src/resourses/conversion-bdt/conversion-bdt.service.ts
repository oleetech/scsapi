import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/dbs_config/database/database.service';

@Injectable()
export class ConversionBdtService {
    constructor(private readonly databaseService: DatabaseService){

    }

    async createConversion(createConversionDTO: Prisma.conversionCreateInput){ 

        const isConverstionExists = await this.databaseService.conversion.findFirst({
            where:{
                month: createConversionDTO.month,
                year: createConversionDTO.year
            }
        })

        const monthName = await this.getMonthName(createConversionDTO.month);

        if (isConverstionExists)
            throw new ForbiddenException(`Conversion of ${monthName}, ${createConversionDTO.year} exists.`)

        await this.databaseService.conversion.create({
            data:{
                bdt_value: createConversionDTO.bdt_value,
                month: createConversionDTO.month,
                year: createConversionDTO.year
            }
        })

        return await this.getOne_MonthYear(createConversionDTO.month, createConversionDTO.year);
    }

    async getOne_MonthYear(month: number, year: number){
        const result = await this.databaseService.conversion.findFirst({
            where:{
                month: month,
                year: year
            }
        })

        if (!result){
            throw new NotFoundException(`Not record of ${this.getMonthName(month)}, ${year}`)
        }

        return result
    }

    async getRate_ID(conversionID: number){
        const result = this.databaseService.conversion.findFirst({
            where:{
                conversionID
            },
            select:{
                bdt_value: true
            }
        })

        return result;
    }

    async getAll(){
        const result = await this.databaseService.conversion.findMany();

        if (!result)
            throw new NotFoundException(`No record found`);
        
        return result
    }

    async updateRate(conversionRateID : number, updateRateDTO: Prisma.conversionUpdateInput){
        const isRateExists = await this.databaseService.conversion.findFirst({
            where:{
                conversionID: conversionRateID
            }
        })

        if (!isRateExists)
            throw new NotFoundException(`Rate of ${updateRateDTO.month}, ${updateRateDTO.year} does not exist`);

        return await this.databaseService.conversion.update({
            where:{
                conversionID: conversionRateID
            },
            data:{
                bdt_value: updateRateDTO.bdt_value,
                month: updateRateDTO.month,
                year: updateRateDTO.year
            }
        })
    };


    //------------------------------UTILITY FUNCTIONS---------------------
    getMonthName(monthInt: number):Promise<string>{
        const monthNumberToLabelMap = {
            [1]: 'January',
            [2]: 'February',
            [3]: 'March',
            [4]: 'April',
            [5]: 'May',
            [6]: 'June',
            [7]: 'July',
            [8]: 'August',
            [9]: 'September',
            [10]: 'October',
            [11]: 'November',
            [12]: 'December',
          }

          return monthNumberToLabelMap[monthInt];
    }
}
