# WebApp incidències i compres

WebApp interna del centre per gestionar:

- incidències TIC
- incidències generals
- sol·licituds de compra

## Tecnologia

- Google Apps Script
- Google Sheets
- HTMLService
- Gmail (notificacions per correu)

## Estructura general

### Configuració
- `00_Config.gs`
- `appsscript.json`

### Rutes
- `01_Routes.gs`

### Repositoris
- `10_Repo_Professorat.gs`
- `11_Repo_ConfigResponsables.gs`
- `12_Repo_Incidencies.gs`
- `13_Repo_Compres.gs`
- `14_Repo_Historic.gs`

### Serveis
- `20_Service_AuthContext.gs`
- `21_Service_Validators.gs`
- `22_Service_Incidencies.gs`
- `23_Service_Compres.gs`
- `24_Service_Notificacions.gs`
- `25_Service_IdGenerator.gs`

### Controladors
- `30_Controller_Incidencies.gs`
- `31_Controller_Compres.gs`
- `32_Controller_Common.gs`

### Interfície
- `AppShell.html`
- `Styles.html`
- `Client_API.html`
- `Client_App.html`
- `View_Home.html`
- `View_Incidencies.html`
- `View_Compres.html`

## Estat actual

Projecte en desenvolupament i proves.

Objectius actuals:
- estabilitzar configuració entre spreadsheets
- validar integració entre backend i frontend
- revisar coherència general del projecte
- preparar millores funcionals futures

## Millores previstes

No aplicades encara:
- `espai` com a desplegable a incidències
- substituir `espai` per correu electrònic a compres
- millorar navegació i experiència d’usuari
- revisar permisos i visibilitat de registres per perfil

## Notes

Aquest repositori correspon a una WebApp interna del centre i s’ha de mantenir amb criteris de:
- simplicitat
- traçabilitat
- manteniment
- escalabilitat