import { z } from "zod";

export const COMO_NOS_ENCONTRASTE_OPTIONS = [
  "Redes Sociales",
  "Recomendación de un amigo",
  "Búsqueda en Google",
  "Publicidad",
  "Evento / Conferencia",
  "Otro",
] as const;

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100),
    apellidos: z
      .string()
      .min(2, "Los apellidos deben tener al menos 2 caracteres")
      .max(150),
    dni: z
      .string()
      .regex(/^\d{8}$/, "El DNI debe tener 8 dígitos")
      .length(8),
    fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    telefono: z
      .string()
      .regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos")
      .length(9),
    correo: z
      .string()
      .email("El correo no es válido")
      .min(1, "El correo es obligatorio"),
    contrasena: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])/,
        "Debe contener mayúscula, minúscula, número y carácter especial"
      ),
    confirmarContrasena: z.string(),
    ruc: z.string().optional().or(z.literal("")),
    razonSocial: z
      .string()
      .max(200)
      .optional()
      .or(z.literal("")),
    codigoReferidos: z
      .string()
      .max(20)
      .optional()
      .or(z.literal("")),
    accountType: z
      .string()
      .min(1, "Selecciona si quieres vender o comprar"),
    comoNosEncontraste: z
      .string()
      .min(1, "Selecciona cómo nos encontraste"),
    aceptaTerminos: z.literal(true, {
      errorMap: () => ({
        message: "Debes aceptar los términos y condiciones",
      }),
    }),
  })
  .refine(
    (data) => data.contrasena === data.confirmarContrasena,
    { message: "Las contraseñas no coinciden", path: ["confirmarContrasena"] }
  )
  .refine(
    (data) => {
      if (!data.fechaNacimiento) return true;
      const birthDate = new Date(data.fechaNacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const isAdult =
        age > 18 ||
        (age === 18 && monthDiff >= 0 && today.getDate() >= birthDate.getDate());
      return isAdult;
    },
    {
      message: "Debes ser mayor de 18 años",
      path: ["fechaNacimiento"],
    }
  )
  .refine(
    (data) => {
      if (data.accountType !== "Quiero vender") return true;
      return /^\d{11}$/.test(data.ruc || "");
    },
    { message: "El RUC debe tener 11 dígitos", path: ["ruc"] }
  );

export type RegistroFormData = z.infer<typeof registroSchema>;
