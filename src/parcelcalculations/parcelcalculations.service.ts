import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/dbs_config/database/database.service';
import { createSCR_DTO } from './dto/create-SCR.dto';
import { createPCR_DTO } from 'src/papercalculation/dto/create-pcr.dto';
import { createSPXPP_DTO } from './dto/create-SPXPP.dto';
import { createSCS_DTO } from './dto/create-SCS.dto';

@Injectable()
export class ParcelcalculationsService {
    constructor(private readonly databaseService: DatabaseService){

    }

    async createSCR(createSCR_DTO: createSCR_DTO){
        const {uploadID} = createSCR_DTO;

        const isUploadExists = await this.databaseService.uploadtable.findFirst({
            where:{
                upload_id: uploadID
            }
        })

        if (!isUploadExists){
            throw new NotFoundException(`No rows found with upload ID: ${uploadID}`)
        }

        const rateSum = await this.locationValue(createSCR_DTO.locationFrom, createSCR_DTO.locationTo, createSCR_DTO.weight);
        
        const convertedBDT = await this.convertedValueBDT(createSCR_DTO.conversionMonth, createSCR_DTO.conversionYear);    

        
        const locationID = await this.getLocationID(createSCR_DTO.locationFrom, createSCR_DTO.locationTo);
        const conversionID = await this.getConvertedID(createSCR_DTO.conversionMonth, createSCR_DTO.conversionYear);
        
        let parcelID_value: number;
        let price_value: number;

        if (createSCR_DTO.internal_location === "OTHERS"){
            const {parcelID, price} = await this.getParcelRate(createSCR_DTO.internal_location, createSCR_DTO.weight);
            
            parcelID_value = parcelID;
            price_value = createSCR_DTO.other_rate * createSCR_DTO.weight;
        }
        else {
            const {parcelID, price} = await this.getParcelRate(createSCR_DTO.internal_location, createSCR_DTO.weight);

            parcelID_value = parcelID;
            price_value = price; 
        }

        console.log("locationPrice: ", rateSum, "conversionRate: ", convertedBDT, "ParcelRate: ", price_value);
        
        
        const value = (rateSum * convertedBDT) + price_value;
        
        console.log(value);
        

        
        try{
            const isSCRExist = await this.databaseService.scr.findFirst({
                where:{
                    upload_id: uploadID
                }
            });

            if (isSCRExist)
                throw new ForbiddenException(`SPX-CC-RO row already exists`);

            await this.databaseService.scr.create({
                data:{
                    upload_id: uploadID,
                    locationRate_id: locationID,
                    conversionID: conversionID,
                    parcelrate_id: parcelID_value,
                    value
                }
            });
    
            return await this.findByUploadID_SCR(uploadID);
        } catch (error){
            throw error;
        } 
    }

    async createSPX_PP(createSPXPP_DTO: createSPXPP_DTO){
        const {uploadID} = createSPXPP_DTO;

        const isUploadExists = await this.databaseService.uploadtable.findFirst({
            where:{
                upload_id: uploadID
            }
        })

        if (!isUploadExists){
            throw new NotFoundException(`No rows found with upload ID: ${uploadID}`)
        }

        let parcelID_value: number;
        let price_value: number;

        if (createSPXPP_DTO.internal_location === "OTHERS"){
            const {parcelID, price} = await this.getParcelRate(createSPXPP_DTO.internal_location, createSPXPP_DTO.weight);
            
            parcelID_value = parcelID;
            price_value = createSPXPP_DTO.other_rate * createSPXPP_DTO.weight;
        }
        else {
            const {parcelID, price} = await this.getParcelRate(createSPXPP_DTO.internal_location, createSPXPP_DTO.weight);

            parcelID_value = parcelID;
            price_value = price; 
        }

        try{
            const isSPX_PPExist = await this.databaseService.spxpp.findFirst({
                where:{
                    upload_id: uploadID
                }
            });

            if (isSPX_PPExist)
                throw new ForbiddenException(`SPX-CC-RO row already exists`);

            await this.databaseService.spxpp.create({
                data:{
                    upload_id: uploadID,
                    parcelrate_id: parcelID_value,
                    value: price_value
                }
            })
    
            return await this.findByUploadID_SPXPP(uploadID);
        } catch (error){
            throw error;
        } 
    }

