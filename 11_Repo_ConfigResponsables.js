/**
 * 11_Repo_ConfigResponsables.gs
 * Repositorio para la hoja CONFIG_RESPONSABLES.
 *
 * Reglas V1:
 * - Columnas exactas: modul | responsable_email | actiu
 * - modul obligatorio y permitido: inc_tic | inc_general | compres
 * - responsable_email obligatorio y válido
 * - actiu obligatorio y booleano real (true/false)
 * - Debe existir UNA única fila activa por módulo
 *   - 0 activas => error
 *   - >1 activas => error
 */

const CONFIG_RESP_COLUMNS = Object.freeze({
  MODUL: 'modul',
  RESPONSABLE_EMAIL: 'responsable_email',
  ACTIU: 'actiu',
});

/**
 * Obtiene el Spreadsheet ID de la WebApp desde APP_CONFIG.
 * Espera APP_CONFIG.SPREADSHEETS.WEBAPP_ID en 00_Config.gs.
 * @returns {string}
 */
function repoConfigResponsables_getSpreadsheetId_() {
  const id =
    APP_CONFIG &&
    APP_CONFIG.SPREADSHEETS &&
    String(APP_CONFIG.SPREADSHEETS.WEBAPP_ID || '').trim();

  if (!id) {
    throw new Error(
      'Error de configuració: manca SPREADSHEETS.WEBAPP_ID a APP_CONFIG (00_Config.gs).'
    );
  }

  return id;
}

/**
 * Abre el spreadsheet por ID (nunca usa getActiveSpreadsheet).
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function repoConfigResponsables_openSpreadsheet_() {
  const spreadsheetId = repoConfigResponsables_getSpreadsheetId_();
  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Normaliza strings (trim + minúsculas).
 * @param {*} v
 * @returns {string}
 */
function repoConfigResponsables_normalize(v) {
  return String(v || '').trim().toLowerCase();
}

/**
 * Valida email (formato básico).
 * @param {string} email
 * @returns {boolean}
 */
