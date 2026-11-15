/* ============================================================================
   datas.js - formatacao de datas
   ----------------------------------------------------------------------------
   Os documentos usam o formato dd/mm/aaaa, o mesmo do Word e do Excel
   originais. Todas as contas sao feitas em UTC para que o fuso horario do
   computador nunca empurre uma data para o dia anterior ou seguinte.
   ============================================================================ */

/**
 * Formata uma data no padrao dd/mm/aaaa.
 * @param {Date} data
 * @returns {string}
 */
export function formatarData(data) {
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  return dia + '/' + mes + '/' + data.getUTCFullYear();
}

/**
 * Data de hoje, ja formatada.
 * @returns {string} ex.: '15/11/2026'
 */
export function hojeFormatado() {
  const agora = new Date();

  /* Converte a data LOCAL para UTC antes de formatar: assim o resultado e
     sempre o dia do calendario de quem esta usando o computador. */
  return formatarData(new Date(Date.UTC(
    agora.getFullYear(), agora.getMonth(), agora.getDate()
  )));
}

/** @returns {number} o ano corrente */
export function anoAtual() {
  return new Date().getFullYear();
}
