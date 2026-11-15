/* ============================================================================
   aplicacao.js - ciclo de vida de um modelo
   ----------------------------------------------------------------------------
   Este e o modulo que junta todos os outros do nucleo. Ele cuida de tudo que
   e igual em qualquer modelo:

     carregar o dados.json -> recuperar rascunho -> desenhar -> editar ->
     importar / exportar -> gerar PDF -> descartar alteracoes

   O que cada modelo precisa informar esta na configuracao recebida por
   iniciarAplicacao(). Por isso o arquivo modelo.js de cada pasta tem pouco
   mais que uma dezena de linhas.

   Mapa de /app/js:

     caminho.js       le e escreve valores por caminho ("custos.linhas.0.taxa")
     dom.js           cria campos, celulas, linhas e botoes
     armazenamento.js carrega o dados.json e guarda o rascunho no navegador
     transferencia.js importa e exporta o arquivo .json
     edicao.js        edicao inline e botoes de adicionar/remover linha
     pdf.js           gera o PDF pela janela de impressao do navegador
     barra.js         liga os botoes do topo da pagina
     aplicacao.js     este arquivo
   ============================================================================ */

import { carregarDoArquivo, lerRascunho, guardarRascunho, apagarRascunho, saoIguais }
  from './armazenamento.js';
import { exportarJson, importarJson } from './transferencia.js';
import { criarEditor } from './edicao.js';
import { criarBarra } from './barra.js';
import { gerarPdf } from './pdf.js';
import { comoNomeDeArquivo } from './nomes.js';

/**
 * Copia profunda de um objeto de dados.
 * @param {object} objeto
 * @returns {object}
 */
function copiar(objeto) {
  return JSON.parse(JSON.stringify(objeto));
}

/**
 * Mostra, no lugar do documento, o motivo de a carga ter falhado.
 * @param {HTMLElement} raiz
 * @param {Error} erro
 * @param {string} arquivo
 */
function mostrarErro(raiz, erro, arquivo) {
  if (!raiz) {
    return;
  }
  raiz.innerHTML =
    '<div class="aviso-falha">' +
    '<h1>Nao foi possivel carregar o documento</h1>' +
    '<p>O arquivo <strong>' + arquivo + '</strong> nao pode ser lido.</p>' +
    '<p>A causa mais comum e a pagina ter sido aberta com duplo clique: por ' +
    'seguranca, o navegador nao deixa uma pagina em <strong>file://</strong> ' +
    'ler arquivos da pasta. Abra pelo atalho <strong>abrir.command</strong> ' +
    'da pasta Nord.</p>' +
    '<p>Detalhe tecnico: ' + erro.message + '</p>' +
    '</div>';
}

/**
 * Prepara e inicia um modelo.
 * @param {{arquivoDados: string, chaveRascunho: string,
 *          secoesObrigatorias: Array<string>, raiz: HTMLElement,
 *          montar: function(object): void,
 *          nomeArquivo: function(object): string,
 *          limpar: function(object): void,
 *          aoDesenhar?: function(): void,
 *          campoBloqueado?: function(string): boolean}} config
 *        arquivoDados       -> nome do JSON ao lado do index.html
 *        chaveRascunho      -> identificador do rascunho no navegador
 *        secoesObrigatorias -> secoes exigidas de um arquivo importado
 *        raiz               -> elemento que contem o documento
 *        montar             -> desenha o documento a partir dos dados
 *        nomeArquivo        -> nome amigavel do JSON exportado e do PDF
 *        limpar             -> esvazia os valores mantendo a estrutura
 *        aoDesenhar         -> chamado apos cada desenho (opcional)
 *        campoBloqueado     -> recebe o caminho e devolve true para travar
 * @returns {Promise<void>}
 */
