// This DTO shall be used to create the record in MAWB table & !exist -> Customer reg
export class CreateUploadDto {
    readonly mawb: string;
    readonly flight: string;
    readonly date: string;
    readonly month: number;
    readonly year: number;
    readonly fileData: FileDataDto[];
};

// This is the main DTO for the uploaded file. 
// However, the process the MAWB and Customer from the DTO
// We must throw it in an arr of obj such that in can be traversed
export class FileDataDto {
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