function repoConfigResponsables_isValidEmail(email) {
  const e = repoConfigResponsables_normalize(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Devuelve true si value es booleano real (true o false).
 * @param {*} value
 * @returns {boolean}
 */
function repoConfigResponsables_isBooleanStrict(value) {
  return typeof value === 'boolean';
}

/**
 * Devuelve true si value es TRUE booleano real.
 * @param {*} value
 * @returns {boolean}
 */
function repoConfigResponsables_isTrueBoolean(value) {
  return value === true;
}

/**
 * Devuelve true si el módulo está permitido.
 * @param {string} modul
 * @returns {boolean}
 */
function repoConfigResponsables_isAllowedModule(modul) {
  return Object.values(APP_CONFIG.MODULES).includes(modul);
}

/**
 * Determina si una fila está completamente vacía.
 * @param {Array<*>} row
 * @returns {boolean}
 */
function repoConfigResponsables_isCompletelyEmptyRow_(row) {
  return row.every(cell => String(cell || '').trim() === '');
}

/**
 * Lee CONFIG_RESPONSABLES y devuelve filas como objetos.
 * Incluye metadatos de fila para facilitar validación.
 * Ignora filas completamente vacías debajo de la cabecera.
 * @returns {Array<Object>}
 */
function repoConfigResponsables_getAllRows() {
  const ss = repoConfigResponsables_openSpreadsheet_();
  const sh = ss.getSheetByName(APP_CONFIG.SHEETS.CONFIG_RESPONSABLES);

  if (!sh) {
    throw new Error(
      `Error de configuració: no existeix la fulla "${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}".`
    );
  }

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) {
    return [];
  }

  const headers = values[0].map(h => repoConfigResponsables_normalize(h));

  const required = [
    CONFIG_RESP_COLUMNS.MODUL,
    CONFIG_RESP_COLUMNS.RESPONSABLE_EMAIL,
    CONFIG_RESP_COLUMNS.ACTIU,
  ];

  required.forEach(col => {
    if (!headers.includes(col)) {
      throw new Error(
        `Error de configuració a ${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}: falta la columna "${col}".`
      );
    }
  });

  const dataRows = values.slice(1);
  const result = [];

  dataRows.forEach((row, idx) => {
    if (repoConfigResponsables_isCompletelyEmptyRow_(row)) return;

    const obj = { _rowNumber: idx + 2 };
    headers.forEach((key, colIdx) => {
      obj[key] = row[colIdx];
    });
    result.push(obj);
  });

  return result;
}

/**
 * Devuelve el email responsable activo para un módulo.
 *
 * Comportamiento:
 * - Buscar por modul exacto
 * - Filtrar por actiu = TRUE
 * - Devolver responsable_email
 * - Si no hay una única coincidencia activa => error de configuración
 *
 * @param {string} modul
 * @returns {string}
 */
function repoConfigResponsables_getActiveResponsibleEmailByModule(modul) {
  const modulNorm = repoConfigResponsables_normalize(modul);

  if (!repoConfigResponsables_isAllowedModule(modulNorm)) {
    throw new Error(
      `Mòdul no vàlid: "${modul}". Valors permesos: inc_tic, inc_general, compres.`
    );
  }

  const rows = repoConfigResponsables_getAllRows();

  const sameModule = rows.filter(r => {
    const rowModul = repoConfigResponsables_normalize(r[CONFIG_RESP_COLUMNS.MODUL]);
    return rowModul === modulNorm;
  });

  const activeRows = sameModule.filter(r =>
    repoConfigResponsables_isTrueBoolean(r[CONFIG_RESP_COLUMNS.ACTIU])
  );

  if (activeRows.length === 0) {
    throw new Error(
      `Error de configuració a ${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}: ` +
      `no hi ha cap fila activa per al mòdul "${modulNorm}".`
    );
  }

  if (activeRows.length > 1) {
    throw new Error(
      `Error de configuració a ${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}: ` +
      `hi ha més d'una fila activa per al mòdul "${modulNorm}".`
    );
  }

  const emailRaw = activeRows[0][CONFIG_RESP_COLUMNS.RESPONSABLE_EMAIL];
  const email = repoConfigResponsables_normalize(emailRaw);

  if (!email) {
    throw new Error(
      `Error de configuració a ${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}: ` +
      `responsable_email buit per al mòdul "${modulNorm}".`
    );
  }

  if (!repoConfigResponsables_isValidEmail(email)) {
    throw new Error(
      `Error de configuració a ${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}: ` +
      `responsable_email no vàlid per al mòdul "${modulNorm}" (${emailRaw}).`
    );
  }

  return email;
}

/**
 * Devuelve mapa de responsables activos por módulo.
 * Resultado:
 * {
 *   inc_tic: "xxx@...",
 *   inc_general: "yyy@...",
 *   compres: "zzz@..."
 * }
 *
 * @returns {Object<string, string>}
 */
function repoConfigResponsables_getActiveResponsiblesMap() {
  const modules = Object.values(APP_CONFIG.MODULES);
  const map = {};

  modules.forEach(modul => {
    map[modul] = repoConfigResponsables_getActiveResponsibleEmailByModule(modul);
  });

  return map;
}

/**
 * Validación administrativa completa de CONFIG_RESPONSABLES.
 *
 * Valida:
 * - columnas requeridas
 * - módulos permitidos
 * - email válido
 * - actiu booleano real (true/false) en TODAS las filas (incluidas inactivas)
 * - duplicidades activas por módulo
 * - ausencia de fila activa por módulo
 * - filas mal configuradas aunque estén inactivas
 *
 * @returns {true}
 * @throws {Error} con detalle de incidencias
 */
function repoConfigResponsables_validateAll() {
  const rows = repoConfigResponsables_getAllRows();
  const allowedModules = Object.values(APP_CONFIG.MODULES);

  const activeCountByModule = allowedModules.reduce((acc, modul) => {
    acc[modul] = 0;
    return acc;
  }, {});

  const errors = [];

  rows.forEach(r => {
    const rowNo = r._rowNumber;
    const modul = repoConfigResponsables_normalize(r[CONFIG_RESP_COLUMNS.MODUL]);
    const email = repoConfigResponsables_normalize(r[CONFIG_RESP_COLUMNS.RESPONSABLE_EMAIL]);
    const actiu = r[CONFIG_RESP_COLUMNS.ACTIU];

    if (!modul) {
      errors.push(`Fila ${rowNo}: "modul" buit.`);
    } else if (!allowedModules.includes(modul)) {
      errors.push(`Fila ${rowNo}: "modul" no permès (${r[CONFIG_RESP_COLUMNS.MODUL]}).`);
    }

    if (!email) {
      errors.push(`Fila ${rowNo}: "responsable_email" buit.`);
    } else if (!repoConfigResponsables_isValidEmail(email)) {
      errors.push(`Fila ${rowNo}: "responsable_email" no vàlid (${r[CONFIG_RESP_COLUMNS.RESPONSABLE_EMAIL]}).`);
    }

    if (!repoConfigResponsables_isBooleanStrict(actiu)) {
      errors.push(
        `Fila ${rowNo}: "actiu" ha de ser booleà real (TRUE/FALSE). Valor trobat: ${String(actiu)}`
      );
    }

    if (
      repoConfigResponsables_isBooleanStrict(actiu) &&
      actiu === true &&
      allowedModules.includes(modul)
    ) {
      activeCountByModule[modul] = (activeCountByModule[modul] || 0) + 1;
    }
  });

  allowedModules.forEach(modul => {
    const count = activeCountByModule[modul] || 0;
    if (count === 0) {
      errors.push(`Configuració: no hi ha cap fila activa per al mòdul "${modul}".`);
    } else if (count > 1) {
      errors.push(`Configuració: hi ha ${count} files actives per al mòdul "${modul}" (ha de ser exactament 1).`);
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Errors de configuració a ${APP_CONFIG.SHEETS.CONFIG_RESPONSABLES}:\n- ` +
      errors.join('\n- ')
    );
  }

  return true;
}