import { IsString, IsOptional } from "class-validator";

export class SubmitCheckoutDto {
  @IsOptional()
  @IsString()
  items?: string;

  @IsString()
  origin_account_id: string;

  @IsString()
  operation_number: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  bid_id?: string;
}
