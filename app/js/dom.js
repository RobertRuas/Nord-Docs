/* ============================================================================
   dom.js - pequenos ajudantes para criar elementos
   ----------------------------------------------------------------------------
   Centraliza a criacao de campos, celulas, linhas e botoes para que os
   modulos de montagem fiquem curtos e legiveis.

   DECISAO IMPORTANTE - por que todo campo editavel e um <span> dentro da
   celula, e nao a celula inteira:

     Na edicao inline, o texto do campo e lido de volta com textContent. Se a
     propria celula fosse o campo, qualquer botao colocado nela (como o "x"
     de remover linha) entraria nessa leitura e sujaria o dado. Com o texto
     isolado em um <span>, a celula fica livre para receber controles.

     O <span> usa display:block para ocupar a celula inteira, de modo que
     clicar em qualquer ponto da celula coloque o cursor no campo.
   ============================================================================ */

/**
 * Cria o <span> que representa um campo editavel.
 * @param {string} texto      conteudo do campo
 * @param {string} caminho    campo correspondente no dados.json
 * @param {boolean} [multilinha] true quando o campo aceita quebras de linha
 * @returns {HTMLSpanElement}
 */
export function criarCampo(texto, caminho, multilinha) {
  const campo = document.createElement('span');
  campo.className = 'campo-editavel';
  campo.textContent = texto;
  campo.dataset.editavel = caminho;
  if (multilinha) {
    campo.dataset.multilinha = 'sim';
  }
  return campo;
}

/**
 * Cria uma celula (<td>) de tabela.
 * Quando "caminho" e informado, o texto vai dentro de um campo editavel.
 * @param {string} texto     conteudo da celula
 * @param {string} [classe]  classes CSS separadas por espaco
 * @param {{caminho?: string, colunas?: number, linhas?: number,
 *          nota?: string, multilinha?: boolean}} [opcoes]
 *        caminho    -> torna a celula editavel e diz qual campo ela representa
 *        colunas    -> mesclagem horizontal (colspan)
 *        linhas     -> mesclagem vertical (rowspan)
 *        nota       -> texto exibido ao passar o mouse
 *        multilinha -> permite quebra de linha durante a edicao
 * @returns {HTMLTableCellElement}
 */
export function criarCelula(texto, classe, opcoes) {
  const celula = document.createElement('td');
  const config = opcoes || {};

  if (config.caminho) {
    celula.appendChild(criarCampo(texto, config.caminho, config.multilinha));
  } else {
    celula.textContent = texto;
  }

  if (classe) {
    celula.className = classe;
  }
  if (config.colunas) { celula.colSpan = config.colunas; }
  if (config.linhas) { celula.rowSpan = config.linhas; }
  if (config.nota) { celula.title = config.nota; }

  return celula;
}

/**
 * Cria uma linha (<tr>) ja com as celulas informadas.
 * @param {Array<HTMLTableCellElement>} celulas
 * @param {string} [classe] classe CSS da linha
 * @returns {HTMLTableRowElement}
 */
export function criarLinha(celulas, classe) {
  const linha = document.createElement('tr');
  if (classe) {
    linha.className = classe;
  }
  celulas.forEach(function (celula) {
    linha.appendChild(celula);
  });
  return linha;
}

/**
 * Cria um botao da interface (barra de ferramentas, controles de edicao).
 * @param {string} rotulo
 * @param {string} classe
 * @param {function(Event): void} aoClicar
 * @param {string} [titulo] dica exibida ao passar o mouse
 * @returns {HTMLButtonElement}
 */
export function criarBotao(rotulo, classe, aoClicar, titulo) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = classe;
  botao.textContent = rotulo;
  if (titulo) {
    botao.title = titulo;
  }
  botao.addEventListener('click', aoClicar);
  return botao;
}

/**
 * Escreve um texto no elemento marcado com data-campo="nome" e, se um
 * caminho for informado, torna esse elemento editavel.
 * Usado nos paragrafos soltos do documento, que nao recebem controles e
 * por isso podem ser o proprio campo.
 * @param {string} nome      valor do atributo data-campo
 * @param {string} texto     conteudo a escrever
 * @param {string} [caminho] campo correspondente no dados.json
 */
export function escreverCampo(nome, texto, caminho) {
  const elemento = document.querySelector('[data-campo="' + nome + '"]');
  if (!elemento) {
    return;
  }
  elemento.textContent = texto;
  if (caminho) {
    elemento.dataset.editavel = caminho;
  }
}

/**
 * Devolve o elemento marcado com data-lista="nome", ja esvaziado.
 * @param {string} nome
 * @returns {HTMLElement|null}
 */
export function areaDaLista(nome) {
  const elemento = document.querySelector('[data-lista="' + nome + '"]');
  if (elemento) {
    elemento.textContent = '';
  }
  return elemento;
}
