import { Injectable } from "@nestjs/common";

export type NivelCoincidencia = "estricta" | "flexible" | "amplia";

export interface Diferencia {
  campo: string;
  label: string;
  grupo: string;
  esperado: any;
  ofrecido: any;
}

export interface MatchResult {
  nivel: NivelCoincidencia;
  es_estricta: boolean;
  faltantes: Diferencia[];
  variantes: Diferencia[];
}

export interface MatchField {
  name: string;
  label: string;
  grupo: string;
}

@Injectable()
export class MatchingService {
  /** Normaliza un valor para comparar (case-insensitive, espacios colapsados, numérico). */
  private norm(v: any): string | null {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v).trim().replace(/\s+/g, " ");
    if (s === "") return null;
    return s.toLowerCase();
  }

  /**
   * Calcula el nivel de coincidencia entre las especificaciones de un producto
   * y las de una solicitud, según los campos de la categoría:
   * - Estricta: todos los campos especificados en la solicitud coinciden.
   * - Flexible: coinciden los campos principales y varía a lo sumo 1 secundario.
   * - Amplia: misma categoría (valida el flujo), variantes libres.
   */
  calcularCoincidencia(
    productSpecs: Record<string, any>,
    requestSpecs: Record<string, any>,
    fields: MatchField[],
  ): MatchResult {
    const fieldMap = new Map<string, MatchField>();
    for (const f of fields || []) fieldMap.set(f.name, f);

    const diferencias: Diferencia[] = [];
    for (const [key, raw] of Object.entries(requestSpecs || {})) {
      const esperado = this.norm(raw);
      if (esperado === null) continue; // el comprador no especificó este campo
      const ofrecido = this.norm(productSpecs ? productSpecs[key] : null);
      if (ofrecido === esperado) continue;

      const field = fieldMap.get(key);
      diferencias.push({
        campo: key,
        label: field?.label || key,
        grupo: field?.grupo || "principal",
        esperado: raw,
        ofrecido: productSpecs ? productSpecs[key] : null,
      });
    }

    if (diferencias.length === 0) {
      return { nivel: "estricta", es_estricta: true, faltantes: [], variantes: [] };
    }

    const variacionesPermitidas = diferencias.filter(d => d.grupo === "secundario");
    if (variacionesPermitidas.length === diferencias.length && variacionesPermitidas.length <= 1) {
      return {
        nivel: "flexible",
        es_estricta: false,
        faltantes: [],
        variantes: variacionesPermitidas,
      };
    }

    return {
      nivel: "amplia",
      es_estricta: false,
      faltantes: diferencias.filter(d => d.ofrecido === null || d.ofrecido === undefined || d.ofrecido === ""),
      variantes: diferencias.filter(d => !(d.ofrecido === null || d.ofrecido === undefined || d.ofrecido === "")),
    };
  }
}
