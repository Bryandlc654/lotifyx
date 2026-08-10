import { Controller, Post, Body } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("validate-document")
export class ValidateDocumentController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Post()
  async validate(@Body() body: { tipo?: string; numero?: string }) {
    const tipo = body.tipo || "DNI";
    const numero = (body.numero || "").trim();

    if (tipo === "Pasaporte") {
      return { valid: /^[A-Za-z0-9]{6,12}$/.test(numero), checked: false, message: "Pasaporte: validación de formato" };
    }
    if (tipo === "DNI" && !/^\d{8}$/.test(numero)) {
      return { valid: false, message: "El DNI debe tener 8 dígitos" };
    }
    if (tipo === "Carnet de Extranjería" && !/^\d{9}$/.test(numero)) {
      return { valid: false, message: "El carnet de extranjería debe tener 9 dígitos" };
    }

    const [tokenRow] = await this.dataSource.query(
      `SELECT value FROM settings WHERE key = 'apiperu_token'`,
    );
    const apiToken = tokenRow?.value || process.env.APISPERU_TOKEN;
    if (!apiToken) {
      return { valid: true, checked: false, message: "Servicio no configurado" };
    }

    try {
      const endpoint = tipo === "DNI" ? "https://apiperu.dev/api/dni" : "https://apiperu.dev/api/ce";
      const payload = tipo === "DNI" ? { dni: numero } : { numero };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error("API no disponible");

      const result = await res.json();

      if (!result.success || !result.data) {
        return { valid: false, message: `${tipo} no válido o no encontrado` };
      }

      return {
        valid: true,
        checked: true,
        tipo,
        numero,
        nombre: result.data.nombres || result.data.nombre || null,
        apellidoPaterno: result.data.apellido_paterno || null,
        apellidoMaterno: result.data.apellido_materno || null,
      };
    } catch (err: any) {
      return { valid: false, message: "Error al validar el documento: " + (err.message || "servicio no disponible") };
    }
  }
}
