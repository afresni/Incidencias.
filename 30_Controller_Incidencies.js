/**
 * 30_Controller_Incidencies.gs
 * Controlador público para frontend (módulos de incidencias):
 * - inc_tic
 * - inc_general
 *
 * Funciona como puente limpio entre cliente y 22_Service_Incidencies.gs.
 * Sin lógica de interfaz.
 */

/**
 * Crea una incidencia en el módulo indicado.
 * @param {string} modul - inc_tic | inc_general
 * @param {Object} payload
 * @returns {Object}
 */
function controllerIncidencies_create(modul, payload) {
  return incidenciesService_create(modul, payload || {});
}

/**
 * Obtiene una incidencia por ID en el módulo indicado.
 * @param {string} modul - inc_tic | inc_general
 * @param {string} idRegistre
 * @returns {Object|null}
 */
function controllerIncidencies_getById(modul, idRegistre) {
  return incidenciesService_getById(modul, idRegistre);
}

/**
 * Lista incidencias del módulo indicado con filtros opcionales.
 * @param {string} modul - inc_tic | inc_general
 * @param {Object=} filters
 * @returns {Array<Object>}
 */
function controllerIncidencies_list(modul, filters) {
  return incidenciesService_list(modul, filters || {});
}

/**
 * Cambia el estado de una incidencia.
 * @param {string} modul - inc_tic | inc_general
 * @param {string} idRegistre
 * @param {string} newState
 * @returns {Object}
 */
function controllerIncidencies_changeState(modul, idRegistre, newState) {
  return incidenciesService_changeState(modul, idRegistre, newState);
}