import { ForbiddenException, HttpCode, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { DatabaseService } from 'src/dbs_config/database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UploadService {
  constructor(private readonly databaseService: DatabaseService
  ){

  }

  async createMawb(mawb: string, flight: string, month: number, year: number, date: string): Promise<Number>{

    const isMawbExist = await this.databaseService.mawb.findFirst({
      where:{
        mawb: mawb
      }
    });

    

    if (isMawbExist)
      return isMawbExist.mawb_id;

    const result = await this.databaseService.mawb.create({
      data:{
        mawb,
        flight,
        month,
        year,
        date
      }
    })

    return result.mawb_id
  } 

  // Method to handle the registration of companies (shippers)
  async createCompany(createUploadDto: CreateUploadDto) {
    const mawbID = await this.createMawb(createUploadDto.mawb, createUploadDto.flight, createUploadDto.month, createUploadDto.year, createUploadDto.date);

    const shippers = createUploadDto.fileData.map((data) => ({
      name: data.SHIPPER,
    }));

    for (const iterator of shippers) {
      try {
        const existingShipper = await this.databaseService.customer.findFirst({
          where: {
            name: iterator.name,
          },
        });

        if (!existingShipper) {
          await this.databaseService.customer.create({
            data: {
              name: iterator.name,
            },
          });
        }

      } catch (error) {
        console.error(error);
      }
    }

    return mawbID;
  }

  async uploadTable (createUploadDTO: CreateUploadDto){
    const mawbInfo = await this.createCompany(createUploadDTO);
    
    for (const iterator of createUploadDTO.fileData) {
      
      const customerInfo= await this.databaseService.customer.findFirst({
        where:{
          name: iterator.SHIPPER
        },
        select:{
          customerid: true
        }
      });
      const customerID = customerInfo.customerid;

      const isUploadExist = await this.databaseService.uploadtable.findFirst({
        where:{
          awb: String(iterator.AWBNO),
          customerid: customerID,
          mawb_id: Number(mawbInfo),
          address: String(iterator.SHIPPERADDRESS),
        }
      });
      

      if (!isUploadExist){
        await this.databaseService.uploadtable.create({
          data:{
            awb: String(iterator.AWBNO),
            customerid: Number(customerID),
            mawb_id: Number(mawbInfo),
            address: String(iterator.SHIPPERADDRESS),
            consigne: iterator.CONSIGNEE,
            bin_vat: String(iterator.BINVAT),
            dest: iterator.DEST,
            cnee_address: iterator.CNEEADDRESS,
            ctc: iterator.CTC,
            tel_no: parseInt(iterator.TEL_NO),
            nop: Number(iterator.NOP),
            weight: iterator.WT,
            volume: Number(iterator.VOL),
            dsct: iterator.DSCT,
            cod: parseFloat(iterator.COD),
            val: parseFloat(iterator.VAL),
            re: iterator.RE,
            bag_no: iterator.BAGNO
          }
        })
      }

    }

    return this.getAll_MAWBIB(mawbInfo);
  }

  async getAll_MAWBIB(mawb_id: Number){
    
    const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`SELECT * , "Customer".name
    FROM "uploadtable"
    INNER JOIN "Customer"
    ON "Customer".customerid = "uploadtable".customerid
    
    WHERE "uploadtable".mawb_id = ${mawb_id}
    ORDER BY "uploadtable".customerid ASC`;

    const modifiedInfo = getInfo.map(row => {
    return {
      ...row,
      awb: Number(row.awb),
      bin_vat: Number(row.bin_vat)
    };
  });

  return modifiedInfo;
  }

  async find_uploadID(uploadID: Number){
    const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`SELECT "Customer".name, "Mawb".mawb, * 
    FROM "uploadtable"
    INNER JOIN "Customer"
    ON "Customer".customerid = "uploadtable".customerid
  	INNER JOIN "Mawb"
  	ON "Mawb".mawb_id = "uploadtable".mawb_id
    
    WHERE "uploadtable".upload_id = ${uploadID}
    ORDER BY "uploadtable".customerid ASC`;

    const modifiedInfo = getInfo.map(row => {
    return {
      ...row,
      awb: Number(row.awb),
      bin_vat: Number(row.bin_vat)
    };
  });
  if (modifiedInfo.length == 0)
    throw new NotFoundException;
  return modifiedInfo;
  }

  async billGenerateStatusChange(upload_id: number){
    const isUploadExists = await this.databaseService.uploadtable.findFirst({
        where:{
            upload_id
        }
    })

    if (!isUploadExists){
        throw new NotFoundException(`No rows found with upload ID: ${upload_id}`)
    }

    await this.databaseService.uploadtable.update({
        where:{
            upload_id
        },
        data:{
            billgenerate: true
        }
    })

    const result = await this.getOne_UploadID(upload_id);
    
    return result;
}

  findAll() {
    return `This action returns all upload`;
  }

  async getAllMAWBLIst(): Promise<string[]>{
    const getList = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`
      SELECT "Mawb".mawb FROM public."Mawb"
      ORDER BY mawb_id DESC 
    `;

    let result = [];
    for (const iterator of getList) {
      result.push(iterator.mawb)
    }

    return result;
    
  }

  async getAllMAWBMonthYear_List(){
    const getList = await this.databaseService.$queryRaw<{month: number, year: number}[]>`
      SELECT "Mawb".month, "Mawb".year FROM public."Mawb"
      ORDER BY mawb_id DESC 
    `

    if (getList.length < 1)
      throw new NotFoundException(`Data not found in DBS`);
    
    const uniqueCombinations = new Set();
    const result = [];

    for (const item of getList) {
      const combination = `${item.month}-${item.year}`;
      if (!uniqueCombinations.has(combination)) {
        uniqueCombinations.add(combination);
        result.push({ month: item.month, year: item.year });
      }
    }

    return result;
  }

  async getAllCustomerList(){
    const getList = await this.databaseService.customer.findMany({
      select:{
        name: true
      }
    })

    return getList;
  }
  async findAll_MAWB(mawbObj: { mawb: string }) {
    const mawb = mawbObj.mawb;

    console.log(typeof mawb, mawb);
    
    
    const getInfo = await this.databaseService.$queryRaw<{ [key: string]: any }[]>`
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
      "pcr".value as pcr_value,
      "pcr"."conversionID" as pcrConversion,
      "pcr"."locationRate_id" as pcrLocationRate,
      "scr".value as scr_value,
      "scr".parcelrate_id as scr_parcelRate,
      "scr"."locationRate_id" as scrLocationRate,
      "scr"."conversionID" as scrConversion,
      "pcs".value as pcs_value,
      "pcs"."conversionID" as pcsConversion,
      "scs".value as scs_value,
      "scs".parcelrate_id as scs_parcelRate,
      "scs"."conversionID" as scsConversion,
      "spxpp".value as spxpp_value,
      "spxpp".parcelrate_id as spxpp_parcelRate
    FROM "uploadtable"
    INNER JOIN "Mawb"
    ON "Mawb".mawb_id = "uploadtable".mawb_id
    INNER JOIN "Customer"
    ON "Customer".customerid = "uploadtable".customerid
    LEFT JOIN "pcr"
    ON "pcr"."upload_id" = "uploadtable"."upload_id"
    LEFT JOIN "scr"
    ON "scr"."upload_id" = "uploadtable"."upload_id"
    LEFT JOIN "pcs"
    ON "uploadtable".upload_id = "pcs".upload_id
    LEFT JOIN "scs"
    ON "uploadtable".upload_id = "scs".upload_id
    LEFT JOIN "spxpp"
    ON "uploadtable".upload_id = "spxpp".upload_id

      WHERE "Mawb".mawb =  ${mawb}
      
      ORDER BY "uploadtable".customerid ASC;
    `;

    const modifiedInfo = getInfo.map(row => {
      return {
        ...row,
        upload_id: parseInt(row.upload_id),
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
      };
    });

    if (modifiedInfo.length == 0) 
      return HttpStatus.NOT_FOUND

    return modifiedInfo;
  }

  async findAll_Month_Year(month: number, year: number){
    const getInfo = await this.databaseService.$queryRaw<{[key: string]: any}>`
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
        "pcr".value as pcr_value,
        "pcr"."conversionID" as pcrConversion,
        "pcr"."locationRate_id" as pcrLocationRate,
        "scr".value as scr_value,
        "scr".parcelrate_id as scr_parcelRate,
        "scr"."locationRate_id" as scrLocationRate,
        "scr"."conversionID" as scrConversion,
        "pcs".value as pcs_value,
        "pcs"."conversionID" as pcsConversion,
        "scs".value as scs_value,
        "scs".parcelrate_id as scs_parcelRate,
        "scs"."conversionID" as scsConversion,
        "spxpp".value as spxpp_value,
        "spxpp".parcelrate_id as spxpp_parcelRate
        FROM "uploadtable"
        INNER JOIN "Mawb"
        ON "Mawb".mawb_id = "uploadtable".mawb_id
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        LEFT JOIN "pcr"
        ON "pcr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "scr"
        ON "scr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "pcs"
        ON "uploadtable".upload_id = "pcs".upload_id
        LEFT JOIN "scs"
        ON "uploadtable".upload_id = "scs".upload_id
        LEFT JOIN "spxpp"
		    ON "uploadtable".upload_id = "spxpp".upload_id
      
      WHERE "Mawb".month = ${month}
      AND "Mawb".year = ${year}
    
    ORDER BY "uploadtable".customerid ASC
    `

    const modifiedInfo = getInfo.map(row => {
      return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
      };
    });

    if (modifiedInfo.length == 0) 
      return HttpStatus.NOT_FOUND

    return modifiedInfo;
  }

  async getAll_Date(date: string){
    const getInfo = await this.databaseService.$queryRaw<{[key: string]: any}>`
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
        "pcr".value as pcr_value,
        "pcr"."conversionID" as pcrConversion,
        "pcr"."locationRate_id" as pcrLocationRate,
        "scr".value as scr_value,
        "scr".parcelrate_id as scr_parcelRate,
        "scr"."locationRate_id" as scrLocationRate,
        "scr"."conversionID" as scrConversion,
        "pcs".value as pcs_value,
        "pcs"."conversionID" as pcsConversion,
        "scs".value as scs_value,
        "scs".parcelrate_id as scs_parcelRate,
        "scs"."conversionID" as scsConversion,
        "spxpp".value as spxpp_value,
        "spxpp".parcelrate_id as spxpp_parcelRate
        FROM "uploadtable"
        INNER JOIN "Mawb"
        ON "Mawb".mawb_id = "uploadtable".mawb_id
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        LEFT JOIN "pcr"
        ON "pcr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "scr"
        ON "scr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "pcs"
        ON "uploadtable".upload_id = "pcs".upload_id
        LEFT JOIN "scs"
        ON "uploadtable".upload_id = "scs".upload_id
        LEFT JOIN "spxpp"
		    ON "uploadtable".upload_id = "spxpp".upload_id
      
      WHERE "Mawb".date = ${date}
    
    ORDER BY "uploadtable".customerid ASC
    `;

    const modifiedInfo = getInfo.map(row => {
      return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
      };
    });

    if (modifiedInfo.length == 0) 
      return HttpStatus.NOT_FOUND

    return modifiedInfo;
  }

  async getAll_CustomerName_Month_Year(customerName: string, month: number, year: number){
    const getInfo = await this.databaseService.$queryRaw<{[key: string]: any}>`
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
          "pcr".value as pcr_value,
          "pcr"."conversionID" as pcrConversion,
          "pcr"."locationRate_id" as pcrLocationRate,
          "scr".value as scr_value,
          "scr".parcelrate_id as scr_parcelRate,
          "scr"."locationRate_id" as scrLocationRate,
          "scr"."conversionID" as scrConversion,
          "pcs".value as pcs_value,
          "pcs"."conversionID" as pcsConversion,
          "scs".value as scs_value,
          "scs".parcelrate_id as scs_parcelRate,
          "scs"."conversionID" as scsConversion,
          "spxpp".value as spxpp_value,
          "spxpp".parcelrate_id as spxpp_parcelRate
        FROM "uploadtable"
        INNER JOIN "Mawb"
        ON "Mawb".mawb_id = "uploadtable".mawb_id
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        LEFT JOIN "pcr"
        ON "pcr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "scr"
        ON "scr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "pcs"
        ON "uploadtable".upload_id = "pcs".upload_id
        LEFT JOIN "scs"
        ON "uploadtable".upload_id = "scs".upload_id
        LEFT JOIN "spxpp"
		    ON "uploadtable".upload_id = "spxpp".upload_id
          
        WHERE "Mawb".month = ${month}
        AND "Mawb".year = ${year}
        AND "Customer".name = ${customerName}
        
        ORDER BY "uploadtable"."upload_id" ASC;
    `;

    const modifiedInfo = getInfo.map(row => {
      return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
      };
    });

    if (modifiedInfo.length == 0) 
      throw new NotFoundException

    return modifiedInfo;
  }

  async getOne_UploadID(upload_id: number){
      const getInfo = await this.databaseService.$queryRaw<{[key: string]: any}>`
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
        "pcr".value as pcr_value,
        "pcr"."conversionID" as pcrConversion,
        "pcr"."locationRate_id" as pcrLocationRate,
        "scr".value as scr_value,
        "scr".parcelrate_id as scr_parcelRate,
        "scr"."locationRate_id" as scrLocationRate,
        "scr"."conversionID" as scrConversion,
        "pcs".value as pcs_value,
        "pcs"."conversionID" as pcsConversion,
        "scs".value as scs_value,
        "scs".parcelrate_id as scs_parcelRate,
        "scs"."conversionID" as scsConversion,
        "spxpp".value as spxpp_value,
        "spxpp".parcelrate_id as spxpp_parcelRate
        FROM "uploadtable"
        INNER JOIN "Mawb"
        ON "Mawb".mawb_id = "uploadtable".mawb_id
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        LEFT JOIN "pcr"
        ON "pcr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "scr"
        ON "scr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "pcs"
        ON "uploadtable".upload_id = "pcs".upload_id
        LEFT JOIN "scs"
        ON "uploadtable".upload_id = "scs".upload_id
        LEFT JOIN "spxpp"
		    ON "uploadtable".upload_id = "spxpp".upload_id
          
        WHERE "uploadtable"."upload_id" = ${upload_id}
    `;

    console.log('getInfo', getInfo);
  

    const modifiedInfo = getInfo.map(row => {
      return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
      };
    });

    if (modifiedInfo.length == 0) 
      throw new NotFoundException

    return modifiedInfo;
  }

  async getAll_CustomerName(customerName: string){
    
    const getInfo = await this.databaseService.$queryRaw<{[key: string]: any}>`
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
        "pcr".value as pcr_value,
        "pcr"."conversionID" as pcrConversion,
        "pcr"."locationRate_id" as pcrLocationRate,
        "scr".value as scr_value,
        "scr".parcelrate_id as scr_parcelRate,
        "scr"."locationRate_id" as scrLocationRate,
        "scr"."conversionID" as scrConversion,
        "pcs".value as pcs_value,
        "pcs"."conversionID" as pcsConversion,
        "scs".value as scs_value,
        "scs".parcelrate_id as scs_parcelRate,
        "scs"."conversionID" as scsConversion,
        "spxpp".value as spxpp_value,
        "spxpp".parcelrate_id as spxpp_parcelRate
        FROM "uploadtable"
        INNER JOIN "Mawb"
        ON "Mawb".mawb_id = "uploadtable".mawb_id
        INNER JOIN "Customer"
        ON "Customer".customerid = "uploadtable".customerid
        LEFT JOIN "pcr"
        ON "pcr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "scr"
        ON "scr"."upload_id" = "uploadtable"."upload_id"
        LEFT JOIN "pcs"
        ON "uploadtable".upload_id = "pcs".upload_id
        LEFT JOIN "scs"
        ON "uploadtable".upload_id = "scs".upload_id
        LEFT JOIN "spxpp"
		    ON "uploadtable".upload_id = "spxpp".upload_id
          
        WHERE "Customer".name = ${customerName}
        
        ORDER BY "uploadtable"."upload_id" ASC;
    `;

    console.log('getInfo', getInfo);
    

    const modifiedInfo = getInfo.map(row => {
      return {
        ...row,
        awb: Number(row.awb),
        bin_vat: Number(row.bin_vat)
      };
    });

    // if (modifiedInfo.length == 0) 
    //   throw new NotFoundException

    return modifiedInfo;
  }

  async update(id: number, updateUploadDto: Prisma.uploadtableUpdateInput) {

    // console.log(typeof Number(updateUploadDto.awb));
    

    return await this.databaseService.uploadtable.update({
      where: {
        upload_id: id
      },
      data: {
        awb: String(updateUploadDto.awb),
        address: updateUploadDto.address,
        consigne: updateUploadDto.consigne,
        bin_vat:String(updateUploadDto.bin_vat),
        dest: updateUploadDto.dest,
        dsct: updateUploadDto.dsct,
        cnee_address: updateUploadDto.cnee_address,
        ctc: updateUploadDto.ctc,
        tel_no: updateUploadDto.tel_no,
        nop: Number(updateUploadDto.nop),
        weight: updateUploadDto.weight,
        volume: Number(updateUploadDto.volume),
        cod: updateUploadDto.cod,
        val: updateUploadDto.val,
        re: updateUploadDto.re,
        bag_no: updateUploadDto.bag_no
      }
    })
  }

  async remove(id: number) {
    return await this.databaseService.uploadtable.delete({
      where:{
        upload_id: id
      }
    });
  }
}