export async function iniciarAplicacao(config) {
  /* Conteudo como esta no arquivo (nunca e alterado, serve de referencia) */
  let dadosOriginais = null;

  /* Conteudo exibido na pagina, com as edicoes aplicadas */
  let dados = null;

  let editor = null;
  let barra = null;

  /** @returns {boolean} true quando o documento difere do arquivo original */
  function foiAlterado() {
    return !saoIguais(dados, dadosOriginais);
  }

  /** Poe a barra de ferramentas de acordo com o estado atual. */
  function atualizarBarra() {
    barra.atualizar({ editando: editor.estaAtivo(), alterado: foiAlterado() });
  }

  /**
   * Nome amigavel dos arquivos gerados, montado a partir do conteudo atual
   * do documento (ver app/js/nomes.js).
   * @returns {string} sem extensao, ex.: 'Invoice-015-Horas'
   */
  function nomeBase() {
    return comoNomeDeArquivo(config.nomeArquivo(dados));
  }

  /** Desenha o documento e reaplica o estado do modo de edicao. */
  function redesenhar() {
    config.montar(dados);
    editor.sincronizar();
    if (typeof config.aoDesenhar === 'function') {
      config.aoDesenhar();
    }
  }

  /** Guarda o rascunho e atualiza a barra - chamado a cada alteracao. */
  function registrarAlteracao() {
    if (foiAlterado()) {
      guardarRascunho(config.chaveRascunho, dados);
    } else {
      apagarRascunho(config.chaveRascunho);
    }
    atualizarBarra();
  }

  /* ---------------------------------------------------------------- */
  /* Acoes da barra de ferramentas                                     */
  /* ---------------------------------------------------------------- */

  /** Entra ou sai do modo de edicao. */
  function alternarEdicao() {
    editor.alternar();
    atualizarBarra();
  }

  /** Importa um arquivo .json escolhido pelo usuario. */
  async function importar() {
    try {
      const importados = await importarJson(config.secoesObrigatorias);

      /* null significa que o usuario fechou o seletor sem escolher nada */
      if (!importados) {
        return;
      }
      dados = importados;
      editor.trocarDados(dados);
      redesenhar();
      registrarAlteracao();
      barra.avisar('Arquivo importado.');
    } catch (erro) {
      barra.avisar(erro.message, 'erro');
    }
  }

  /** Exporta o conteudo atual como arquivo .json com nome amigavel. */
  function exportar() {
    const arquivo = nomeBase() + '.json';
    exportarJson(dados, arquivo);

    /* O arquivo pode ser guardado com esse nome e recarregado depois pelo
       botao Importar, que aceita qualquer nome. */
    barra.avisar('Exportado como ' + arquivo);
  }

  /** Abre a janela de impressao para salvar o documento em PDF. */
  function imprimir() {
    const estavaEditando = editor.estaAtivo();

    gerarPdf({
      /* O modo de edicao desenha contornos nos campos: sai antes de imprimir */
      preparar: function () {
        editor.desativar();
        atualizarBarra();
      },
      restaurar: function () {
        if (estavaEditando) {
          editor.ativar();
          atualizarBarra();
        }
      },
      nomeSugerido: nomeBase()
    });
  }

  /** Esvazia o documento, mantendo rotulos, colunas e linhas no lugar. */
  function limpar() {
    if (!window.confirm('Apagar o conteudo de todos os campos deste documento?\n\n' +
                        'Os rotulos e a estrutura continuam; so os valores sao ' +
                        'apagados. Use "Descartar" depois para voltar ao arquivo.')) {
      return;
    }
    config.limpar(dados);
    redesenhar();
    registrarAlteracao();
    barra.avisar('Documento limpo.');
  }

  /** Volta ao conteudo do arquivo, descartando as edicoes. */
  function descartar() {
    if (!foiAlterado()) {
      return;
    }
    if (!window.confirm('Descartar as alteracoes e voltar ao conteudo do ' +
                        config.arquivoDados + '?')) {
      return;
    }
    dados = copiar(dadosOriginais);
    editor.trocarDados(dados);
    apagarRascunho(config.chaveRascunho);
    redesenhar();
    atualizarBarra();
    barra.avisar('Alteracoes descartadas.');
  }

  /** Ctrl/Cmd + E alterna a edicao; Ctrl/Cmd + P gera o PDF. */
  function ligarAtalhos() {
    document.addEventListener('keydown', function (evento) {
      if (!evento.ctrlKey && !evento.metaKey) {
        return;
      }
      const tecla = evento.key.toLowerCase();

      if (tecla === 'e') {
        evento.preventDefault();
        alternarEdicao();
      } else if (tecla === 'p') {
        /* Usa o mesmo preparo do botao "Gerar PDF", nao a impressao crua */
        evento.preventDefault();
        imprimir();
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Partida                                                           */
  /* ---------------------------------------------------------------- */

  try {
    dadosOriginais = await carregarDoArquivo(config.arquivoDados);

    /* Um rascunho guardado no navegador tem prioridade sobre o arquivo */
    const rascunho = lerRascunho(config.chaveRascunho);
    dados = rascunho || copiar(dadosOriginais);

    editor = criarEditor({
      dados: dados,
      raiz: config.raiz,
      aoEditarTexto: registrarAlteracao,
      aoMudarEstrutura: function () {
        redesenhar();
        registrarAlteracao();
      },
      campoBloqueado: config.campoBloqueado
    });

    barra = criarBarra({
      aoAlternarEdicao: alternarEdicao,
      aoImportar: importar,
      aoExportar: exportar,
      aoGerarPdf: imprimir,
      aoLimpar: limpar,
      aoDescartar: descartar
    });

    redesenhar();
    atualizarBarra();
    ligarAtalhos();

    if (rascunho) {
      barra.avisar('Rascunho recuperado do navegador.');
    }
  } catch (erro) {
    mostrarErro(config.raiz, erro, config.arquivoDados);
  }
}
