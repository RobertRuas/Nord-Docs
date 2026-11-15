/* ============================================================================
   limpeza.js - ajudantes para esvaziar os dados
   ----------------------------------------------------------------------------
   Limpar um documento e apagar os VALORES mantendo a ESTRUTURA: os rotulos,
   os titulos de coluna, os textos fixos e a quantidade de linhas continuam
   como estao, para que a aparencia do documento nao mude.

   O que e valor e o que e estrutura varia de um tipo de documento para o
   outro, entao cada tipo tem o seu proprio limpeza.js em /app/tipos. Aqui
   ficam apenas as duas operacoes comuns aos dois.
   ============================================================================ */

/**
 * Esvazia um registro inteiro: todos os campos de texto viram "".
 * Usada nas LINHAS DE TABELA, em que cada coluna e um dado preenchido.
 * @param {object} registro
 */
function esvaziarRegistro(registro) {
  Object.keys(registro).forEach(function (chave) {
    if (typeof registro[chave] === 'string') {
      registro[chave] = '';
    }
  });
}

/**
 * Esvazia todos os registros de uma lista, preservando a quantidade de
 * linhas - e isso que mantem a altura e o desenho das tabelas.
 * @param {Array<object>} lista  ex.: as linhas da tabela de custos
 */
export function esvaziarLinhas(lista) {
  (lista || []).forEach(esvaziarRegistro);
}

/**
 * Esvazia apenas a chave "valor" de cada item.
 *
 * Usada nas listas de ROTULO + VALOR, como "Email: contato@exemplo.com":
 * ali o rotulo faz parte do documento impresso e precisa continuar la;
 * so o valor ao lado e que e preenchido a cada uso.
 *
 * @param {Array<{rotulo: string, valor: string}>} lista
 */
export function esvaziarValores(lista) {
  (lista || []).forEach(function (item) {
    item.valor = '';
  });
}
