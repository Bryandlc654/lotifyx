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
  IsIn
} from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "El correo no es válido" })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Ingresa un correo válido" })
  @IsNotEmpty({ message: "El correo es obligatorio" })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: "La contraseña es obligatoria" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @Matches(/^\S+$/, { message: "La contraseña no puede contener espacios" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])/, {
    message: "La contraseña debe contener mayúscula, minúscula, número y carácter especial",
  })
  contrasena: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres" })
  @MaxLength(100, { message: "El nombre no debe superar los 100 caracteres" })
  @Matches(/\S/, { message: "El nombre no puede contener solo espacios" })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: "Los apellidos son obligatorios" })
  @MinLength(2, { message: "Los apellidos deben tener al menos 2 caracteres" })
  @MaxLength(150, { message: "Los apellidos no deben superar los 150 caracteres" })
  @Matches(/\S/, { message: "Los apellidos no pueden contener solo espacios" })
  apellidos: string;

  @IsOptional()
  @IsIn(["DNI", "Carnet de Extranjería", "Pasaporte"], {
    message: "Tipo de documento no válido",
  })
  tipoDocumento?: string;

  @IsString()
  @IsNotEmpty({ message: "El número de documento es obligatorio" })
  @Matches(/^[A-Za-z0-9]{6,12}$/, { message: "El número de documento no es válido" })
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
  @MaxLength(200, { message: "La razón social no debe superar los 200 caracteres" })
  @Matches(/\S/, { message: "La razón social no puede contener solo espacios" })
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: "El código de referido no debe superar los 20 caracteres" })
  @Matches(/\S/, { message: "El código de referido no puede contener solo espacios" })
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
