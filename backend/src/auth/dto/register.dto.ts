import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsDateString,
} from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "El correo no es válido" })
  @IsNotEmpty({ message: "El correo es obligatorio" })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: "La contrasena es obligatoria" })
  @MinLength(8, { message: "La contrasena debe tener al menos 8 caracteres" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])/, {
    message: "La contrasena debe contener mayúscula, minúscula, número y carácter especial",
  })
  contrasena: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres" })
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: "Los apellidos son obligatorios" })
  @MinLength(2, { message: "Los apellidos deben tener al menos 2 caracteres" })
  @MaxLength(150)
  apellidos: string;

  @IsString()
  @IsNotEmpty({ message: "El DNI es obligatorio" })
  @Matches(/^\d{8}$/, { message: "El DNI debe tener 8 dígitos" })
  dni: string;

  @IsDateString({}, { message: "Fecha de nacimiento inválida" })
  @IsNotEmpty({ message: "La fecha de nacimiento es obligatoria" })
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty({ message: "El teléfono es obligatorio" })
  @Matches(/^\d{9}$/, { message: "El teléfono debe tener 9 dígitos" })
  telefono: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: "El RUC debe tener 11 dígitos" })
  ruc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoReferidos?: string;

  @IsString()
  @IsNotEmpty({ message: "Selecciona si quieres vender o comprar" })
  accountType: string;

  @IsString()
  @IsNotEmpty({ message: "Selecciona cómo nos encontraste" })
  comoNosEncontraste: string;

  @IsBoolean({ message: "Debes aceptar los términos y condiciones" })
  aceptaTerminos: boolean;
}
