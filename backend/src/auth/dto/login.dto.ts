import { IsString, IsNotEmpty } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "El correo o celular es obligatorio" })
  credential: string;

  @IsString()
  @IsNotEmpty({ message: "La contraseña es obligatoria" })
  contrasena: string;
}
