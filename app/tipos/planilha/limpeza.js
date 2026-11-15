/* ============================================================================
   limpeza.js - esvazia a planilha semanal
   ----------------------------------------------------------------------------
   APAGA (sao valores preenchidos a cada semana):
     - a identificacao do trabalho, incluindo o numero da semana;
     - as datas dos sete dias (voltam sozinhas quando a semana for informada);
     - as linhas de tecnicos e o progresso de cada dia;
     - os campos do bloco de assinaturas.

   MANTEM (sao a estrutura do documento):
     - o titulo e o logotipo;
     - os rotulos dos dias e os titulos das colunas;
     - os rotulos do bloco de assinaturas;
     - o ano do documento e a quantidade de linhas de cada dia.
   ============================================================================ */

import { esvaziarLinhas, esvaziarValores } from '../../js/limpeza.js';

/**
 * Esvazia a planilha no proprio objeto recebido.
 * @param {object} dados
 */
export function limparPlanilha(dados) {
  /* Inclui o numero da semana: sem ele os blocos dos dias nascem travados,
     que e justamente o fluxo desejado em uma folha em branco. */
  esvaziarValores(dados.identificacao);

  dados.dias.forEach(function (dia) {
    dia.data = '';
    dia.progresso = '';
    esvaziarLinhas(dia.tecnicos);
  });

  dados.assinaturas.linhas.forEach(function (linha) {
    linha.valorEsquerda = '';
    linha.valorDireita = '';
  });
}
