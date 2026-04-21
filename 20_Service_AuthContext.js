/**
 * 20_Service_AuthContext.gs
 * Servicio de contexto de autenticación/usuario (V1).
 *
 * Objetivo:
 * - Obtener email de sesión
 * - Resolver datos mínimos de usuario en PROFESSORAT
 * - Verificar usuario activo
 * - Devolver contexto limpio para servicios/controladores
 *
 * Sin lógica de roles en V1.
 */

/**
 * Normaliza email (trim + minúsculas).
 * @param {string} email
 * @returns {string}
 */
function authContext_normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Obtiene el email del usuario actual desde la sesión.
 * Lanza error si no puede resolverse.
 * @returns {string}
 */
function authContext_getSessionEmail() {
  const email = authContext_normalizeEmail_(Session.getActiveUser().getEmail());

  if (!email) {
    throw new Error(
      'No s’ha pogut obtenir l’email de sessió. ' +
      'Verifica que la WebApp estigui desplegada dins del domini i amb accés correcte.'
    );
  }

  return email;
}

/**
 * Obtiene y valida el contexto del usuario actual.
 * Reglas:
 * - Debe existir email de sesión
 * - Debe existir en PROFESSORAT como activo
 *
 * Estructura devuelta:
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
function authContext_getCurrentUserContext() {
  const email = authContext_getSessionEmail();

  // repoProfessorat_getActiveByEmail devuelve null si no existe activo
  const user = repoProfessorat_getActiveByEmail(email);

  if (!user) {
    throw new Error(
      `L’usuari "${email}" no existeix com a actiu a la fulla PROFESSORAT.`
    );
  }

  if (user.actiu !== true) {
    throw new Error(
      `L’usuari "${email}" no està actiu a PROFESSORAT.`
    );
  }

  return {
    email: authContext_normalizeEmail_(user.email),
    nom: String(user.nom || '').trim(),
    llinatges: String(user.llinatges || '').trim(),
    nom_complet: String(user.nom_complet || '').trim(),
    actiu: true,
  };
}

/**
 * Alias semántico para servicios/controladores.
 * @returns {{
 *   email: string,
 *   nom: string,
 *   llinatges: string,
 *   nom_complet: string,
 *   actiu: boolean
 * }}
 */
function authContext_requireActiveUser() {
  return authContext_getCurrentUserContext();
}