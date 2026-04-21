/**
 * 25_Service_IdGenerator.gs
 * Generador de id_registre para V1.
 *
 * Formato:
 *   <PREFIJO>-<YYYYMMDD>-<HHMMSS>-<RAND4>
 *
 * Ejemplos:
 *   TIC-20260401-103015-4821
 *   GEN-20260401-103016-0193
 *   COM-20260401-103017-7740
 */

/**
 * Formatea Date a string en timezone del script.
 * @param {Date} date
 * @param {string} pattern
 * @returns {string}
 */
function idGen_formatDate_(date, pattern) {
  const tz = APP_CONFIG.APP.TIMEZONE || Session.getScriptTimeZone() || 'UTC';
  return Utilities.formatDate(date, tz, pattern);
}

/**
 * Devuelve un número aleatorio de n dígitos como string (con ceros a la izquierda).
 * @param {number} digits
 * @returns {string}
 */
function idGen_randomDigits_(digits) {
  const max = Math.pow(10, digits);
  const num = Math.floor(Math.random() * max);
  return String(num).padStart(digits, '0');
}

/**
 * Devuelve el prefijo configurado para el módulo.
 * @param {string} modul
 * @returns {string}
 */
function idGen_getPrefixByModule_(modul) {
  const modulNorm = String(modul || '').trim().toLowerCase();

  if (!isValidModule(modulNorm)) {
    throw new Error(
      `Mòdul no vàlid per generar ID: "${modul}". Valors permesos: inc_tic, inc_general, compres.`
    );
  }

  const prefix = APP_CONFIG.ID_PREFIX[modulNorm];
  if (!prefix) {
    throw new Error(`No hi ha prefix configurat per al mòdul "${modulNorm}".`);
  }

  return String(prefix).trim().toUpperCase();
}

/**
 * Genera id_registre único "práctico" para V1.
 * @param {string} modul - inc_tic | inc_general | compres
 * @returns {string}
 */
function idGenerator_generateRecordId(modul) {
  const prefix = idGen_getPrefixByModule_(modul);
  const now = new Date();

  const ymd = idGen_formatDate_(now, 'yyyyMMdd');
  const hms = idGen_formatDate_(now, 'HHmmss');
  const rand4 = idGen_randomDigits_(4);

  return `${prefix}-${ymd}-${hms}-${rand4}`;
}

/**
 * Alias semántico para servicios.
 * @param {string} modul
 * @returns {string}
 */
function idGenerator_next(modul) {
  return idGenerator_generateRecordId(modul);
}
