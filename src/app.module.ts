import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './dbs_config/database/database.module';
import { AdminModule } from './admin/admin.module';
import { APP_GUARD } from '@nestjs/core';
import { accessTokenGuard } from './resourses/guard';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';
import { PapercalculationModule } from './papercalculation/papercalculation.module';
import { LocationRateModule } from './resourses/location_rate/location_rate.module';
import { ConversionBdtModule } from './resourses/conversion-bdt/conversion-bdt.module';
import { ParcelcalculationsModule } from './parcelcalculations/parcelcalculations.module';
import { ParcelrateModule } from './resourses/parcelrate/parcelrate.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    DatabaseModule, AdminModule, UserModule, UploadModule, PapercalculationModule, LocationRateModule, ConversionBdtModule, ParcelcalculationsModule, ParcelrateModule, CustomerModule
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: accessTokenGuard  //specifying that the guard to be used is the `accessTokenGuard` class. 
                                  //This means that `accessTokenGuard` will be applied to all routes in the application, 
                                  //unless overridden at the controller or route level.


    }
  ],
})
export class AppModule {}
