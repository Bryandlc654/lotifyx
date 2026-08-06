import { IsString, IsOptional } from "class-validator";

export class CreateBankAccountDto {
  @IsString({ message: "El nombre del banco es obligatorio" })
  bank_name: string;

  @IsString({ message: "El número de cuenta es obligatorio" })
  account_number: string;

  @IsOptional()
  @IsString({ message: "El titular de la cuenta no es válido" })
  account_holder?: string;

  @IsOptional()
  @IsString({ message: "El tipo de cuenta no es válido" })
  account_type?: string;
}

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString({ message: "El nombre del banco no es válido" })
  bank_name?: string;

  @IsOptional()
  @IsString({ message: "El número de cuenta no es válido" })
  account_number?: string;

  @IsOptional()
  @IsString({ message: "El titular de la cuenta no es válido" })
  account_holder?: string;

  @IsOptional()
  @IsString({ message: "El tipo de cuenta no es válido" })
  account_type?: string;
}
