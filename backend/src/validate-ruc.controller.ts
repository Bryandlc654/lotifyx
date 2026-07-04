import { Controller, Post, Body, BadRequestException } from "@nestjs/common";

@Controller("validate-ruc")
export class ValidateRucController {
  @Post()
  async validate(@Body("ruc") ruc: string) {
    if (!/^\d{11}$/.test(ruc)) throw new BadRequestException("RUC debe tener 11 dígitos");

    const token = process.env.APISPERU_TOKEN;
    if (!token) throw new BadRequestException("Token de apiperu.dev no configurado");

    try {
      const res = await fetch("https://apiperu.dev/api/ruc", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ruc }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error("API no disponible");

      const result = await res.json();

      if (!result.success || !result.data) {
        return { valid: false, message: "RUC no válido o no encontrado" };
      }

      return {
        valid: true,
        ruc: result.data.ruc,
        razonSocial: result.data.nombre_o_razon_social,
        estado: result.data.estado,
        condicion: result.data.condicion,
        direccion: result.data.direccion_completa,
      };
    } catch (err: any) {
      if (err.name === "TimeoutError") {
        return { valid: false, message: "El servicio de SUNAT no respondió. Intenta de nuevo." };
      }
      return { valid: false, message: "Error al validar RUC: " + (err.message || "servicio no disponible") };
    }
  }
}
