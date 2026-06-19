import { IsString, IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  first_name: string;

  @IsString()
  @IsNotEmpty({ message: "Los apellidos son obligatorios" })
  last_name: string;

  @IsEmail({}, { message: "El correo no es válido" })
  @IsNotEmpty({ message: "El correo es obligatorio" })
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: "El mensaje es obligatorio" })
  message: string;
}
