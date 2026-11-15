/* ============================================================================
   pdf.js - geracao do PDF
   ----------------------------------------------------------------------------
   O PDF e gerado pelo proprio navegador, atraves da janela de impressao
   ("Salvar como PDF" / "Destino: PDF").

   Por que este caminho e nao uma biblioteca externa:
     - o texto sai como TEXTO de verdade no PDF (pesquisavel, selecionavel,
       nitido em qualquer zoom), e nao como uma imagem rasterizada;
     - o tamanho de pagina, as margens e as medidas em pontos definidos no
       CSS sao respeitados exatamente, que e o requisito destes documentos;
     - nao depende de internet nem de nenhuma biblioteca de terceiros.

   O que este modulo faz alem de chamar a impressao: prepara a pagina antes
   (sai do modo de edicao, esconde a interface) e devolve tudo ao normal
   depois, usando os eventos beforeprint/afterprint do navegador.
   ============================================================================ */

/**
 * Abre a janela de impressao do navegador para salvar o documento em PDF.
 * @param {{preparar?: function(): void, restaurar?: function(): void,
 *          nomeSugerido?: string}} [opcoes]
 *        preparar     -> executado antes de imprimir (ex.: sair da edicao)
 *        restaurar    -> executado depois de imprimir
 *        nomeSugerido -> vira o nome sugerido do arquivo PDF, porque os
 *                        navegadores usam o titulo da pagina para isso
 */
export function gerarPdf(opcoes) {
  const config = opcoes || {};
  const tituloOriginal = document.title;

  if (typeof config.preparar === 'function') {
    config.preparar();
  }
  if (config.nomeSugerido) {
    document.title = config.nomeSugerido;
  }

  /* Devolve a pagina ao estado normal assim que a impressao termina ou e
     cancelada. O evento afterprint cobre os dois casos. */
  function aoTerminar() {
    window.removeEventListener('afterprint', aoTerminar);
    document.title = tituloOriginal;
    if (typeof config.restaurar === 'function') {
      config.restaurar();
    }
  }
  window.addEventListener('afterprint', aoTerminar);

  /* Um quadro de animacao de espera garante que o navegador ja aplicou as
     mudancas de "preparar" antes de montar a previa de impressao. */
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.print();
    });
  });
}
