/**
 * 22_Service_Incidencies.gs
 * Lógica de negocio para:
 * - inc_tic
 * - inc_general
 *
 * Sin lógica de interfaz (V1).
 */

/**
 * Normaliza string (trim).
 * @param {*} value
 * @returns {string}
 */
function incidencies_normalizeString_(value) {
  return String(value || '').trim();
}

/**
 * Devuelve true si el módulo pertenece a incidencias.
 * @param {string} modul
 * @returns {boolean}
 */
function incidencies_isIncidenciesModule_(modul) {
  return (
    modul === APP_CONFIG.MODULES.INC_TIC ||
    modul === APP_CONFIG.MODULES.INC_GENERAL
  );
}

/**
 * Valida módulo de incidencias (inc_tic / inc_general).
 * @param {string} modul
 * @returns {string} módulo normalizado y validado
 */
function incidencies_requireValidModule_(modul) {
  const modulNorm = validators_requireValidModule(modul);

  if (!incidencies_isIncidenciesModule_(modulNorm)) {
    throw new Error(
      `Mòdul no vàlid per al servei d'incidències: "${modulNorm}".`
    );
  }

  return modulNorm;
}

/**
 * Construye registro de incidencia con campos autogenerados.
 * @param {string} modul
 * @param {Object} cleanPayload
 * @param {Object} userCtx
 * @param {string} responsableEmail
 * @returns {Object}
 */
