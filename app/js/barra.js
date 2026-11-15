/* ============================================================================
   barra.js - barra de ferramentas da pagina
   ----------------------------------------------------------------------------
   Liga os botoes do topo da pagina as acoes do documento e mantem o estado
   visual da barra (rotulo do botao de edicao, aviso de alteracoes nao
   exportadas, botoes ligados ou desligados).

   A barra NAO sabe editar, exportar nem imprimir: ela so chama as funcoes
   que recebe de fora. Isso mantem cada responsabilidade em um modulo.
   ============================================================================ */

/**
 * Localiza os elementos da barra no HTML.
 * @returns {object} mapa de elementos (cada um pode ser null)
 */
function localizarElementos() {
  return {
    editar:    document.getElementById('acao-editar'),
    importar:  document.getElementById('acao-importar'),
    exportar:  document.getElementById('acao-exportar'),
    pdf:       document.getElementById('acao-pdf'),
    limpar:    document.getElementById('acao-limpar'),
    descartar: document.getElementById('acao-descartar'),
    aviso:     document.getElementById('aviso-alteracoes')
  };
}

/**
 * Prepara a barra de ferramentas.
 * @param {{aoAlternarEdicao: function(): boolean,
 *          aoImportar: function(): void,
 *          aoExportar: function(): void,
 *          aoGerarPdf: function(): void,
 *          aoLimpar: function(): void,
 *          aoDescartar: function(): void}} acoes
 * @returns {{atualizar: function({editando: boolean, alterado: boolean}): void,
 *            avisar: function(string, string): void}}
 */
export function criarBarra(acoes) {
  const elementos = localizarElementos();

  if (elementos.editar) {
    elementos.editar.addEventListener('click', acoes.aoAlternarEdicao);
  }
  if (elementos.importar) {
    elementos.importar.addEventListener('click', acoes.aoImportar);
  }
  if (elementos.exportar) {
    elementos.exportar.addEventListener('click', acoes.aoExportar);
  }
  if (elementos.pdf) {
    elementos.pdf.addEventListener('click', acoes.aoGerarPdf);
  }
  if (elementos.limpar) {
    elementos.limpar.addEventListener('click', acoes.aoLimpar);
  }
  if (elementos.descartar) {
    elementos.descartar.addEventListener('click', acoes.aoDescartar);
  }

  return {
    /**
     * Poe a barra de acordo com o estado atual do documento.
     * @param {{editando: boolean, alterado: boolean}} estado
     */
    atualizar: function (estado) {
      if (elementos.editar) {
        elementos.editar.textContent = estado.editando ? 'Concluir edicao' : 'Editar';
        elementos.editar.classList.toggle('botao-ativo', estado.editando);
      }
      if (elementos.descartar) {
        elementos.descartar.disabled = !estado.alterado;
      }
      if (elementos.aviso) {
        elementos.aviso.textContent = estado.alterado
          ? 'Alteracoes nao exportadas'
          : '';
        elementos.aviso.classList.toggle('visivel', estado.alterado);
      }
    },

    /**
     * Mostra uma mensagem temporaria no lugar do aviso de alteracoes.
     * @param {string} texto
     * @param {string} [tipo] 'erro' para destacar em vermelho
     */
    avisar: function (texto, tipo) {
      if (!elementos.aviso) {
        return;
      }
      elementos.aviso.textContent = texto;
      elementos.aviso.classList.add('visivel');
      elementos.aviso.classList.toggle('aviso-erro-texto', tipo === 'erro');

      /* A mensagem some sozinha e o estado normal volta na proxima
         atualizacao da barra. */
      window.setTimeout(function () {
        elementos.aviso.classList.remove('aviso-erro-texto');
      }, 4000);
    }
  };
}
