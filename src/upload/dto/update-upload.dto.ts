import { PartialType } from '@nestjs/mapped-types';
import { CreateUploadDto } from './create-upload.dto';

export class UpdateUploadDto {
    NO: number;
    AWBNO: string;
    DUTY: string; // Or a more descriptive name
    SHIPPER: string;
    SHIPPERADDRESS: string;
    CONSIGNEE: string;
    BINVAT: string;
    DEST: string;
    CNEEADDRESS: string;
    CTC: string;
    TEL_NO: string;
    NOP: number;
    WT: number;
    VOL: string; // You can specify the appropriate type if available
    DSCT: string;
    COD: string;
    VAL: string;
    RE: string;
    BAGNO: string;
}
