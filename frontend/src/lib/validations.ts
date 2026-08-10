import { z } from "zod";

export const COMO_NOS_ENCONTRASTE_OPTIONS = [
  "Redes Sociales",
  "Recomendación de un amigo",
  "Búsqueda en Google",
  "Publicidad",
  "Evento / Conferencia",
  "Otro",
] as const;

export const TIPO_DOCUMENTO_OPTIONS = ["DNI", "Carnet de Extranjería", "Pasaporte"] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100)
      .regex(/\S/, "El nombre no puede contener solo espacios"),
    apellidos: z
      .string()
      .trim()
      .min(2, "Los apellidos deben tener al menos 2 caracteres")
      .max(150)
      .regex(/\S/, "Los apellidos no pueden contener solo espacios"),
    tipoDocumento: z.string().min(1, "Selecciona el tipo de documento"),
    dni: z
      .string()
      .trim()
      .min(1, "El número de documento es obligatorio")
      .max(12, "El número de documento no es válido"),
    fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    telefono: z
      .string()
      .trim()
      .regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos")
      .length(9),
    correo: z
      .string()
      .trim()
      .email("El correo no es válido")
      .regex(EMAIL_REGEX, "Ingresa un correo válido"),
    contrasena: z
      .string()
      .trim()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/^\S+$/, "La contraseña no puede contener espacios")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-])/,
        "Debe contener mayúscula, minúscula, número y carácter especial"
      ),
    confirmarContrasena: z.string().trim(),
    ruc: z.string().trim().optional().or(z.literal("")),
    razonSocial: z
      .string()
      .trim()
      .max(200)
      .regex(/\S/, "La razón social no puede contener solo espacios")
      .optional()
      .or(z.literal("")),
    codigoReferidos: z
      .string()
      .trim()
      .max(20)
      .regex(/\S/, "El código de referido no puede contener solo espacios")
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
  .superRefine((data, ctx) => {
    const val = data.dni;
    let ok: boolean;
    let message: string;
    if (data.tipoDocumento === "Carnet de Extranjería") {
      ok = /^\d{9}$/.test(val);
      message = "El carnet de extranjería debe tener 9 dígitos";
    } else if (data.tipoDocumento === "Pasaporte") {
      ok = /^[A-Za-z0-9]{6,12}$/.test(val);
      message = "El pasaporte debe tener entre 6 y 12 caracteres";
    } else {
      ok = /^\d{8}$/.test(val);
      message = "El DNI debe tener 8 dígitos";
    }
    if (!ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["dni"] });
    }
  })
  .refine(
    (data) => {
      if (data.accountType !== "Quiero vender") return true;
      return /^\d{11}$/.test(data.ruc || "");
    },
    { message: "El RUC debe tener 11 dígitos", path: ["ruc"] }
  );

export type RegistroFormData = z.infer<typeof registroSchema>;
