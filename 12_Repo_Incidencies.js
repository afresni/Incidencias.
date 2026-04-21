/**
 * 12_Repo_Incidencies.gs
 * Repositorio único de acceso a datos para:
 * - INC_TIC
 * - INC_GENERAL
 *
 * Solo acceso a Google Sheets (sin lógica de negocio).
 */

/**
 * Columnas esperadas en INC_TIC e INC_GENERAL.
 */
const INCIDENCIES_HEADERS = Object.freeze([
  'id_registre',
  'data_creacio',
  'email_sollicitant',
  'docent_sollicitant_nom',
  'espai',
  'element_afectat',
  'descripcio',
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
function repoIncidencies_getSpreadsheetId_() {
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
function repoIncidencies_openSpreadsheet_() {
  return SpreadsheetApp.openById(repoIncidencies_getSpreadsheetId_());
}

/**
 * Normaliza string.
 * @param {*} value
 * @returns {string}
 */
function repoIncidencies_normalizeString_(value) {
  return String(value || '').trim();
}

/**
 * Normaliza módulo.
 * @param {*} modul
 * @returns {string}
 */
function repoIncidencies_normalizeModule_(modul) {
  return repoIncidencies_normalizeString_(modul).toLowerCase();
}

/**
 * Valida módulo de incidencias.
 * @param {string} modul
 * @returns {string}
 */
function repoIncidencies_requireValidModule_(modul) {
  const m = repoIncidencies_normalizeModule_(modul);

  if (
    m !== APP_CONFIG.MODULES.INC_TIC &&
    m !== APP_CONFIG.MODULES.INC_GENERAL
  ) {
    throw new Error(
      `Mòdul no vàlid al repositori d'incidències: "${modul}".`
    );
  }

  return m;
}

/**
 * Devuelve nombre de hoja según módulo.
 * @param {string} modul
 * @returns {string}
 */
function repoIncidencies_getSheetNameByModule_(modul) {
  const m = repoIncidencies_requireValidModule_(modul);

  if (m === APP_CONFIG.MODULES.INC_TIC) return APP_CONFIG.SHEETS.INC_TIC;
  return APP_CONFIG.SHEETS.INC_GENERAL;
}

/**
 * Obtiene hoja validada.
 * @param {string} modul
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function repoIncidencies_getSheet_(modul) {
  const ss = repoIncidencies_openSpreadsheet_();
  const sheetName = repoIncidencies_getSheetNameByModule_(modul);
  const sh = ss.getSheetByName(sheetName);

  if (!sh) {
    throw new Error(`Error de configuració: no existeix la fulla "${sheetName}".`);
  }

  return sh;
}

/**
 * Valida cabecera esperada y devuelve mapa de índice por columna.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sh
 * @returns {Object<string, number>}
 */
function repoIncidencies_getHeaderIndexMap_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) {
    throw new Error(`Error de configuració a "${sh.getName()}": capçalera buida.`);
  }

  const headerRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const headers = headerRow.map(h => repoIncidencies_normalizeString_(h).toLowerCase());

  INCIDENCIES_HEADERS.forEach(col => {
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
function repoIncidencies_rowToObject_(row, headerMap) {
  const obj = {};
  INCIDENCIES_HEADERS.forEach(col => {
    obj[col] = row[headerMap[col]];
  });
  return obj;
}

/**
 * Construye array de valores en orden de cabecera esperada.
 * @param {Object} record
 * @returns {Array<*>}
 */
function repoIncidencies_recordToRow_(record) {
  const r = record || {};
  return INCIDENCIES_HEADERS.map(col => (col in r ? r[col] : ''));
}

/**
 * Inserta registro en INC_TIC o INC_GENERAL.
 * @param {string} modul - inc_tic | inc_general
 * @param {Object} record
 * @returns {Object} record insertado
 */
function repoIncidencies_insert(modul, record) {
  const sh = repoIncidencies_getSheet_(modul);
  repoIncidencies_getHeaderIndexMap_(sh);

  const row = repoIncidencies_recordToRow_(record);
  sh.appendRow(row);

  return record;
}

/**
 * Obtiene registro por ID en módulo indicado.
 * @param {string} modul - inc_tic | inc_general
 * @param {string} idRegistre
 * @returns {Object|null}
 */
function repoIncidencies_getById(modul, idRegistre) {
  const sh = repoIncidencies_getSheet_(modul);
  const headerMap = repoIncidencies_getHeaderIndexMap_(sh);
  const idNorm = repoIncidencies_normalizeString_(idRegistre);

  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const idIdx = headerMap.id_registre;

  for (var i = 0; i < values.length; i++) {
    const rowId = repoIncidencies_normalizeString_(values[i][idIdx]);
    if (rowId === idNorm) {
      return repoIncidencies_rowToObject_(values[i], headerMap);
    }
  }

  return null;
}

/**
 * Actualiza únicamente el estado y data_ultima_actualitzacio de un registro.
 * @param {string} modul - inc_tic | inc_general
 * @param {string} idRegistre
 * @param {string} newState
 * @param {*} updatedAt
 * @returns {Object} registro actualizado
 */
function repoIncidencies_updateState(modul, idRegistre, newState, updatedAt) {
  const sh = repoIncidencies_getSheet_(modul);
  const headerMap = repoIncidencies_getHeaderIndexMap_(sh);

  const idNorm = repoIncidencies_normalizeString_(idRegistre);
  const stateNorm = repoIncidencies_normalizeString_(newState);

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
    const rowId = repoIncidencies_normalizeString_(values[i][idIdx]);
    if (rowId === idNorm) {
      const sheetRow = i + 2;

      sh.getRange(sheetRow, estatIdx + 1).setValue(stateNorm);
      sh.getRange(sheetRow, updatedIdx + 1).setValue(updatedAt);

      values[i][estatIdx] = stateNorm;
      values[i][updatedIdx] = updatedAt;

      return repoIncidencies_rowToObject_(values[i], headerMap);
    }
  }

  throw new Error(`No s'ha trobat el registre "${idNorm}" a "${sh.getName()}".`);
}

/**
 * Lista registros del módulo con filtros simples opcionales.
 * Filtros soportados (opcionales):
 * - estat
 * - email_sollicitant
 * - responsable_email
 * - limit (número)
 *
 * @param {string} modul - inc_tic | inc_general
 * @param {Object=} filters
 * @returns {Array<Object>}
 */
function repoIncidencies_list(modul, filters) {
  const sh = repoIncidencies_getSheet_(modul);
  const headerMap = repoIncidencies_getHeaderIndexMap_(sh);
  const f = filters || {};

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const estatFilter = repoIncidencies_normalizeString_(f.estat);
  const emailFilter = repoIncidencies_normalizeString_(f.email_sollicitant).toLowerCase();
  const respFilter = repoIncidencies_normalizeString_(f.responsable_email).toLowerCase();
  const limit = Number(f.limit || 0);

  let rows = values.map(row => repoIncidencies_rowToObject_(row, headerMap));

  if (estatFilter) {
    rows = rows.filter(r => repoIncidencies_normalizeString_(r.estat) === estatFilter);
  }

  if (emailFilter) {
    rows = rows.filter(
      r => repoIncidencies_normalizeString_(r.email_sollicitant).toLowerCase() === emailFilter
    );
  }

  if (respFilter) {
    rows = rows.filter(
      r => repoIncidencies_normalizeString_(r.responsable_email).toLowerCase() === respFilter
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