/* ============================================================================
   armazenamento.js - de onde vem e para onde vao os dados
   ----------------------------------------------------------------------------
   Reune tudo que envolve entrada e saida de dados:

     - carregar o dados.json servido junto com a pagina;
     - guardar e recuperar o rascunho das edicoes no proprio navegador;
     - comparar dois conjuntos de dados.

   A importacao e a exportacao de arquivos ficam em js/transferencia.js.

   Por que existe o rascunho: uma pagina aberta no navegador NAO pode gravar
   em um arquivo do disco. Entao as edicoes ficam guardadas no navegador
   (localStorage) para nao se perderem ao recarregar, e a exportacao gera o
   arquivo atualizado para voce substituir na pasta.
   ============================================================================ */

/**
 * Le o arquivo de dados servido junto com a pagina.
 * @param {string} arquivo  ex.: 'dados.json'
 * @returns {Promise<object>}
 */
export async function carregarDoArquivo(arquivo) {
  const resposta = await fetch(arquivo, { cache: 'no-store' });

  /* fetch() so rejeita por erro de rede; um 404 chega aqui como resposta. */
  if (!resposta.ok) {
    throw new Error('Nao foi possivel ler ' + arquivo +
                    ' (codigo ' + resposta.status + ').');
  }
  return resposta.json();
}

/**
 * Le o rascunho guardado no navegador.
 * @param {string} chave  identificador do documento
 * @returns {object|null} dados do rascunho, ou null se nao houver
 */
export function lerRascunho(chave) {
  try {
    const texto = window.localStorage.getItem(chave);
    return texto ? JSON.parse(texto) : null;
  } catch (erro) {
    /* Armazenamento bloqueado ou rascunho corrompido: segue sem rascunho. */
    return null;
  }
}

/**
 * Guarda o rascunho no navegador.
 * @param {string} chave
 * @param {object} dados
 * @returns {boolean} true se conseguiu guardar
 */
export function guardarRascunho(chave, dados) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(dados));
    return true;
  } catch (erro) {
    return false;
  }
}

/**
 * Apaga o rascunho guardado.
 * @param {string} chave
 */
export function apagarRascunho(chave) {
  try {
    window.localStorage.removeItem(chave);
  } catch (erro) {
    /* nada a fazer */
  }
}

/**
 * Compara dois objetos de dados.
 * Usado para saber se o documento foi alterado em relacao ao arquivo.
 * @param {object} a
 * @param {object} b
 * @returns {boolean} true quando sao iguais
 */
export function saoIguais(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