function incidencies_buildNewRecord_(modul, cleanPayload, userCtx, responsableEmail) {
  const now = new Date();
  const initialState = getInitialState(modul); // de 00_Config.gs

  return {
    id_registre: idGenerator_next(modul),
    data_creacio: now,
    email_sollicitant: incidencies_normalizeString_(userCtx.email).toLowerCase(),
    docent_sollicitant_nom: incidencies_normalizeString_(userCtx.nom_complet),
    espai: incidencies_normalizeString_(cleanPayload.espai),
    element_afectat: incidencies_normalizeString_(cleanPayload.element_afectat),
    descripcio: incidencies_normalizeString_(cleanPayload.descripcio),
    observacions: incidencies_normalizeString_(cleanPayload.observacions),
    estat: initialState, // Nou
    responsable_email: incidencies_normalizeString_(responsableEmail).toLowerCase(),
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
function incidencies_writeHistoric_(params) {
  const p = params || {};
  const modul = incidencies_normalizeString_(p.modul).toLowerCase();

  repoHistoric_insert({
    id_canvi: idGenerator_next(modul), // opción simple/coherente V1
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
 * Crea una incidencia (inc_tic / inc_general).
 *
 * Flujo:
 * - validar módulo
 * - validar payload
 * - obtener usuario actual activo
 * - resolver responsable del módulo
 * - generar registro con autogenerados
 * - guardar en repositorio
 * - registrar histórico (creación + estado inicial)
 * - enviar notificación de creación
 *
 * Depende de:
 * - validators_validateIncidenciaPayload
 * - authContext_requireActiveUser
 * - repoConfigResponsables_getActiveResponsibleEmailByModule
 * - idGenerator_next
 * - repoIncidencies_insert(modul, record)
 * - repoHistoric_insert(changeObj)
 * - notificacions_notifyCreation
 *
 * @param {string} modul - inc_tic | inc_general
 * @param {Object} payload
 * @returns {Object} registro creado
 */
function incidenciesService_create(modul, payload) {
  const modulNorm = incidencies_requireValidModule_(modul);
  const cleanPayload = validators_validateIncidenciaPayload(payload);
  const userCtx = authContext_requireActiveUser();

  const responsableEmail =
    repoConfigResponsables_getActiveResponsibleEmailByModule(modulNorm);

  const record = incidencies_buildNewRecord_(
    modulNorm,
    cleanPayload,
    userCtx,
    responsableEmail
  );

  // Guardar en hoja INC_TIC o INC_GENERAL según módulo
  repoIncidencies_insert(modulNorm, record);

  // Histórico: creación del registro
  incidencies_writeHistoric_({
    modul: modulNorm,
    id_registre: record.id_registre,
    usuari_email: userCtx.email,
    usuari_nom: userCtx.nom_complet,
    camp_modificat: 'registre',
    valor_anterior: '',
    valor_nou: 'creat',
    comentari: 'Creació de la incidència',
  });

  // Histórico: estado inicial
  incidencies_writeHistoric_({
    modul: modulNorm,
    id_registre: record.id_registre,
    usuari_email: userCtx.email,
    usuari_nom: userCtx.nom_complet,
    camp_modificat: 'estat',
    valor_anterior: '',
    valor_nou: record.estat,
    comentari: 'Estat inicial',
  });

  // Notificación creación
  notificacions_notifyCreation(modulNorm, record);

  return record;
}

/**
 * Cambia el estado de una incidencia.
 *
 * Flujo:
 * - validar módulo
 * - validar estado nuevo permitido
 * - obtener usuario actual activo
 * - leer registro actual
 * - si no hay cambio real de estado: devolver registro actual sin tocar nada
 * - actualizar estado en repositorio
 * - registrar histórico del cambio
 * - enviar notificación si aplica
 *
 * Depende de:
 * - validators_requireValidStateForModule
 * - authContext_requireActiveUser
 * - repoIncidencies_getById(modul, idRegistre)
 * - repoIncidencies_updateState(modul, idRegistre, newState, updatedAt)
 * - repoHistoric_insert(changeObj)
 * - notificacions_notifyStateChange
 *
 * @param {string} modul - inc_tic | inc_general
 * @param {string} idRegistre
 * @param {string} newState
 * @returns {Object} registro actualizado o actual sin cambios
 */
function incidenciesService_changeState(modul, idRegistre, newState) {
  const modulNorm = incidencies_requireValidModule_(modul);
  const idNorm = incidencies_normalizeString_(idRegistre);

  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  const newStateValid = validators_requireValidStateForModule(modulNorm, newState);
  const userCtx = authContext_requireActiveUser();

  const current = repoIncidencies_getById(modulNorm, idNorm);
  if (!current) {
    throw new Error(`No s'ha trobat el registre "${idNorm}" al mòdul "${modulNorm}".`);
  }

  const oldState = incidencies_normalizeString_(current.estat);

  // Si no hay cambio real, no hacer nada más
  if (oldState === newStateValid) {
    return current;
  }

  const now = new Date();
  const updated = repoIncidencies_updateState(modulNorm, idNorm, newStateValid, now);

  incidencies_writeHistoric_({
    modul: modulNorm,
    id_registre: idNorm,
    usuari_email: userCtx.email,
    usuari_nom: userCtx.nom_complet,
    camp_modificat: 'estat',
    valor_anterior: oldState,
    valor_nou: newStateValid,
    comentari: 'Canvi d\'estat',
  });

  notificacions_notifyStateChange(modulNorm, updated, oldState, newStateValid);

  return updated;
}

/**
 * Obtiene un registro por módulo e ID.
 * @param {string} modul
 * @param {string} idRegistre
 * @returns {Object|null}
 */
function incidenciesService_getById(modul, idRegistre) {
  const modulNorm = incidencies_requireValidModule_(modul);
  const idNorm = incidencies_normalizeString_(idRegistre);

  if (!idNorm) {
    throw new Error('El camp "id_registre" és obligatori.');
  }

  return repoIncidencies_getById(modulNorm, idNorm);
}

/**
 * Lista incidencias por módulo (filtro opcional).
 * @param {string} modul
 * @param {Object=} filters
 * @returns {Array<Object>}
 */
function incidenciesService_list(modul, filters) {
  const modulNorm = incidencies_requireValidModule_(modul);
  return repoIncidencies_list(modulNorm, filters || {});
}