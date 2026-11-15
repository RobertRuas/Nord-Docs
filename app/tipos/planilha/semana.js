/* ============================================================================
   semana.js - o numero da semana manda nas datas da planilha
   ----------------------------------------------------------------------------
   Na planilha original as datas dos sete dias nao eram digitadas: eram
   calculadas por formula a partir do numero da semana. Este modulo faz a
   mesma coisa, usando o padrao ISO-8601.

   ISO-8601 em duas regras:
     - a semana comeca na segunda-feira;
     - a semana 1 e a que contem a primeira quinta-feira do ano (ou, dito de
       outro modo, a que contem o dia 4 de janeiro).

   Um ano ISO tem 52 ou 53 semanas, e este modulo valida o numero digitado
   contra o ano do documento - semana 53 em um ano de 52 semanas e recusada.
   ============================================================================ */

import { formatarData } from '../../js/datas.js';

/** Rotulo do campo que guarda o numero da semana na planilha */
const ROTULO_SEMANA = 'Week';

/**
 * Quantas semanas o ano ISO tem.
 * Sao 53 quando 1 de janeiro cai numa quinta, ou numa quarta em ano bissexto.
 * @param {number} ano
 * @returns {number} 52 ou 53
 */
export function semanasNoAno(ano) {
  const primeiroDeJaneiro = new Date(Date.UTC(ano, 0, 1)).getUTCDay();
  const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;

  return (primeiroDeJaneiro === 4 || (bissexto && primeiroDeJaneiro === 3)) ? 53 : 52;
}

/**
 * Segunda-feira de uma semana ISO.
 * @param {number} ano
 * @param {number} semana
 * @returns {Date}
 */
function segundaFeiraDaSemana(ano, semana) {
  /* O dia 4 de janeiro cai sempre na semana 1, qualquer que seja o ano */
  const quatroDeJaneiro = new Date(Date.UTC(ano, 0, 4));

  /* Quantos dias o dia 4 esta depois da segunda-feira da sua semana */
  const diasDesdeSegunda = (quatroDeJaneiro.getUTCDay() + 6) % 7;

  const segunda = new Date(quatroDeJaneiro);
  segunda.setUTCDate(quatroDeJaneiro.getUTCDate() - diasDesdeSegunda + (semana - 1) * 7);
  return segunda;
}

/**
 * As sete datas de uma semana, de segunda a domingo.
 * @param {number} ano
 * @param {number} semana
 * @returns {Array<string>} datas no formato dd/mm/aaaa
 */
export function datasDaSemana(ano, semana) {
  const segunda = segundaFeiraDaSemana(ano, semana);

  return Array.from({ length: 7 }, function (_vazio, deslocamento) {
    const dia = new Date(segunda);
    dia.setUTCDate(segunda.getUTCDate() + deslocamento);
    return formatarData(dia);
  });
}

/**
 * Localiza o campo da semana dentro da identificacao do trabalho.
 * @param {object} dados
 * @returns {object|undefined}
 */
function campoDaSemana(dados) {
  return (dados.identificacao || []).find(function (campo) {
    return campo.rotulo === ROTULO_SEMANA;
  });
}

/**
 * Confere o numero da semana informado no documento.
 * @param {object} dados
 * @returns {{valida: boolean, numero: number|null, mensagem: string}}
 */
export function validarSemana(dados) {
  const campo = campoDaSemana(dados);
  const bruto = campo ? String(campo.valor).trim() : '';
  const total = semanasNoAno(dados.ano);

  if (bruto === '') {
    return {
      valida: false, numero: null,
      mensagem: 'Informe o numero da semana (campo "Week") para preencher os dias.'
    };
  }
  if (!/^\d+$/.test(bruto)) {
    return {
      valida: false, numero: null,
      mensagem: 'A semana deve ser um numero inteiro. Valor informado: "' + bruto + '".'
    };
  }

  const numero = Number(bruto);
  if (numero < 1 || numero > total) {
    return {
      valida: false, numero: null,
      mensagem: 'O ano de ' + dados.ano + ' tem ' + total +
                ' semanas. Valor informado: ' + numero + '.'
    };
  }
  return { valida: true, numero: numero, mensagem: '' };
}

/**
 * Valida a semana e, quando ela esta correta, grava as sete datas nos dias.
 *
 * E chamada antes de cada desenho da planilha, entao basta digitar uma
 * semana nova para as datas dos sete blocos acompanharem.
 *
 * @param {object} dados
 * @returns {{valida: boolean, numero: number|null, mensagem: string}}
 */
export function aplicarSemana(dados) {
  const resultado = validarSemana(dados);

  if (resultado.valida) {
    const datas = datasDaSemana(dados.ano, resultado.numero);
    dados.dias.forEach(function (dia, indice) {
      dia.data = datas[indice];
    });
  }
  return resultado;
}
