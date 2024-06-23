import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(DatabaseService.name);

    // extending PrismaClient to an injectable service makes all the schema methods injectable throughout the project
    async onModuleInit() {
        const startTime = performance.now();

        await this.$connect();

        const endTime = performance.now();
        const elapsedTime = endTime - startTime;

        this.logger.log(`DBS Initiated@PORT: ${process.env.DATA_PORT} route +${Math.round(elapsedTime)}ms`);
    }
}
