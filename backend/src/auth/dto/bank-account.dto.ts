import { IsString, IsOptional } from "class-validator";

export class CreateBankAccountDto {
  @IsString()
  bank_name: string;

  @IsString()
  account_number: string;

  @IsOptional()
  @IsString()
  account_holder?: string;

  @IsOptional()
  @IsString()
  account_type?: string;
}

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  account_holder?: string;

  @IsOptional()
  @IsString()
  account_type?: string;
}
