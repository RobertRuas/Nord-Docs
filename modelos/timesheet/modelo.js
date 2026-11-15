/* ============================================================================
   modelo.js - configuracao do modelo "Weekly Timesheet"
   ----------------------------------------------------------------------------
   Um modelo e so isto: a sua configuracao e a funcao que o desenha.
   Todo o comportamento (carregar, editar, importar, exportar, gerar PDF) vem
   de /app/js; o desenho, a semana e o zoom vem de /app/tipos/planilha.
   ============================================================================ */

import { iniciarAplicacao } from '../../app/js/aplicacao.js';
import { montarPlanilha, semanaValida, numeroDaSemana, SECOES }
  from '../../app/tipos/planilha/montagem.js';
import { limparPlanilha } from '../../app/tipos/planilha/limpeza.js';
import { iniciarZoom, recalcularZoom } from '../../app/tipos/planilha/zoom.js';

iniciarAplicacao({
  arquivoDados: 'dados.json',
  chaveRascunho: 'nord-rascunho-timesheet',
  secoesObrigatorias: SECOES,
  raiz: document.getElementById('corpo-planilha'),
  montar: montarPlanilha,

  /* Esvazia os valores e mantem rotulos, colunas e linhas no lugar */
  limpar: limparPlanilha,

  /* Nome do JSON exportado e do PDF, ex.: "Timesheet-Semana-45-2026".
     Sem semana informada o nome fica apenas "Timesheet". */
  nomeArquivo: function (dados) {
    const semana = numeroDaSemana();
    return semana ? 'Timesheet Semana ' + semana + ' ' + dados.ano : 'Timesheet';
  },

  /* Os blocos dos sete dias so podem ser editados depois que o numero da
     semana for informado e validado - e dele que saem as datas. */
  campoBloqueado: function (caminho) {
    return caminho.indexOf('dias.') === 0 && !semanaValida();
  },

  /* A planilha muda de altura a cada desenho; o zoom precisa ser refeito
     para que a moldura e as barras de rolagem acompanhem. */
  aoDesenhar: recalcularZoom
});

/* Os botoes de zoom ficam na mesma barra de ferramentas dos demais */
iniciarZoom();
