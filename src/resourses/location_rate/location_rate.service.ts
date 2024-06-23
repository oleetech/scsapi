import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/dbs_config/database/database.service';

@Injectable()
export class LocationRateService {
    constructor(private readonly databaseService: DatabaseService){

    }

    async registerLocation(createLocationDTO: Prisma.locationrateCreateInput){
        const isLocationExist = await this.databaseService.locationrate.findFirst({
            where:{
                location_from: createLocationDTO.location_from,
                location_to: createLocationDTO.location_to
            }
        })
        if (isLocationExist){
            throw new ForbiddenException(`${createLocationDTO.location_from} to ${createLocationDTO.location_to} already exists`);       
        }

        await this.databaseService.locationrate.create({
            data:{
                location_from: createLocationDTO.location_from,
                location_to: createLocationDTO.location_to,
                weight_1: createLocationDTO.weight_1,
                rate_1: createLocationDTO.rate_1,
                weight_2: createLocationDTO.weight_2,
                rate_2: createLocationDTO.rate_2,
                weight_3: createLocationDTO.weight_3,
                rate_3: createLocationDTO.rate_3
            }
        });

        return await this.getOne_LocName(createLocationDTO.location_from, createLocationDTO.location_to);
    }

    async showAllLocation(){
        const result = await this.databaseService.locationrate.findMany();

        if (!result)
            throw new NotFoundException(`No Location Found`);

        return result
    }

    async getOne_LocName(from: string, to: string):Promise<any>{
        const result = await this.databaseService.locationrate.findFirst({
            where:{
                location_from: from,
                location_to: to
            }
        })

        if (!result)
            return null

        return result
    }

    async getLocation_ID(locationRate_id: number){
        const result = await this.databaseService.locationrate.findFirst({
            where:{
                locationRate_id
            },
            select:{
                rate_1: true,
                rate_2: true,
                rate_3: true
            }
        })

        if (!result)
            throw new NotFoundException

        return result;
    }

    async updateLocationInformation(locationRate_id: number, updateLocationDTO: Prisma.locationrateUpdateInput){
        const result = await this.databaseService.locationrate.findFirst({
            where:{
                locationRate_id
            }
        })

        if (!result)
            throw new NotFoundException(`${updateLocationDTO.location_from} to ${updateLocationDTO.location_to} does not exist`);

        return await this.databaseService.locationrate.update({
            where:{
                locationRate_id
            },
            data:{
                location_from: updateLocationDTO.location_from,
                location_to: updateLocationDTO.location_to,

                weight_1: updateLocationDTO.weight_1,
                weight_2: updateLocationDTO.weight_2,
                weight_3: updateLocationDTO.weight_3,

                rate_1: updateLocationDTO.rate_1,
                rate_2: updateLocationDTO.rate_2,
                rate_3: updateLocationDTO.rate_3
            }
        })
    }
}
