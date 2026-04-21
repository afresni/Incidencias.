/**
 * 10_Repo_Professorat.gs
 * Repositorio de lectura para la hoja PROFESSORAT (base externa existente).
 *
 * Objetivo:
 * - Resolver datos de profesorado por email institucional.
 * - Trabajar únicamente con registros activos.
 *
 * Columnas esperadas en PROFESSORAT (V1):
 * - nom
 * - llinatges
 * - email
 * - actiu
 */

const PROFESSORAT_COLUMNS = Object.freeze({
  NOM: 'nom',
  LLINATGES: 'llinatges',
  EMAIL: 'email',
  ACTIU: 'actiu',
});

/**
 * Obtiene el Spreadsheet ID de la base de datos del centro desde APP_CONFIG.
 * Espera APP_CONFIG.SPREADSHEETS.DB_CENTRE_ID en 00_Config.gs.
 * @returns {string}
 */
function repoProfessorat_getSpreadsheetId_() {
  const id =
    APP_CONFIG &&
    APP_CONFIG.SPREADSHEETS &&
    String(APP_CONFIG.SPREADSHEETS.DB_CENTRE_ID || '').trim();

  if (!id) {
    throw new Error(
      'Error de configuració: manca SPREADSHEETS.DB_CENTRE_ID a APP_CONFIG (00_Config.gs).'
    );
  }

  return id;
}

/**
 * Abre la spreadsheet por ID (nunca usa getActiveSpreadsheet).
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function repoProfessorat_openSpreadsheet_() {
  const spreadsheetId = repoProfessorat_getSpreadsheetId_();
  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Normaliza email: trim + minúsculas.
 * @param {string} email
 * @returns {string}
 */
function repoProfessorat_normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Valida formato básico de email.
 * @param {string} email
 * @returns {boolean}
 */
function repoProfessorat_isValidEmail(email) {
  const e = repoProfessorat_normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Devuelve true si el valor representa un usuario activo.
 * Acepta:
 * - true booleano real
 * - texto "true"
 * - texto "sí"
 * - texto "si"
 *
 * @param {*} value
 * @returns {boolean}
 */
function repoProfessorat_isActive(value) {
  if (value === true) return true;

  const normalized = String(value || '').trim().toLowerCase();

  return normalized === 'true' || normalized === 'sí' || normalized === 'si';
}

/**
 * Determina si una fila está completamente vacía.
 * @param {Array<*>} row
 * @returns {boolean}
 */
function repoProfessorat_isCompletelyEmptyRow_(row) {
  return row.every(cell => String(cell || '').trim() === '');
}

/**
 * Construye nombre completo desde nom + llinatges.
 * @param {Object} row
 * @returns {string}
 */
function repoProfessorat_buildFullName(row) {
  const nom = String(row[PROFESSORAT_COLUMNS.NOM] || '').trim();
  const llinatges = String(row[PROFESSORAT_COLUMNS.LLINATGES] || '').trim();
  return `${nom} ${llinatges}`.trim();
}

/**
 * Lee toda la hoja PROFESSORAT y la devuelve como objetos por fila.
 * Ignora filas completamente vacías debajo de cabecera.
 * @returns {Array<Object>}
 */
function repoProfessorat_getAllRows() {
  const ss = repoProfessorat_openSpreadsheet_();
  const sh = ss.getSheetByName(APP_CONFIG.SHEETS.PROFESSORAT);

  if (!sh) {
    throw new Error(
      `Error de configuració: no existeix la fulla "${APP_CONFIG.SHEETS.PROFESSORAT}".`
    );
  }

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) {
    return [];
  }

  const headersRaw = values[0];
  const headers = headersRaw.map(h => String(h || '').trim().toLowerCase());

  const required = [
    PROFESSORAT_COLUMNS.NOM,
    PROFESSORAT_COLUMNS.LLINATGES,
    PROFESSORAT_COLUMNS.EMAIL,
    PROFESSORAT_COLUMNS.ACTIU,
  ];

  required.forEach(col => {
    if (!headers.includes(col)) {
      throw new Error(
        `Error de configuració a ${APP_CONFIG.SHEETS.PROFESSORAT}: falta la columna "${col}".`
      );
    }
  });

  const result = [];
  const dataRows = values.slice(1);

  dataRows.forEach(row => {
    if (repoProfessorat_isCompletelyEmptyRow_(row)) return;

    const obj = {};
    headers.forEach((key, idx) => {
      obj[key] = row[idx];
    });
    result.push(obj);
  });

  return result;
}

/**
 * Busca una persona activa por email institucional exacto (normalizado).
 *
 * Regla:
 * - Debe existir exactamente una coincidencia activa.
 * - Si no hay ninguna activa, devuelve null.
 * - Si hay más de una activa, lanza error de configuración.
 *
 * Devuelve estructura mínima:
 * - nom
 * - llinatges
 * - nom_complet
 * - email
 * - actiu
 *
 * @param {string} email
 * @returns {{
 *   nom: string,
 *   llinatges: string,
 *   nom_complet: string,
 *   email: string,
 *   actiu: boolean
 * } | null}
 */
function repoProfessorat_getActiveByEmail(email) {
  const emailNorm = repoProfessorat_normalizeEmail(email);

  if (!repoProfessorat_isValidEmail(emailNorm)) {
    throw new Error(`Email no vàlid: "${email}".`);
  }

  const rows = repoProfessorat_getAllRows();

  const matches = rows.filter(r => {
    const rowEmail = repoProfessorat_normalizeEmail(r[PROFESSORAT_COLUMNS.EMAIL]);
    const isActive = repoProfessorat_isActive(r[PROFESSORAT_COLUMNS.ACTIU]);
    return rowEmail === emailNorm && isActive;
  });

  if (matches.length === 0) {
    return null;
  }

  if (matches.length > 1) {
    throw new Error(
      `Error de configuració a ${APP_CONFIG.SHEETS.PROFESSORAT}: ` +
      `més d'un registre actiu per a l'email "${emailNorm}".`
    );
  }

  const r = matches[0];
  const nom = String(r[PROFESSORAT_COLUMNS.NOM] || '').trim();
  const llinatges = String(r[PROFESSORAT_COLUMNS.LLINATGES] || '').trim();
  const nomComplet = repoProfessorat_buildFullName(r);

  return {
    nom: nom,
    llinatges: llinatges,
    nom_complet: nomComplet,
    email: emailNorm,
    actiu: true,
  };
}

/**
 * Devuelve true/false si una persona está activa por email.
 * @param {string} email
 * @returns {boolean}
 */
function repoProfessorat_isActiveByEmail(email) {
  return repoProfessorat_getActiveByEmail(email) !== null;
}