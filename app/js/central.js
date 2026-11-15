/* ============================================================================
   central.js - pagina inicial com a lista de modelos
   ----------------------------------------------------------------------------
   Le o catalogo em modelos/catalogo.json e desenha um cartao para cada
   modelo. Para acrescentar um documento novo a lista basta criar a pasta
   dele em /modelos e incluir uma entrada no catalogo - nada neste arquivo
   precisa mudar.
   ============================================================================ */

import { carregarDoArquivo } from './armazenamento.js';

/** Arquivo com a lista de modelos */
const CATALOGO = 'modelos/catalogo.json';

/**
 * Cria o cartao de um modelo.
 * @param {{id: string, nome: string, resumo: string, origem: string,
 *          formato: string, pasta: string}} modelo
 * @returns {HTMLAnchorElement}
 */
function criarCartao(modelo) {
  const cartao = document.createElement('a');
  cartao.className = 'cartao';
  cartao.href = modelo.pasta + 'index.html';

  cartao.innerHTML =
    '<span class="cartao-formato"></span>' +
    '<h2 class="cartao-nome"></h2>' +
    '<p class="cartao-resumo"></p>' +
    '<p class="cartao-origem"></p>';

  /* O conteudo entra por textContent para que o catalogo nunca injete HTML */
  cartao.querySelector('.cartao-formato').textContent = modelo.formato;
  cartao.querySelector('.cartao-nome').textContent = modelo.nome;
  cartao.querySelector('.cartao-resumo').textContent = modelo.resumo;
  cartao.querySelector('.cartao-origem').textContent = 'Origem: ' + modelo.origem;

  return cartao;
}

/**
 * Mostra o motivo de o catalogo nao ter sido lido.
 * @param {HTMLElement} area
 * @param {Error} erro
 */
function mostrarErro(area, erro) {
  area.innerHTML =
    '<div class="aviso-falha">' +
    '<h1>Nao foi possivel carregar a lista de modelos</h1>' +
    '<p>A causa mais comum e a pagina ter sido aberta com duplo clique: por ' +
    'seguranca, o navegador nao deixa uma pagina em <strong>file://</strong> ' +
    'ler arquivos da pasta. Abra pelo atalho <strong>abrir.command</strong>.</p>' +
    '<p>Detalhe tecnico: ' + erro.message + '</p>' +
    '</div>';
}

/** Carrega o catalogo e desenha a lista. */
async function iniciar() {
  const area = document.getElementById('lista-modelos');
  if (!area) {
    return;
  }

  try {
    const catalogo = await carregarDoArquivo(CATALOGO);

    const titulo = document.getElementById('titulo-central');
    const descricao = document.getElementById('descricao-central');
    if (titulo) { titulo.textContent = catalogo.titulo; }
    if (descricao) { descricao.textContent = catalogo.descricao; }

    area.textContent = '';
    catalogo.modelos.forEach(function (modelo) {
      area.appendChild(criarCartao(modelo));
    });
  } catch (erro) {
    mostrarErro(area, erro);
  }
}

iniciar();
