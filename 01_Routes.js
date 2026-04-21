/**
 * 01_Routes.gs
 * Punto de entrada de la WebApp (V1).
 *
 * Alcance V1:
 * - HTMLService
 * - Vista principal: AppShell.html
 * - Sin routing interno complejo
 */

/**
 * Entrada principal de la WebApp.
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet() {
  return HtmlService
    .createTemplateFromFile('AppShell')
    .evaluate()
    .setTitle(APP_CONFIG.APP.NAME || 'Incidències WebApp')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
