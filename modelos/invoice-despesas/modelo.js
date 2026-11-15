/* ============================================================================
   modelo.js - configuracao do modelo "Invoice de Despesas"
   ----------------------------------------------------------------------------
   Um modelo e so isto: a sua configuracao e a funcao que o desenha.
   Todo o comportamento (carregar, editar, importar, exportar, gerar PDF)
   vem de /app/js, e o desenho vem de /app/tipos/fatura.
   ============================================================================ */

import { iniciarAplicacao } from '../../app/js/aplicacao.js';
import { montarFatura, numeroDaFatura, SECOES } from '../../app/tipos/fatura/montagem.js';
import { limparFatura } from '../../app/tipos/fatura/limpeza.js';

iniciarAplicacao({
  arquivoDados: 'dados.json',
  chaveRascunho: 'nord-rascunho-invoice-despesas',
  secoesObrigatorias: SECOES,
  raiz: document.getElementById('documento'),
  montar: montarFatura,

  /* Nome do JSON exportado e do PDF, ex.: "Invoice-014-Despesas" */
  /* Esvazia os valores e mantem rotulos, colunas e linhas no lugar */
  limpar: limparFatura,

  nomeArquivo: function (dados) {
    return 'Invoice ' + numeroDaFatura(dados) + ' Despesas';
  }
});
