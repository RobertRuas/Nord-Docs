/* ============================================================================
   nomes.js - nome amigavel dos arquivos gerados
   ----------------------------------------------------------------------------
   O JSON exportado e o PDF salvo recebem um nome montado a partir do proprio
   conteudo do documento - "Invoice-015-Horas", "Timesheet-Semana-45-2026" -
   em vez de um "dados.json" generico. Assim os arquivos continuam
   reconheciveis depois de baixados.

   Cada modelo informa como montar o seu nome na funcao "nomeArquivo" do
   modelo.js; esta funcao so garante que o resultado seja valido como nome
   de arquivo em qualquer sistema.
   ============================================================================ */

/**
 * Transforma um texto em um nome de arquivo seguro.
 * Remove acentos, troca por hifen tudo que nao for letra ou numero e
 * elimina hifens repetidos ou nas pontas.
 * @param {string} texto
 * @returns {string} ex.: 'Invoice-015-Horas'
 */
export function comoNomeDeArquivo(texto) {
  return String(texto)
    .normalize('NFD')                  /* separa a letra do acento      */
    .replace(/[̀-ͯ]/g, '')   /* descarta os acentos           */
    .replace(/[^a-zA-Z0-9]+/g, '-')    /* o resto vira hifen            */
    .replace(/^-+|-+$/g, '')           /* sem hifen no comeco nem no fim */
    || 'documento';                    /* nunca devolve vazio           */
}
