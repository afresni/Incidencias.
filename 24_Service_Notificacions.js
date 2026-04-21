/**
 * 24_Service_Notificacions.gs
 * Servicio de notificaciones por correo (V1).
 *
 * Alcance V1:
 * - Enviar notificación al solicitante en:
 *   - creación (estado inicial)
 *   - cambios de estado relevantes por módulo
 * - No gestiona plantillas complejas.
 */

/**
 * Normaliza string.
 * @param {*} value
 * @returns {string}
 */
function notif_normalizeString_(value) {
  return String(value || '').trim();
}

/**
 * Normaliza email.
 * @param {*} email
 * @returns {string}
 */
function notif_normalizeEmail_(email) {
  return notif_normalizeString_(email).toLowerCase();
}

/**
 * Valida email básico.
 * @param {string} email
 * @returns {boolean}
 */
function notif_isValidEmail_(email) {
  const e = notif_normalizeEmail_(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Devuelve true si el estado requiere notificación para el módulo.
 * Basado en APP_CONFIG.NOTIFICATION_STATES.
 * @param {string} modul
 * @param {string} estat
 * @returns {boolean}
 */
function notif_shouldNotifyForState_(modul, estat) {
  const modulNorm = String(modul || '').trim().toLowerCase();
  const estatNorm = notif_normalizeString_(estat);

  if (!isValidModule(modulNorm)) return false;
  const allowed = APP_CONFIG.NOTIFICATION_STATES[modulNorm] || [];
  return allowed.includes(estatNorm);
}

/**
 * Etiqueta humana del módulo para asunto/cuerpo.
 * @param {string} modul
 * @returns {string}
 */
function notif_moduleLabel_(modul) {
  const m = String(modul || '').trim().toLowerCase();
  if (m === APP_CONFIG.MODULES.INC_TIC) return 'Incidències TIC';
  if (m === APP_CONFIG.MODULES.INC_GENERAL) return 'Incidències generals';
  if (m === APP_CONFIG.MODULES.COMPRES) return 'Compres';
  return m;
}

/**
 * Construye una descripción breve según módulo.
 * @param {string} modul
 * @param {Object} record
 * @returns {string}
 */
function notif_buildItemSummary_(modul, record) {
  const m = String(modul || '').trim().toLowerCase();
  const r = record || {};

  if (m === APP_CONFIG.MODULES.COMPRES) {
    return notif_normalizeString_(r.material_sollicitat) || '(sense detall)';
  }

  return notif_normalizeString_(r.descripcio) || '(sense detall)';
}

/**
 * Envía correo simple.
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} body
 */
function notif_sendMail_(toEmail, subject, body) {
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    body: body,
  });
}

/**
 * Envía notificación de creación.
 * Solo envía si el estado actual está configurado para notificar.
 *
 * @param {string} modul - inc_tic | inc_general | compres
 * @param {Object} record - registro ya creado
 *   Campos esperados mínimos:
 *   - id_registre
 *   - email_sollicitant
 *   - estat
 *   - data_ultima_actualitzacio (opcional)
 *   - descripcio o material_sollicitat
 * @returns {boolean} true si envía, false si no aplica
 */
function notificacions_notifyCreation(modul, record) {
  const modulNorm = String(modul || '').trim().toLowerCase();
  const r = record || {};

  if (!isValidModule(modulNorm)) {
    throw new Error(`Mòdul no vàlid per notificació: "${modul}".`);
  }

  const toEmail = notif_normalizeEmail_(r.email_sollicitant);
  const estat = notif_normalizeString_(r.estat);
  const idRegistre = notif_normalizeString_(r.id_registre);

  if (!notif_isValidEmail_(toEmail)) {
    throw new Error(`Email del sol·licitant no vàlid per notificació: "${r.email_sollicitant}".`);
  }

  if (!idRegistre) {
    throw new Error('No es pot notificar: falta "id_registre".');
  }

  if (!notif_shouldNotifyForState_(modulNorm, estat)) {
    return false;
  }

  const moduleLabel = notif_moduleLabel_(modulNorm);
  const summary = notif_buildItemSummary_(modulNorm, r);
  const updatedAt = notif_normalizeString_(r.data_ultima_actualitzacio) || '(no informat)';

  const subject = `[${moduleLabel}] ${idRegistre} · ${estat}`;
  const body =
    `S'ha creat un registre nou.\n\n` +
    `Mòdul: ${moduleLabel}\n` +
    `ID: ${idRegistre}\n` +
    `Estat: ${estat}\n` +
    `Detall: ${summary}\n` +
    `Última actualització: ${updatedAt}\n`;

  notif_sendMail_(toEmail, subject, body);
  return true;
}

/**
 * Envía notificación de cambio de estado.
 * Solo envía si:
 * - hay cambio real (oldState !== newState)
 * - el nuevo estado está configurado para notificar
 *
 * @param {string} modul - inc_tic | inc_general | compres
 * @param {Object} record - registro actualizado
 *   Campos esperados mínimos:
 *   - id_registre
 *   - email_sollicitant
 *   - estat (nuevo)
 *   - data_ultima_actualitzacio (opcional)
 *   - descripcio o material_sollicitat
 * @param {string} oldState
 * @param {string} newState
 * @returns {boolean} true si envía, false si no aplica
 */
function notificacions_notifyStateChange(modul, record, oldState, newState) {
  const modulNorm = String(modul || '').trim().toLowerCase();
  const r = record || {};

  if (!isValidModule(modulNorm)) {
    throw new Error(`Mòdul no vàlid per notificació: "${modul}".`);
  }

  const oldS = notif_normalizeString_(oldState);
  const newS = notif_normalizeString_(newState);

  // Evitar duplicados cuando no hay cambio real
  if (oldS === newS) {
    return false;
  }

  // Validación de estado por módulo (reutiliza config central)
  if (!isValidStateForModule(modulNorm, newS)) {
    throw new Error(`Estat nou no vàlid per al mòdul "${modulNorm}": "${newState}".`);
  }

  if (!notif_shouldNotifyForState_(modulNorm, newS)) {
    return false;
  }

  const toEmail = notif_normalizeEmail_(r.email_sollicitant);
  const idRegistre = notif_normalizeString_(r.id_registre);

  if (!notif_isValidEmail_(toEmail)) {
    throw new Error(`Email del sol·licitant no vàlid per notificació: "${r.email_sollicitant}".`);
  }

  if (!idRegistre) {
    throw new Error('No es pot notificar: falta "id_registre".');
  }

  const moduleLabel = notif_moduleLabel_(modulNorm);
  const summary = notif_buildItemSummary_(modulNorm, r);
  const updatedAt = notif_normalizeString_(r.data_ultima_actualitzacio) || '(no informat)';

  const subject = `[${moduleLabel}] ${idRegistre} · ${newS}`;
  const body =
    `Hi ha una actualització del teu registre.\n\n` +
    `Mòdul: ${moduleLabel}\n` +
    `ID: ${idRegistre}\n` +
    `Estat anterior: ${oldS || '(no informat)'}\n` +
    `Estat nou: ${newS}\n` +
    `Detall: ${summary}\n` +
    `Última actualització: ${updatedAt}\n`;

  notif_sendMail_(toEmail, subject, body);
  return true;
}