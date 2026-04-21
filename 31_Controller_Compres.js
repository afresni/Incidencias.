/**
 * 31_Controller_Compres.gs
 * Controlador público para frontend (módulo compres).
 *
 * Puente limpio entre cliente y 23_Service_Compres.gs.
 * Sin lógica de interfaz.
 */

/**
 * Crea una solicitud de compra.
 * @param {Object} payload
 * @returns {Object}
 */
function controllerCompres_create(payload) {
  return compresService_create(payload || {});
}

/**
 * Obtiene una solicitud de compra por ID.
 * @param {string} idRegistre
 * @returns {Object|null}
 */
function controllerCompres_getById(idRegistre) {
  return compresService_getById(idRegistre);
}

/**
 * Lista solicitudes de compra con filtros opcionales.
 * @param {Object=} filters
 * @returns {Array<Object>}
 */
function controllerCompres_list(filters) {
  return compresService_list(filters || {});
}

/**
 * Cambia el estado de una solicitud de compra.
 * @param {string} idRegistre
 * @param {string} newState
 * @returns {Object}
 */
function controllerCompres_changeState(idRegistre, newState) {
  return compresService_changeState(idRegistre, newState);
}