import { IsString, IsEmail, IsNotEmpty, MaxLength, IsArray, IsOptional, Matches } from "class-validator";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MaxLength(200, { message: "El nombre no puede exceder 200 caracteres" })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: "El nombre solo puede contener letras" })
  name: string;

  @IsEmail({}, { message: "El correo no es válido" })
  @IsNotEmpty({ message: "El correo es obligatorio" })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: "El asunto es obligatorio" })
  @MaxLength(255, { message: "El asunto no puede exceder 255 caracteres" })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: "La descripción es obligatoria" })
  @MaxLength(5000, { message: "La descripción no puede exceder 5000 caracteres" })
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}
