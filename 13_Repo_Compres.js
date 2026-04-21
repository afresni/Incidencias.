/**
 * 13_Repo_Compres.gs
 * Repositorio de acceso a datos para la hoja COMPRES.
 *
 * Solo acceso a Google Sheets (sin lógica de negocio).
 */

/**
 * Columnas esperadas en COMPRES.
 */
const COMPRES_HEADERS = Object.freeze([
  'id_registre',
  'data_creacio',
  'email_sollicitant',
  'docent_sollicitant_nom',
  'material_sollicitat',
  'espai',
  'enllac_referencia',
  'observacions',
  'estat',
  'responsable_email',
  'data_ultima_actualitzacio',
]);

/**
 * Obtiene Spreadsheet ID de la WebApp desde APP_CONFIG.
 * Espera APP_CONFIG.SPREADSHEETS.WEBAPP_ID en 00_Config.gs.
 * @returns {string}
 */
function repoCompres_getSpreadsheetId_() {
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
 * Abre Spreadsheet por ID.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function repoCompres_openSpreadsheet_() {
  return SpreadsheetApp.openById(repoCompres_getSpreadsheetId_());
}

/**
 * Normaliza string.
 * @param {*} value
 * @returns {string}
 */
function repoCompres_normalizeString_(value) {
  return String(value || '').trim();
}

/**
 * Obtiene la hoja COMPRES validada.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function repoCompres_getSheet_() {
  const ss = repoCompres_openSpreadsheet_();
  const sh = ss.getSheetByName(APP_CONFIG.SHEETS.COMPRES);

  if (!sh) {
    throw new Error(
      `Error de configuració: no existeix la fulla "${APP_CONFIG.SHEETS.COMPRES}".`
    );
  }

  return sh;
}

/**
 * Valida cabecera esperada y devuelve mapa de índice por columna.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sh
 * @returns {Object<string, number>}
 */
function repoCompres_getHeaderIndexMap_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) {
    throw new Error(`Error de configuració a "${sh.getName()}": capçalera buida.`);
  }

  const headerRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const headers = headerRow.map(h => repoCompres_normalizeString_(h).toLowerCase());

  COMPRES_HEADERS.forEach(col => {
    if (!headers.includes(col)) {
      throw new Error(
        `Error de configuració a "${sh.getName()}": falta la columna "${col}".`
      );
    }
  });

  const map = {};
  headers.forEach((h, idx) => {
    if (h) map[h] = idx;
  });

  return map;
}

/**
 * Convierte fila (array) a objeto según headerMap.
 * @param {Array<*>} row
 * @param {Object<string, number>} headerMap
 * @returns {Object}
 */
function repoCompres_rowToObject_(row, headerMap) {
  const obj = {};
  COMPRES_HEADERS.forEach(col => {
    obj[col] = row[headerMap[col]];
  });
  return obj;
}

/**
 * Construye array de valores en orden de cabecera esperada.
 * @param {Object} record
 * @returns {Array<*>}
 */
function repoCompres_recordToRow_(record) {
  const r = record || {};
  return COMPRES_HEADERS.map(col => (col in r ? r[col] : ''));
}

/**
 * Inserta registro en COMPRES.
 * @param {Object} record
 * @returns {Object} record insertado
 */
function repoCompres_insert(record) {
  const sh = repoCompres_getSheet_();
  repoCompres_getHeaderIndexMap_(sh);

  const row = repoCompres_recordToRow_(record);
  sh.appendRow(row);

  return record;
}

/**
 * Obtiene registro por ID.
 * @param {string} idRegistre
 * @returns {Object|null}
 */
function repoCompres_getById(idRegistre) {
  const sh = repoCompres_getSheet_();
  const headerMap = repoCompres_getHeaderIndexMap_(sh);

  const idNorm = repoCompres_normalizeString_(idRegistre);
  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const idIdx = headerMap.id_registre;

  for (var i = 0; i < values.length; i++) {
    const rowId = repoCompres_normalizeString_(values[i][idIdx]);
    if (rowId === idNorm) {
      return repoCompres_rowToObject_(values[i], headerMap);
    }
  }

  return null;
}

/**
 * Actualiza únicamente estado y data_ultima_actualitzacio.
 * @param {string} idRegistre
 * @param {string} newState
 * @param {*} updatedAt
 * @returns {Object} registro actualizado
 */
function repoCompres_updateState(idRegistre, newState, updatedAt) {
  const sh = repoCompres_getSheet_();
  const headerMap = repoCompres_getHeaderIndexMap_(sh);

  const idNorm = repoCompres_normalizeString_(idRegistre);
  const stateNorm = repoCompres_normalizeString_(newState);

  if (!idNorm) throw new Error('El camp "id_registre" és obligatori.');
  if (!stateNorm) throw new Error('El camp "newState" és obligatori.');

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    throw new Error(`No s'ha trobat el registre "${idNorm}" a "${sh.getName()}".`);
  }

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const idIdx = headerMap.id_registre;
  const estatIdx = headerMap.estat;
  const updatedIdx = headerMap.data_ultima_actualitzacio;

  for (var i = 0; i < values.length; i++) {
    const rowId = repoCompres_normalizeString_(values[i][idIdx]);
    if (rowId === idNorm) {
      const sheetRow = i + 2;

      sh.getRange(sheetRow, estatIdx + 1).setValue(stateNorm);
      sh.getRange(sheetRow, updatedIdx + 1).setValue(updatedAt);

      values[i][estatIdx] = stateNorm;
      values[i][updatedIdx] = updatedAt;

      return repoCompres_rowToObject_(values[i], headerMap);
    }
  }

  throw new Error(`No s'ha trobat el registre "${idNorm}" a "${sh.getName()}".`);
}

/**
 * Lista registros con filtros simples opcionales.
 * Filtros soportados:
 * - estat
 * - email_sollicitant
 * - responsable_email
 * - limit (número)
 *
 * @param {Object=} filters
 * @returns {Array<Object>}
 */
function repoCompres_list(filters) {
  const sh = repoCompres_getSheet_();
  const headerMap = repoCompres_getHeaderIndexMap_(sh);
  const f = filters || {};

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const estatFilter = repoCompres_normalizeString_(f.estat);
  const emailFilter = repoCompres_normalizeString_(f.email_sollicitant).toLowerCase();
  const respFilter = repoCompres_normalizeString_(f.responsable_email).toLowerCase();
  const limit = Number(f.limit || 0);

  let rows = values.map(row => repoCompres_rowToObject_(row, headerMap));

  if (estatFilter) {
    rows = rows.filter(r => repoCompres_normalizeString_(r.estat) === estatFilter);
  }

  if (emailFilter) {
    rows = rows.filter(
      r => repoCompres_normalizeString_(r.email_sollicitant).toLowerCase() === emailFilter
    );
  }

  if (respFilter) {
    rows = rows.filter(
      r => repoCompres_normalizeString_(r.responsable_email).toLowerCase() === respFilter
    );
  }

  rows.sort(function (a, b) {
    const da = a.data_ultima_actualitzacio ? new Date(a.data_ultima_actualitzacio).getTime() : 0;
    const db = b.data_ultima_actualitzacio ? new Date(b.data_ultima_actualitzacio).getTime() : 0;
    return db - da;
  });

  if (limit > 0) {
    return rows.slice(0, limit);
  }

  return rows;
}