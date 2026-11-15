# Nord Docs

Reprodução em HTML, CSS e JavaScript puros de documentos do Word e do Excel,
com edição do conteúdo na própria página e geração de PDF.

**➜ [Abrir o site](https://robertruas.github.io/Nord-Docs/)**

Sem dependências, sem etapa de build e sem framework: o site é servido como
arquivos estáticos.

## Como abrir

**Online:** use o link acima.

**Localmente:** dê duplo clique em `abrir.command`. Ele sobe um servidor local,
abre a página central no navegador e lista os modelos.

> **Por que um servidor local?** As páginas leem o conteúdo de arquivos `.json`
> com `fetch()`. Por segurança, os navegadores bloqueiam `fetch()` quando a
> página é aberta com duplo clique (endereço `file://`). Abrir o `index.html`
> diretamente mostra um aviso explicando isso. No GitHub Pages o problema não
> existe, porque lá o site já é servido por HTTP.

## Documentos em branco

Os três modelos vêm **vazios**: os rótulos, os títulos de coluna, os textos
fixos e a quantidade de linhas estão no lugar, mas nenhum campo tem valor.
É só preencher.

O botão **Limpar** devolve o documento a esse mesmo estado a qualquer momento.
Os `dados.json` publicados foram gerados pelos próprios módulos de limpeza
([`app/tipos/fatura/limpeza.js`](app/tipos/fatura/limpeza.js) e
[`app/tipos/planilha/limpeza.js`](app/tipos/planilha/limpeza.js)), então
"documento em branco" tem uma definição só em todo o projeto.

No timesheet, começar em branco significa que o campo **Week** está vazio —
logo os blocos dos sete dias nascem travados até você informar a semana.

## Dados reais ficam fora do Git

O GitHub Pages é público e indexável, e o histórico do Git é permanente.

Para trabalhar com dados reais, mantenha-os fora do Git: qualquer arquivo
terminado em `.local.json` é ignorado pelo `.gitignore`. O fluxo é:

1. **Exportar** o documento depois de preenchido;
2. guardar o arquivo baixado como, por exemplo,
   `modelos/invoice-horas/dados.local.json`;
3. em uma próxima sessão, **Importar** esse arquivo.

Nunca faça commit de um `dados.json` com dados reais: o histórico do Git é
permanente e apagar o arquivo depois não o remove dos commits anteriores.

## Publicação

O deploy é automático: todo push na branch `main` dispara o workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que publica a
pasta inteira no GitHub Pages. Não há etapa de build.

Para ativar na primeira vez, no GitHub:
**Settings → Pages → Source: _GitHub Actions_**.

## Árvore do projeto

```
Nord/
├── abrir.command        duplo clique aqui (uso local)
├── index.html           página central: escolha do modelo
├── README.md            este arquivo
├── .github/workflows/   deploy automático no GitHub Pages
│
├── app/                 a aplicação, compartilhada por todos os modelos
│   ├── css/
│   │   ├── central.css      página central
│   │   ├── interface.css    barra de ferramentas
│   │   └── edicao.css       modo de edição
│   ├── js/
│   │   ├── aplicacao.js     ciclo de vida de um modelo (comece por aqui)
│   │   ├── armazenamento.js carregar o JSON e guardar o rascunho
│   │   ├── transferencia.js importar e exportar o arquivo .json
│   │   ├── edicao.js        edição inline e adicionar/remover linhas
│   │   ├── pdf.js           geração do PDF
│   │   ├── barra.js         botões do topo da página
│   │   ├── caminho.js       ler/escrever valores por caminho
│   │   ├── limpeza.js       esvaziar valores mantendo a estrutura
│   │   ├── datas.js         formato dd/mm/aaaa e data de hoje
│   │   ├── nomes.js         nome amigável dos arquivos gerados
│   │   ├── dom.js           criar campos, células, linhas e botões
│   │   └── central.js       página central
│   └── tipos/           o desenho de cada TIPO de documento
│       ├── fatura/          usado pelos dois invoices
│       └── planilha/        usado pelo timesheet (+ zoom e semana)
│
├── modelos/             um diretório por documento
│   ├── catalogo.json        a lista que a página central lê
│   ├── invoice-despesas/
│   ├── invoice-horas/
│   └── timesheet/
│
```

Cada pasta em `modelos/` contém só o que é próprio daquele documento:

| Arquivo        | Papel                                                  |
| -------------- | ------------------------------------------------------ |
| `dados.json`   | **conteúdo** — o único arquivo a editar para trocar valores |
| `index.html`   | **estrutura** — ordem dos blocos e largura das colunas |
| `modelo.js`    | **configuração** — uma dezena de linhas                |
| `variacao.css` | medidas que diferem do outro modelo do mesmo tipo      |

## O que dá para fazer em cada documento

| Ação          | Atalho         | O que faz                                        |
| ------------- | -------------- | ------------------------------------------------ |
| **Editar**    | `Ctrl/Cmd + E` | edita qualquer texto direto no documento         |
| **Importar**  | —              | carrega um `dados.json` de qualquer pasta        |
| **Exportar**  | —              | baixa o JSON com nome amigável (ver abaixo)      |
| **Gerar PDF** | `Ctrl/Cmd + P` | abre a impressão do navegador ("Salvar como PDF")|
| **Limpar**    | —              | apaga o conteúdo de todos os campos              |
| **Descartar** | —              | volta ao conteúdo original do arquivo            |
| **Zoom**      | `Ctrl/Cmd + - 0` ou `Ctrl/Cmd` + roda | só no timesheet       |

No modo de edição aparecem ainda o botão **+ linha** abaixo das tabelas e um
**×** em cada linha, para acrescentar ou remover itens.

**Sobre salvar:** uma página aberta no navegador não pode gravar em um arquivo
do disco. Por isso as alterações ficam guardadas no próprio navegador (não se
perdem ao recarregar) e o botão **Exportar** baixa o JSON atualizado.

O arquivo exportado recebe um nome montado a partir do próprio conteúdo do
documento, e não um `dados.json` genérico:

| Modelo              | Arquivo exportado              |
| ------------------- | ------------------------------ |
| Invoice de Despesas | `Invoice-014-Despesas.json`    |
| Invoice de Horas    | `Invoice-015-Horas.json`       |
| Weekly Timesheet    | `Timesheet-Semana-45-2026.json`|

O mesmo nome é sugerido ao salvar o PDF. Para recarregar um arquivo exportado
use **Importar**, que aceita qualquer nome; para que ele vire o conteúdo
padrão do modelo, renomeie para `dados.json` na pasta correspondente.

## A semana manda nas datas (timesheet)

O campo **Week** é obrigatório: é dele que saem as datas dos sete dias,
calculadas pelo padrão **ISO-8601** (a semana começa na segunda e a semana 1
é a que contém o dia 4 de janeiro). Era o que as fórmulas do Excel original
faziam.

- Digitar uma semana nova recalcula as sete datas ao sair do campo.
- A semana é validada contra o ano do documento (campo `ano` no `dados.json`;
  se faltar, vale o ano corrente): 2026 tem 53 semanas, 2027 tem 52.
- Enquanto a semana for inválida, **os blocos dos sete dias ficam travados**
  para edição e uma faixa explica o motivo. O cabeçalho e as assinaturas
  seguem editáveis.
- Com a semana inválida, as datas da última semana válida permanecem à vista,
  em vez de as células ficarem vazias.

## Assinatura e data

O campo de assinatura fica **em branco** de propósito: a assinatura é feita
depois, já no PDF. O campo de data ao lado abre sempre com a data de hoje,
mas continua editável — basta digitar por cima para fixar outra data.

**Sobre o PDF:** é gerado pela impressão do navegador, de propósito. Assim o
texto sai como texto de verdade no PDF — pesquisável, selecionável e nítido em
qualquer zoom — e o tamanho de página e as margens definidos em pontos no CSS
são respeitados exatamente. Uma biblioteca de captura transformaria o
documento em imagem e perderia tudo isso.

## Acrescentar um modelo novo

1. Crie a pasta em `modelos/` com `dados.json`, `index.html` e `modelo.js`.
2. Se for um tipo de documento que já existe (fatura, planilha), aponte o
   `modelo.js` para a montagem correspondente em `app/tipos/`.
   Se for um tipo novo, crie uma pasta em `app/tipos/`.
3. Acrescente a entrada em `modelos/catalogo.json`.

Nenhum código da página central precisa ser alterado.

## Fidelidade aos originais

As medidas não foram estimadas: foram convertidas do XML dentro dos arquivos
`.docx` e `.xlsx` que deram origem ao projeto.

- **Word:** twips → pontos, meios-pontos → tamanho de fonte, oitavos-de-ponto
  → espessura de borda. Folha A4 com margens de 720 twips (12,7 mm).
- **Excel:** largura em caracteres → pixels (`car × 7 + 5`), alturas em
  pontos, e a cor dos cabeçalhos calculada do tema (accent6 `#4EA72E` com
  tint 0,8 → `#D9F2D0`).

O `dados.json` do timesheet foi conferido célula a célula contra o `.xlsx`
original, sem divergências, antes de os dados reais darem lugar aos de exemplo.

Alguns ajustes foram pedidos e se afastam de propósito do original:

- o texto das células não quebra linha e fica centralizado verticalmente, com
  um pequeno respiro interno que não altera a altura das células;
- a assinatura e o nome do técnico saíram do bloco de assinatura;
- os documentos vêm em branco, prontos para preencher;
- a data ao lado da assinatura passou a ser automática;
- as datas dos sete dias passaram a ser calculadas pela semana, em ISO-8601.

---

Desenvolvido por **Robert Ruas** · [92ruas@gmail.com](mailto:92ruas@gmail.com)
