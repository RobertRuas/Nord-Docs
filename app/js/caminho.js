/* ============================================================================
   caminho.js - leitura e escrita de valores dentro do objeto de dados
   ----------------------------------------------------------------------------
   Todo campo editavel da pagina guarda, no atributo data-editavel, o "caminho"
   ate o seu valor dentro do dados.json. Exemplos de caminho:

       "titulo"                  -> dados.titulo
       "emissor.0.valor"         -> dados.emissor[0].valor
       "custos.linhas.1.taxa"    -> dados.custos.linhas[1].taxa

   Assim um unico modulo de edicao serve para qualquer campo, sem precisar
   conhecer a estrutura do documento.
   ============================================================================ */

/**
 * Le o valor que esta no fim do caminho.
 * @param {object} objeto   objeto de dados
 * @param {string} caminho  ex.: "custos.linhas.0.valor"
 * @returns {*} o valor encontrado, ou undefined se o caminho nao existir
 */
export function lerCaminho(objeto, caminho) {
  return caminho.split('.').reduce(function (atual, parte) {
    return (atual === null || atual === undefined) ? undefined : atual[parte];
  }, objeto);
}

/**
 * Escreve um valor no fim do caminho.
 * @param {object} objeto   objeto de dados
 * @param {string} caminho  ex.: "custos.linhas.0.valor"
 * @param {*} valor         novo valor
 * @returns {boolean} true se conseguiu escrever
 */
export function escreverCaminho(objeto, caminho, valor) {
  const partes = caminho.split('.');
  const ultima = partes.pop();

  /* Caminha ate o objeto que contem o campo final */
  const alvo = partes.reduce(function (atual, parte) {
    return (atual === null || atual === undefined) ? undefined : atual[parte];
  }, objeto);

  if (alvo === null || alvo === undefined) {
    return false;
  }
  alvo[ultima] = valor;
  return true;
}
