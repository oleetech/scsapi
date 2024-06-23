import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/dbs_config/database/database.service';

@Injectable()
export class ParcelrateService {
    constructor(private readonly databaseService: DatabaseService){

    }

    async registerParcelRate(createParcelRateDTO: Prisma.parcelrateCreateInput){
        const isParcelRateExists = await this.databaseService.parcelrate.findFirst({
            where:{
                weight: createParcelRateDTO.weight,
                location: createParcelRateDTO.location
            }
        })

        if (isParcelRateExists)
            throw new ForbiddenException(`Rate of ${createParcelRateDTO.weight} KG at ${createParcelRateDTO.location} exists`);

        await this.databaseService.parcelrate.create({
            data:{
                weight: createParcelRateDTO.weight,
                rate1: createParcelRateDTO.rate1,
                rate2: createParcelRateDTO.rate2,
                location: createParcelRateDTO.location
            }
        })
    }

    async getOneParcelRate(location: string, weight: number){
        const parcelData = await this.databaseService.parcelrate.findFirst({
            where:{
                location
            }
        })
        
        if (!parcelData){
            throw new NotFoundException(`Rate of ${weight} KG at ${location} does not exists`);
        }
        
        if (weight > parcelData.weight){
            return {parcelID: parcelData.parcelrate_id, rate: parcelData.rate2} 
        }

        return {parcelID: parcelData.parcelrate_id, rate: parcelData.rate1};
    }

    async getRate_ParcelID(parcelrate_id: number){
        const isRateExists = await this.databaseService.parcelrate.findFirst({
            where:{
                parcelrate_id
            },
            select:{
                rate1: true,
                rate2: true
            }
        });

        if (!isRateExists)
            throw new NotFoundException

        return isRateExists   
    }

    async showAllParcelRate(){
        const result = await this.databaseService.parcelrate.findMany()

        if (!result)
            throw new NotFoundException(`No Parcel Data found`);

        return result;
    }

    async updateParcelRate(parcelRateID: number, updateParcelRateDTO: Prisma.parcelrateUpdateInput){
        const parcelData = await this.databaseService.parcelrate.findFirst({
            where:{
                parcelrate_id: parcelRateID
            }
        })
        
        if (!parcelData){
            throw new NotFoundException(`Rate of ${updateParcelRateDTO.weight} KG at ${updateParcelRateDTO.location} does not exists`);
        }

        try {
            await this.databaseService.parcelrate.update({
                where:{
                    parcelrate_id: parcelRateID
                },
                data:{
                    weight: updateParcelRateDTO.weight,
                    rate1: updateParcelRateDTO.rate1,
                    rate2: updateParcelRateDTO.rate2,

                    location: updateParcelRateDTO.location
                }
            })
        } catch (error) {
            throw error;
        }
    }
}
