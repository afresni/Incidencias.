/**
 * 23_Service_Compres.gs
 * Lógica de negocio para:
 * - compres
 *
 * Sin lógica de interfaz (V1).
 */

/**
 * Normaliza string (trim).
 * @param {*} value
 * @returns {string}
 */
function compres_normalizeString_(value) {
  return String(value || '').trim();
}

/**
 * Valida módulo compres.
 * @param {string} modul
 * @returns {string} módulo normalizado y validado
 */
function compres_requireValidModule_(modul) {
  const modulNorm = validators_requireValidModule(modul);

  if (modulNorm !== APP_CONFIG.MODULES.COMPRES) {
    throw new Error(
      `Mòdul no vàlid per al servei de compres: "${modulNorm}".`
    );
  }

  return modulNorm;
}

/**
 * Construye registro de compra con campos autogenerados.
 * @param {Object} cleanPayload
 * @param {Object} userCtx
 * @param {string} responsableEmail
 * @returns {Object}
 */
function compres_buildNewRecord_(cleanPayload, userCtx, responsableEmail) {
  const modul = APP_CONFIG.MODULES.COMPRES;
  const now = new Date();
  const initialState = getInitialState(modul); // Nou

  return {
    id_registre: idGenerator_next(modul),
    data_creacio: now,
    email_sollicitant: compres_normalizeString_(userCtx.email).toLowerCase(),
    docent_sollicitant_nom: compres_normalizeString_(userCtx.nom_complet),
    material_sollicitat: compres_normalizeString_(cleanPayload.material_sollicitat),
    espai: compres_normalizeString_(cleanPayload.espai),
    enllac_referencia: compres_normalizeString_(cleanPayload.enllac_referencia),
    observacions: compres_normalizeString_(cleanPayload.observacions),
    estat: initialState,
    responsable_email: compres_normalizeString_(responsableEmail).toLowerCase(),
    data_ultima_actualitzacio: now,
  };
}

/**
 * Registra evento en HISTORIC_CANVIS.
 * Respeta únicamente columnas cerradas de la hoja.
 *
 * Depende de 14_Repo_Historic.gs:
 * - repoHistoric_insert(changeObj)
 *
 * @param {Object} params
 */
function compres_writeHistoric_(params) {
  const p = params || {};
  const modul = APP_CONFIG.MODULES.COMPRES;

  repoHistoric_insert({
    id_canvi: idGenerator_next(modul),
    data_hora: new Date(),
    modul: modul,
    id_registre: p.id_registre,
    usuari_email: p.usuari_email,
    usuari_nom: p.usuari_nom,
    camp_modificat: p.camp_modificat,
    valor_anterior: p.valor_anterior,
    valor_nou: p.valor_nou,
    comentari: p.comentari || '',
  });
}

/**
 * Crea una solicitud de compra.
 *
 * Flujo:
 * - validar módulo compres
 * - validar payload
 * - obtener usuario actual activo
 * - resolver responsable del módulo compres
 * - generar registro con autogenerados
 * - guardar en repositorio
 * - registrar histórico (creación + estado inicial)
 * - enviar notificación de creación
 *
 * Depende de:
 * - validators_validateCompresPayload
 * - authContext_requireActiveUser
 * - repoConfigResponsables_getActiveResponsibleEmailByModule
 * - idGenerator_next
 * - repoCompres_insert(record)
 * - repoHistoric_insert(changeObj)
 * - notificacions_notifyCreation
 *
 * @param {Object} payload
 * @returns {Object} registro creado
 */
function compresService_create(payload) {
  const modul = compres_requireValidModule_(APP_CONFIG.MODULES.COMPRES);
  const cleanPayload = validators_validateCompresPayload(payload);
  const userCtx = authContext_requireActiveUser();

  const responsableEmail =
    repoConfigResponsables_getActiveResponsibleEmailByModule(modul);

  const record = compres_buildNewRecord_(cleanPayload, userCtx, responsableEmail);

  // Guardar en hoja COMPRES
  repoCompres_insert(record);

  // Histórico: creación del registro
  compres_writeHistoric_({
    id_registre: record.id_registre,
    usuari_email: userCtx.email,
    usuari_nom: userCtx.nom_complet,
    camp_modificat: 'registre',
    valor_anterior: '',
    valor_nou: 'creat',
    comentari: 'Creació de la sol·licitud de compra',
  });

  // Histórico: estado inicial
  compres_writeHistoric_({
    id_registre: record.id_registre,
    usuari_email: userCtx.email,
    usuari_nom: userCtx.nom_complet,
    camp_modificat: 'estat',
    valor_anterior: '',
    valor_nou: record.estat,
    comentari: 'Estat inicial',
  });

  // Notificación creación
  notificacions_notifyCreation(modul, record);

  return record;
}

/**
 * Cambia estado de una solicitud de compra.
 *
 * Flujo:
 * - validar módulo compres
 * - validar estado nuevo permitido
 * - obtener usuario actual activo
 * - leer registro actual
 * - si no hay cambio real: devolver actual sin cambios
 * - actualizar estado en repositorio
 * - registrar histórico del cambio
 * - enviar notificación si aplica
 *
 * Depende de:
 * - validators_requireValidStateForModule
 * - authContext_requireActiveUser
 * - repoCompres_getById(idRegistre)
 * - repoCompres_updateState(idRegistre, newState, updatedAt)
 * - repoHistoric_insert(changeObj)
 * - notificacions_notifyStateChange
 *
 * @param {string} idRegistre
 * @param {string} newState
 * @returns {Object} registro actualizado o actual sin cambios
 */
function compresService_changeState(idRegistre, newState) {
  const modul = compres_requireValidModule_(APP_CONFIG.MODULES.COMPRES);
  const idNorm = compres_normalizeString_(idRegistre);

  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  const newStateValid = validators_requireValidStateForModule(modul, newState);
  const userCtx = authContext_requireActiveUser();

  const current = repoCompres_getById(idNorm);
  if (!current) {
    throw new Error(`No s'ha trobat el registre "${idNorm}" al mòdul "${modul}".`);
  }

  const oldState = compres_normalizeString_(current.estat);

  // Si no hay cambio real, no hacer nada más
  if (oldState === newStateValid) {
    return current;
  }

  const now = new Date();
  const updated = repoCompres_updateState(idNorm, newStateValid, now);

  compres_writeHistoric_({
    id_registre: idNorm,
    usuari_email: userCtx.email,
    usuari_nom: userCtx.nom_complet,
    camp_modificat: 'estat',
    valor_anterior: oldState,
    valor_nou: newStateValid,
    comentari: 'Canvi d\'estat',
  });

  notificacions_notifyStateChange(modul, updated, oldState, newStateValid);

  return updated;
}

/**
 * Obtiene una compra por ID.
 * @param {string} idRegistre
 * @returns {Object|null}
 */
function compresService_getById(idRegistre) {
  const idNorm = compres_normalizeString_(idRegistre);

  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  return repoCompres_getById(idNorm);
}

/**
 * Lista compras (filtro opcional).
 * @param {Object=} filters
 * @returns {Array<Object>}
 */
function compresService_list(filters) {
  return repoCompres_list(filters || {});
}