    async createSCS(createSCS_DTO: createSCS_DTO){
        const {uploadID} = createSCS_DTO;

        const isUploadExists = await this.databaseService.uploadtable.findFirst({
            where:{
                upload_id: uploadID
            }
        })

        if (!isUploadExists){
            throw new NotFoundException(`No rows found with upload ID: ${uploadID}`)
        }

        let parcelID_value: number;
        let parcelRate: number;

        if (createSCS_DTO.internal_location === "OTHERS"){
            const {parcelID, price} = await this.getParcelRate(createSCS_DTO.internal_location, createSCS_DTO.weight);
            
            parcelID_value = parcelID;
            parcelRate = createSCS_DTO.other_rate * createSCS_DTO.weight;
        }
        else {
            const {parcelID, price} = await this.getParcelRate(createSCS_DTO.internal_location, createSCS_DTO.weight);

            parcelID_value = parcelID;
            parcelRate = price; 
        }

        const convertedBDT = await this.convertedValueBDT(createSCS_DTO.conversionMonth, createSCS_DTO.conversionYear);
        const conversionID = await this.getConvertedID(createSCS_DTO.conversionMonth, createSCS_DTO.conversionYear);

        const value = ((createSCS_DTO.chinaBasedUSD + (createSCS_DTO.chinaBasedUSD*10)/100) * convertedBDT) + parcelRate;
        try{
            const isSCSExist = await this.databaseService.scs.findFirst({
                where:{
                    upload_id: uploadID,

                }
            });

            if (isSCSExist)
                throw new ForbiddenException(`SCS row already exists`);



            await this.databaseService.scs.create({
                data:{
                    upload_id: uploadID,
                    conversionID,
                    parcelrate_id: parcelID_value,
                    value

                }
            })
    
            return await this.findByUploadID_SCS(uploadID);
        } catch (error){
            throw error;
        } 
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

        async findByUploadID_SCR(uploadID: number){
            const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`
                SELECT 
                    "scr".value,
                    "scr".parcelrate_id as scr_parcelRate,
                    "Customer".name, 
                    *, 
                    "parcelrate".rate1 as parcelRate1, 
                    "parcelrate".rate2 as parcelRate2, 
                    "parcelrate".location as internalLocation
                FROM "uploadtable"
                
                LEFT JOIN "scr"
                ON "uploadtable".upload_id = "scr".upload_id

                INNER JOIN "parcelrate"
                ON "parcelrate"."parcelrate_id" = "scr"."parcelrate_id" 
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

        async findByUploadID_SPXPP(uploadID: number){
            const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`
            SELECT 
            "spxpp".value,
            "spxpp".parcelrate_id as spxpp_parcelRate,
            "Customer".name, 
            *, 
            "parcelrate".rate1 as parcelRate1, 
            "parcelrate".rate2 as parcelRate2, 
            "parcelrate".location as internalLocation
                FROM "uploadtable"
                
                LEFT JOIN "spxpp"
                ON "uploadtable".upload_id = "spxpp".upload_id

                INNER JOIN "parcelrate"
                ON "parcelrate"."parcelrate_id" = "spxpp"."parcelrate_id" 
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

        async findByUploadID_SCS(uploadID: number){
            const getInfo = await this.databaseService.$queryRaw<{[key: string]: any}[]>`
                SELECT 
                    "Customer".name,         
                    "Mawb".mawb,  
                    "uploadtable".upload_id as uploadID, 
                    "uploadtable".customerid, 
                    "uploadtable".awb, 
                    "uploadtable".bin_vat, 
                    "uploadtable".address, 
                    "uploadtable".consigne, 
                    "uploadtable".dest, 
                    "uploadtable".cnee_address, 
                    "uploadtable".ctc, 
                    "uploadtable".tel_no, 
                    "uploadtable".nop, 
                    "uploadtable".weight, 
                    "uploadtable".volume, 
                    "uploadtable".dsct, 
                    "uploadtable".cod, 
                    "uploadtable".val, 
                    "uploadtable".re, 
                    "uploadtable".bag_no, 
                    "uploadtable".mawb_id, 
                    "uploadtable".billgenerate, 
                    "Mawb".flight,  
                    "Mawb".month, 
                    "Mawb".year, 
                    "Mawb".date,
                    "scs".value as scs_value,
                    "scs".parcelrate_id as scs_parcelRate
                    FROM "uploadtable"
                    INNER JOIN "Mawb"
                    ON "Mawb".mawb_id = "uploadtable".mawb_id
                    INNER JOIN "Customer"
                    ON "Customer".customerid = "uploadtable".customerid

                    LEFT JOIN "scs"
                    ON "uploadtable".upload_id = "scs".upload_id
                    
                    WHERE "uploadtable"."upload_id" = ${uploadID}
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

        async getParcelRate(internalLocation: string, weight: number){
            const parcelData = await this.databaseService.parcelrate.findMany({
                where:{
                    location: internalLocation
                }
            })

            if (parcelData.length < 1){
                throw new NotFoundException(`Not record found of ${internalLocation}`);
            }

            const weightsAndRates = parcelData.map(parcel => ({
                weight: parcel.weight,
                rate1: parcel.rate1,
                rate2: parcel.rate2
              }));

              
              console.log('weightsAndRates', weightsAndRates);
              let tempRate = weightsAndRates[0].rate1;
              let price = tempRate * weight;
              let parcelID = parcelData[0].parcelrate_id;

            if (weight > weightsAndRates[0].weight){
                tempRate = weightsAndRates[0].rate2;
                price = weight * tempRate;
                return {parcelID: parcelData[0].parcelrate_id, price: price}
            }

            return {parcelID: parcelID, price: price}

            
              
            //   // Step 2: Sort the new array based on the weight property
            // const sortedWeightsAndRates = weightsAndRates.sort((a, b) => a.weight - b.weight);
              

            // // console.log(sortedWeightsAndRates);


            // // console.log(parcelData);

            // for(let i = 0; i < sortedWeightsAndRates.length; i++){
            //     if (weight < sortedWeightsAndRates[i].weight){
            //         price = weight * tempRate;
            //         return {parcelID: parcelData[i].parcelrate_id, price: price}
            //     }
            //     tempRate = sortedWeightsAndRates[i].rate1;
            //     parcelID = parcelData[i].parcelrate_id;
            // }

            // price = weight * tempRate;
            // return {parcelID: parcelID, price: price}     
        }
}
