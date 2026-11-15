/* ============================================================================
   limpeza.js - esvazia uma fatura
   ----------------------------------------------------------------------------
   APAGA (sao valores preenchidos a cada fatura):
     - os valores do emissor, dos dados bancarios e da identificacao;
     - o endereco e o contato do destinatario;
     - as linhas das tabelas de projetos e de custos, e o total;
     - a data ao lado da assinatura.

   MANTEM (sao a estrutura do documento):
     - o titulo, os rotulos e os titulos de coluna;
     - os itens da declaracao "I confirm that:";
     - o traco de assinatura;
     - a quantidade de linhas das tabelas.
   ============================================================================ */

import { esvaziarLinhas, esvaziarValores } from '../../js/limpeza.js';

/**
 * Esvazia a fatura no proprio objeto recebido.
 * @param {object} dados
 */
export function limparFatura(dados) {
  /* Listas de rotulo + valor: o rotulo ("Email:", "IBAN:") e impresso no
     documento e fica; so o valor ao lado e apagado. */
  esvaziarValores(dados.emissor);
  esvaziarValores(dados.pagamento);
  esvaziarValores(dados.fatura);

  dados.destinatario.endereco = '';
  dados.destinatario.contato = '';

  /* Linhas de tabela: todas as colunas sao dados preenchidos */
  esvaziarLinhas(dados.projetos.linhas);
  esvaziarLinhas(dados.custos.linhas);
  dados.custos.total.valor = '';

  /* O rotulo "Date:" fica; so o valor e apagado. Vazio significa "usar a
     data de hoje", que e o comportamento padrao do campo. */
  dados.assinatura.dataValor = '';
}
