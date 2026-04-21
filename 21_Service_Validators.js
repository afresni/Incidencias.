/**
 * 21_Service_Validators.gs
 * Validaciones mínimas, claras y reutilizables para V1.
 *
 * Módulos válidos:
 * - inc_tic
 * - inc_general
 * - compres
 *
 * Validaciones incluidas:
 * - payload incidencias
 * - payload compras
 * - estado permitido por módulo
 *
 * Nota de integración:
 * Este archivo usa funciones de 00_Config.gs con estos nombres exactos:
 * - isValidModule
 * - isValidStateForModule
 */

function validators_normalizeString_(value) {
  return String(value || '').trim();
}

function validators_isNonEmptyString_(value) {
  return validators_normalizeString_(value) !== '';
}

/**
 * Normaliza módulo: trim + minúsculas.
 * @param {*} value
 * @returns {string}
 */
function validators_normalizeModule_(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Lanza error si el módulo no es válido.
 * @param {string} modul
 * @returns {string} módulo validado y normalizado
 */
function validators_requireValidModule(modul) {
  const modulNorm = validators_normalizeModule_(modul);

  if (!isValidModule(modulNorm)) {
    throw new Error(
      `Mòdul no vàlid: "${modul}". Valors permesos: inc_tic, inc_general, compres.`
    );
  }

  return modulNorm;
}

/**
 * Lanza error si el estado no está permitido para el módulo.
 * @param {string} modul
 * @param {string} estat
 * @returns {string} estado validado
 */
function validators_requireValidStateForModule(modul, estat) {
  const modulNorm = validators_requireValidModule(modul);
  const estatNorm = validators_normalizeString_(estat);

  if (!validators_isNonEmptyString_(estatNorm)) {
    throw new Error('El camp "estat" és obligatori.');
  }

  if (!isValidStateForModule(modulNorm, estatNorm)) {
    throw new Error(
      `Estat no vàlid per al mòdul "${modulNorm}": "${estat}".`
    );
  }

  return estatNorm;
}

/**
 * Valida payload de incidencias (inc_tic / inc_general).
 *
 * Reglas:
 * - descripcio obligatoria
 * - espai opcional
 * - element_afectat opcional
 * - observacions opcional
 *
 * @param {Object} payload
 * @returns {{
 *   descripcio: string,
 *   espai: string,
 *   element_afectat: string,
 *   observacions: string
 * }}
 */
function validators_validateIncidenciaPayload(payload) {
  const p = payload || {};

  const descripcio = validators_normalizeString_(p.descripcio);
  const espai = validators_normalizeString_(p.espai);
  const elementAfectat = validators_normalizeString_(p.element_afectat);
  const observacions = validators_normalizeString_(p.observacions);

  if (!validators_isNonEmptyString_(descripcio)) {
    throw new Error('El camp "descripcio" és obligatori per a incidències.');
  }

  return {
    descripcio: descripcio,
    espai: espai,
    element_afectat: elementAfectat,
    observacions: observacions,
  };
}

/**
 * Valida payload de compras (compres).
 *
 * Reglas:
 * - material_sollicitat obligatoria
 * - espai opcional
 * - enllac_referencia opcional
 * - observacions opcional
 *
 * @param {Object} payload
 * @returns {{
 *   material_sollicitat: string,
 *   espai: string,
 *   enllac_referencia: string,
 *   observacions: string
 * }}
 */
function validators_validateCompresPayload(payload) {
  const p = payload || {};

  const materialSollicitat = validators_normalizeString_(p.material_sollicitat);
  const espai = validators_normalizeString_(p.espai);
  const enllacReferencia = validators_normalizeString_(p.enllac_referencia);
  const observacions = validators_normalizeString_(p.observacions);

  if (!validators_isNonEmptyString_(materialSollicitat)) {
    throw new Error('El camp "material_sollicitat" és obligatori per a compres.');
  }

  return {
    material_sollicitat: materialSollicitat,
    espai: espai,
    enllac_referencia: enllacReferencia,
    observacions: observacions,
  };
}