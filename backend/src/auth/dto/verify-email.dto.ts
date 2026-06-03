import { IsString, IsNotEmpty, IsEmail } from "class-validator";

export class VerifyEmailDto {
  @IsEmail({}, { message: "El correo no es válido" })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: "El código es obligatorio" })
  code: string;
}
