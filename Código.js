/**
 * 00_Config.gs
 * Configuración global de la WebApp V1.
 *
 * Estructura real:
 * - Spreadsheet 1: base de datos del centro (PROFESSORAT)
 * - Spreadsheet 2: datos propios de la WebApp
 */

const APP_CONFIG = Object.freeze({
  APP: {
    NAME: 'WebApp d’incidències i compres',
    TIMEZONE: 'Europe/Madrid',
  },

  /**
   * IDs de spreadsheets usados por la WebApp.
   *
   * DB_CENTRE_ID:
   * - contiene la hoja PROFESSORAT
   *
   * WEBAPP_ID:
   * - contiene:
   *   - CONFIG_RESPONSABLES
   *   - INC_TIC
   *   - INC_GENERAL
   *   - COMPRES
   *   - HISTORIC_CANVIS
   */
  SPREADSHEETS: {
  DB_CENTRE_ID: '1P0A6XIjAwQ-UkMHw6ATdjyTjWZV9OCtBBT0u4p9ZZV8',
  WEBAPP_ID: '1LvMxWp0z8EPROYb8gG10nGLjcieAxUORD0t7AfryhOA',
},

  SHEETS: {
    PROFESSORAT: 'PROFESSORAT',
    CONFIG_RESPONSABLES: 'CONFIG_RESPONSABLES',
    INC_TIC: 'INC_TIC',
    INC_GENERAL: 'INC_GENERAL',
    COMPRES: 'COMPRES',
    HISTORIC_CANVIS: 'HISTORIC_CANVIS',
  },

  MODULES: {
    INC_TIC: 'inc_tic',
    INC_GENERAL: 'inc_general',
    COMPRES: 'compres',
  },

  /**
   * Estados permitidos por módulo.
   */
  STATES: {
    inc_tic: Object.freeze([
      'Nou',
      'En procés',
      'Resolta',
    ]),

    inc_general: Object.freeze([
      'Nou',
      'En procés',
      'Resolta',
    ]),

    compres: Object.freeze([
      'Nou',
      'Sol·licitat',
      'Rebut',
      'Problemes',
      'Rebutjada finalment',
    ]),
  },

  /**
   * Estado inicial por módulo.
   */
  INITIAL_STATES: {
    inc_tic: 'Nou',
    inc_general: 'Nou',
    compres: 'Nou',
  },

  /**
   * Estados que disparan notificación por email.
   */
  NOTIFICATION_STATES: {
    inc_tic: Object.freeze([
      'Nou',
      'En procés',
      'Resolta',
    ]),

    inc_general: Object.freeze([
      'Nou',
      'En procés',
      'Resolta',
    ]),

    compres: Object.freeze([
      'Nou',
      'Sol·licitat',
      'Rebut',
      'Problemes',
      'Rebutjada finalment',
    ]),
  },

  /**
   * Prefijos para id_registre e id_canvi.
   */
  ID_PREFIX: {
    inc_tic: 'TIC',
    inc_general: 'GEN',
    compres: 'COM',
  },
});

/**
 * Devuelve true si el módulo es válido.
 * @param {string} modul
 * @returns {boolean}
 */
function isValidModule(modul) {
  const value = String(modul || '').trim().toLowerCase();
  return Object.values(APP_CONFIG.MODULES).includes(value);
}

/**
 * Devuelve true si el estado es válido para el módulo indicado.
 * @param {string} modul
 * @param {string} estat
 * @returns {boolean}
 */
function isValidStateForModule(modul, estat) {
  const modulNorm = String(modul || '').trim().toLowerCase();
  const estatNorm = String(estat || '').trim();

  if (!isValidModule(modulNorm)) {
    return false;
  }

  const allowedStates = APP_CONFIG.STATES[modulNorm] || [];
  return allowedStates.includes(estatNorm);
}

/**
 * Devuelve el estado inicial de un módulo.
 * @param {string} modul
 * @returns {string}
 */
function getInitialState(modul) {
  const modulNorm = String(modul || '').trim().toLowerCase();

  if (!isValidModule(modulNorm)) {
    throw new Error(
      `Mòdul no vàlid per obtenir estat inicial: "${modul}".`
    );
  }

  const initialState = APP_CONFIG.INITIAL_STATES[modulNorm];
  if (!initialState) {
    throw new Error(
      `No hi ha estat inicial configurat per al mòdul "${modulNorm}".`
    );
  }

  return initialState;
}