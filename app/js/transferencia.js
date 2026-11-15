/* ============================================================================
   transferencia.js - importar e exportar o arquivo de dados
   ----------------------------------------------------------------------------
   Permite levar o conteudo do documento para fora e trazer de volta:

     EXPORTAR -> gera o download de um arquivo .json com os dados atuais,
                 ja formatado igual ao dados.json da pasta, pronto para
                 substituir o arquivo original.

     IMPORTAR -> abre o seletor de arquivos, le um .json escolhido por voce
                 e devolve o conteudo para a pagina se redesenhar com ele.

   A importacao valida o arquivo antes de aceitar: se o JSON estiver
   corrompido, ou se faltar alguma secao obrigatoria do documento, a funcao
   lanca um erro em vez de deixar a pagina quebrar no meio da montagem.
   ============================================================================ */

/**
 * Gera o download dos dados como arquivo .json.
 * O arquivo sai formatado com 2 espacos de recuo e quebra de linha final,
 * igual ao dados.json original, para que a substituicao na pasta nao mude
 * a formatacao do arquivo.
 * @param {object} dados
 * @param {string} nomeArquivo  ex.: 'dados.json'
 */
export function exportarJson(dados, nomeArquivo) {
  const texto = JSON.stringify(dados, null, 2) + '\n';
  const blob = new Blob([texto], { type: 'application/json' });
  const endereco = URL.createObjectURL(blob);

  /* O download e disparado por um link temporario, invisivel na pagina */
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  /* Libera a memoria do endereco temporario criado para o download */
  URL.revokeObjectURL(endereco);
}

/**
 * Confere se o conteudo importado tem o formato esperado do documento.
 * @param {*} dados                     conteudo lido do arquivo
 * @param {Array<string>} chavesObrigatorias  secoes que o documento precisa ter
 * @throws {Error} quando o conteudo nao serve
 */
function validar(dados, chavesObrigatorias) {
  if (dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error('O arquivo nao contem um objeto JSON.');
  }

  const faltando = chavesObrigatorias.filter(function (chave) {
    return !Object.prototype.hasOwnProperty.call(dados, chave);
  });

  if (faltando.length > 0) {
    throw new Error('O arquivo nao parece ser deste documento. ' +
                    'Faltam as secoes: ' + faltando.join(', ') + '.');
  }
}

/**
 * Le um arquivo escolhido pelo usuario e devolve o conteudo em texto.
 * @param {File} arquivo
 * @returns {Promise<string>}
 */
function lerTexto(arquivo) {
  return new Promise(function (resolver, rejeitar) {
    const leitor = new FileReader();
    leitor.onload = function () { resolver(String(leitor.result)); };
    leitor.onerror = function () { rejeitar(new Error('Falha ao ler o arquivo.')); };
    leitor.readAsText(arquivo);
  });
}

/**
 * Abre o seletor de arquivos e devolve o conteudo do .json escolhido.
 * @param {Array<string>} chavesObrigatorias  secoes que o documento precisa ter
 * @returns {Promise<object|null>} dados importados, ou null se o usuario
 *                                 fechou o seletor sem escolher nada
 * @throws {Error} quando o arquivo escolhido nao e valido
 */
export function importarJson(chavesObrigatorias) {
  return new Promise(function (resolver, rejeitar) {
    const seletor = document.createElement('input');
    seletor.type = 'file';
    seletor.accept = 'application/json,.json';
    seletor.style.display = 'none';

    seletor.addEventListener('change', async function () {
      const arquivo = seletor.files && seletor.files[0];
      document.body.removeChild(seletor);

      if (!arquivo) {
        resolver(null);
        return;
      }

      try {
        const texto = await lerTexto(arquivo);
        let dados;

        try {
          dados = JSON.parse(texto);
        } catch (erro) {
          throw new Error('O arquivo nao e um JSON valido: ' + erro.message);
        }

        validar(dados, chavesObrigatorias);
        resolver(dados);
      } catch (erro) {
        rejeitar(erro);
      }
    });

    /* Se o usuario fechar o seletor sem escolher nada, o evento "change"
       nunca acontece. O "cancel" cobre esse caso nos navegadores que o
       suportam; nos demais o elemento e removido na proxima importacao. */
    seletor.addEventListener('cancel', function () {
      if (seletor.parentNode) {
        document.body.removeChild(seletor);
      }
      resolver(null);
    });

    document.body.appendChild(seletor);
    seletor.click();
  });
}
