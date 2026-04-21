/**
 * 32_Controller_Common.gs
 * Controlador común mínimo para frontend (V1).
 *
 * Alcance:
 * - Sesión/contexto de usuario actual
 * - Comprobación simple de disponibilidad
 *
 * Sin lógica de roles compleja.
 */

/**
 * Devuelve el contexto limpio del usuario actual.
 * Estructura:
 * - email
 * - nom
 * - llinatges
 * - nom_complet
 * - actiu
 *
 * @returns {{
 *   email: string,
 *   nom: string,
 *   llinatges: string,
 *   nom_complet: string,
 *   actiu: boolean
 * }}
 */
function controllerCommon_getCurrentUser() {
  return authContext_getCurrentUserContext();
}

/**
 * Comprobación simple de que la WebApp responde.
 * @returns {{
 *   ok: boolean,
 *   service: string,
 *   timestamp: Date
 * }}
 */
function controllerCommon_ping() {
  return {
    ok: true,
    service: 'webapp-v1',
    timestamp: new Date(),
  };
}