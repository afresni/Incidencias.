/**
 * 14_Repo_Historic.gs
 * Repositorio de acceso a datos para la hoja HISTORIC_CANVIS.
 *
 * Solo acceso a Google Sheets (sin lógica de negocio).
 */

/**
 * Columnas esperadas en HISTORIC_CANVIS.
 */
const HISTORIC_HEADERS = Object.freeze([
  'id_canvi',
  'data_hora',
  'modul',
  'id_registre',
  'usuari_email',
  'usuari_nom',
  'camp_modificat',
  'valor_anterior',
  'valor_nou',
  'comentari',
]);

/**
 * Obtiene Spreadsheet ID de la WebApp desde APP_CONFIG.
 * Espera APP_CONFIG.SPREADSHEETS.WEBAPP_ID en 00_Config.gs.
 * @returns {string}
 */
function repoHistoric_getSpreadsheetId_() {
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
function repoHistoric_openSpreadsheet_() {
  return SpreadsheetApp.openById(repoHistoric_getSpreadsheetId_());
}

/**
 * Normaliza string.
 * @param {*} value
 * @returns {string}
 */
function repoHistoric_normalizeString_(value) {
  return String(value || '').trim();
}

/**
 * Obtiene la hoja HISTORIC_CANVIS validada.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function repoHistoric_getSheet_() {
  const ss = repoHistoric_openSpreadsheet_();
  const sh = ss.getSheetByName(APP_CONFIG.SHEETS.HISTORIC_CANVIS);

  if (!sh) {
    throw new Error(
      `Error de configuració: no existeix la fulla "${APP_CONFIG.SHEETS.HISTORIC_CANVIS}".`
    );
  }

  return sh;
}

/**
 * Valida cabecera esperada y devuelve mapa de índices.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sh
 * @returns {Object<string, number>}
 */
function repoHistoric_getHeaderIndexMap_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) {
    throw new Error(`Error de configuració a "${sh.getName()}": capçalera buida.`);
  }

  const headerRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const headers = headerRow.map(h => repoHistoric_normalizeString_(h).toLowerCase());

  HISTORIC_HEADERS.forEach(col => {
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
 * Convierte fila en objeto según cabecera.
 * @param {Array<*>} row
 * @param {Object<string, number>} headerMap
 * @returns {Object}
 */
function repoHistoric_rowToObject_(row, headerMap) {
  const obj = {};
  HISTORIC_HEADERS.forEach(col => {
    obj[col] = row[headerMap[col]];
  });
  return obj;
}

/**
 * Convierte objeto de cambio a fila en orden de cabecera esperada.
 * @param {Object} changeObj
 * @returns {Array<*>}
 */
function repoHistoric_changeToRow_(changeObj) {
  const c = changeObj || {};
  return HISTORIC_HEADERS.map(col => (col in c ? c[col] : ''));
}

/**
 * Inserta un cambio en HISTORIC_CANVIS.
 * @param {Object} changeObj
 * @returns {Object} changeObj insertado
 */
function repoHistoric_insert(changeObj) {
  const sh = repoHistoric_getSheet_();
  repoHistoric_getHeaderIndexMap_(sh);

  const row = repoHistoric_changeToRow_(changeObj);
  sh.appendRow(row);

  return changeObj;
}

/**
 * Lista cambios por (modul, id_registre), ordenados por data_hora ascendente.
 * @param {string} modul
 * @param {string} idRegistre
 * @returns {Array<Object>}
 */
function repoHistoric_listByRecord(modul, idRegistre) {
  const sh = repoHistoric_getSheet_();
  const headerMap = repoHistoric_getHeaderIndexMap_(sh);

  const modulNorm = repoHistoric_normalizeString_(modul).toLowerCase();
  const idNorm = repoHistoric_normalizeString_(idRegistre);

  if (!modulNorm) {
    throw new Error('El camp "modul" és obligatori.');
  }
  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const lastCol = sh.getLastColumn();
  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const modulIdx = headerMap.modul;
  const idIdx = headerMap.id_registre;

  const rows = values
    .filter(row => {
      const rowModul = repoHistoric_normalizeString_(row[modulIdx]).toLowerCase();
      const rowId = repoHistoric_normalizeString_(row[idIdx]);
      return rowModul === modulNorm && rowId === idNorm;
    })
    .map(row => repoHistoric_rowToObject_(row, headerMap));

  rows.sort(function (a, b) {
    const ta = a.data_hora ? new Date(a.data_hora).getTime() : 0;
    const tb = b.data_hora ? new Date(b.data_hora).getTime() : 0;
    return ta - tb;
  });

  return rows;
}