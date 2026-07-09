import { IsString, IsOptional } from "class-validator";

export class SubmitPaymentDto {
  @IsString()
  operation_number: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  origin_account_id?: string;
}
