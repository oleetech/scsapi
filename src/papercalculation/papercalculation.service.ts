import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/dbs_config/database/database.service';
import { createPCR_DTO } from './dto/create-pcr.dto';
import { createPCS_DTO } from './dto/create-pcs.dto';

@Injectable()
export class PapercalculationService {
    constructor(private readonly databaseService: DatabaseService){

    }

    // Creating the calculation of PCR:
    // PCR = (Rate * Weight) * Conversion Rate
    // if Weight > weight 3, Rate3 * Weight. If Weight <= Weight1, Weight * Rate 1.
    // if weight1 < Weight < Weight3, Rate1 + Rate2 * (Weight - 1) 
    // conversion of BDT is based on Month and Year
    // The API returns back all the PCR(s) of that company in a DESC order
    async createPCR(createPCR_DTO: createPCR_DTO){
        const {uploadID} = createPCR_DTO;

        const isUploadExists = await this.databaseService.uploadtable.findFirst({
            where:{
                upload_id: uploadID
            }
        })

        if (!isUploadExists){
            throw new NotFoundException(`No rows found with upload ID: ${uploadID}`)
        }

        const rateSum = await this.locationValue(createPCR_DTO.locationFrom, createPCR_DTO.locationTo, createPCR_DTO.weight);
        
        const convertedBDT = await this.convertedValueBDT(createPCR_DTO.conversionMonth, createPCR_DTO.conversionYear);    

        const value = rateSum * convertedBDT;

        const locationID = await this.getLocationID(createPCR_DTO.locationFrom, createPCR_DTO.locationTo);
        const conversionID = await this.getConvertedID(createPCR_DTO.conversionMonth, createPCR_DTO.conversionYear);
        
        try{
            const isPCRExist = await this.databaseService.pcr.findFirst({
                where:{
                    upload_id: uploadID,
                    value: value,
                    locationRate_id: locationID,
                    conversionID: conversionID
                }
            });

            if (isPCRExist)
                throw new ForbiddenException(`PCR already exists`);

            await this.databaseService.pcr.create({
                data:{
                    upload_id: uploadID,
                    value: value,
                    locationRate_id: locationID,
                    conversionID: conversionID
                }
            });
    
            return await this.findByUploadID_PCR(uploadID);
        } catch (error){
            throw error;
        }   
    }

    async getALLPCR(){
        const result = await this.databaseService.pcr.findMany();

        return result;
    }

    async findByUploadID_PCR(uploadID: number){
        const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`
        SELECT "pcr".value, "Customer".name, *, "locationrate".location_from, "locationrate".location_to
        FROM "uploadtable"
        
        INNER JOIN "pcr"
        ON "uploadtable".upload_id = "pcr".upload_id
        INNER JOIN "locationrate"
        ON "locationrate"."locationRate_id" = "pcr"."locationRate_id"
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        
        WHERE "uploadtable".upload_id = ${uploadID}
        `;

    const modifiedInfo = getInfo.map(row => {
        return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
        };
    });

    return modifiedInfo;
    }

    async createPCS(createPCS_DTO: createPCS_DTO){
        const {uploadID} = createPCS_DTO;

        const isUploadExists = await this.databaseService.uploadtable.findFirst({
            where:{
                upload_id: uploadID
            }
        })

        if (!isUploadExists){
            throw new NotFoundException(`No rows found with upload ID: ${uploadID}`)
        }

        try{
            const convertedBDT = await this.convertedValueBDT(createPCS_DTO.conversionMonth, createPCS_DTO.conversionYear);
            const conversionID = await this.getConvertedID(createPCS_DTO.conversionMonth, createPCS_DTO.conversionYear);

            const value = (createPCS_DTO.ChinaBasedUSD + (createPCS_DTO.ChinaBasedUSD*10)/100) * convertedBDT;

            const isPCSExist = await this.databaseService.pcs.findFirst({
                where:{
                    upload_id: uploadID
                }
            })

            if (isPCSExist)
                throw new ForbiddenException(`PCS for UploadID ${uploadID} exists`);
            
            await this.databaseService.pcs.create({
                data:{
                    conversionID,
                    chn_usd: createPCS_DTO.ChinaBasedUSD,
                    value,
                    upload_id: uploadID
                }
            })

            return await this.findByUploadID_PCS(uploadID);
        } catch (error){
            throw error;
        }
    }

    async findByUploadID_PCS(uploadID: number){
        const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`
        SELECT "pcs".value, "Customer".name, *
        FROM "uploadtable"
        
        INNER JOIN "pcs"
        ON "uploadtable".upload_id = "pcs".upload_id
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        
        WHERE "uploadtable".upload_id = ${uploadID}
        `;

    const modifiedInfo = getInfo.map(row => {
        return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
        };
    });

    return modifiedInfo;
    }

    //--------------------UTILITY FUNCTIONS--------------------

    async locationValue(locationFrom: string, locationTo: string, weight: number):Promise<number>{
        const locationData = await this.databaseService.locationrate.findFirst({
            where:{
                location_from: locationFrom,
                location_to: locationTo
            }
        })

        if (!locationData){
            throw new NotFoundException(`${locationFrom} to ${locationTo} does not exist.`)
        }
        const weightMap = [
            { weight: locationData.weight_1, rate: locationData.rate_1 },
            { weight: locationData.weight_2, rate: locationData.rate_2 },
            { weight: locationData.weight_3, rate: locationData.rate_3 }
        ]

        if (weight > weightMap[2].weight){
            const price = weightMap[2].rate * Math.ceil(weight);

            return price;
        } else if (weight <= weightMap[0].weight) {
            return weightMap[0].rate * Math.ceil(weight);
        } else {
            let tempWeight = Math.ceil(weight) - 1;

            return weightMap[0].rate + weightMap[1].rate * tempWeight;
        }
    }

    async getLocationID(locationFrom: string, locationTo: string):Promise<number>{
        const locationData = await this.databaseService.locationrate.findFirst({
            where:{
                location_from: locationFrom,
                location_to: locationTo
            }, select:{
                locationRate_id: true
            }
        })

        if (!locationData){
            throw new NotFoundException(`${locationFrom} to ${locationTo} does not exist.`)
        }

        return locationData.locationRate_id;
    }

    async convertedValueBDT(month: number, year: number){
        const result = await this.databaseService.conversion.findFirst({
            where:{
                month: month,
                year: year
            }
        })

        if (!result){
            throw new NotFoundException(`Not record of ${this.getMonthName(month)}, ${year}`)
        }

        return result.bdt_value;
    }

    async getConvertedID(month: number, year: number){
        const result = await this.databaseService.conversion.findFirst({
            where:{
                month: month,
                year: year
            }, select: {
                conversionID: true
            }
        })

        if (!result){
            throw new NotFoundException(`Not record of ${this.getMonthName(month)}, ${year}`)
        }

        return result.conversionID;
    }

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
