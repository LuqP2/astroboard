# Astroboard

Uma mandala astrológica interativa para construir exemplos durante as aulas. Coloque planetas, conecte aspectos e ajuste as casas em um quadro manual, com controles por clique e arraste.

A versão atual funciona no navegador, com interface em português e alternativas ao arraste para facilitar o uso com touchpad.

**[Abrir Astroboard no navegador](https://luqp2.github.io/astroboard/)** — sem instalação ou terminal.

## Recursos

- **Quatro modelos:** círculo vazio, quatro partes, doze setores iguais e dois mapas (biwheel).
- **Dez planetas:** Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno e Plutão.
- **Posicionamento manual:** coloque e mova símbolos por cliques ou drag & drop.
- **Signo e grau:** selecione um planeta e informe sua posição exata no signo.
- **Aspectos manuais:** conecte planetas com linhas que acompanham seus movimentos.
- **Casas ajustáveis:** gire as casas ou escolha onde começa a casa 1, mantendo signos e planetas fixos.
- **Visibilidade independente:** signos, divisões, números das casas, planetas, aspectos e marcas de graus.
- **Centro vazio ajustável:** slider de tamanho, mantendo as linhas dos aspectos visíveis por cima.
- **Desfazer/refazer, arquivos de aula e recuperação automática da sessão.**
- **Modo de apresentação e exportação em PNG.**

## Executar localmente

Pré-requisito: **Node.js 22 ou superior**, com npm.

```powershell
git clone https://github.com/LuqP2/astroboard.git
cd astroboard
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173/** no navegador. Mantenha o terminal aberto enquanto usa o aplicativo. Para encerrar o servidor, pressione `Ctrl+C`.

Se você já tem o projeto nesta pasta, execute apenas `npm ci` e `npm run dev`.

## Desenvolvimento

Stack: **React, TypeScript, SVG e Vite**. Sem contas ou backend. Todas as dependências da interface ficam no build, sem fontes remotas ou serviços externos em tempo de execução.

```powershell
npm run build
npm run preview
```

O build verifica o TypeScript e produz arquivos estáticos em `dist/`. O preview serve esse build localmente em `/astroboard/`. O desenvolvimento usa um servidor local; a versão publicada funciona diretamente no GitHub Pages. Ainda não é um instalador nem uma PWA.

O workflow `.github/workflows/deploy-pages.yml` compila e publica o site automaticamente a cada push na `main`. O Vite usa `/astroboard/` como caminho base de produção e `/` no desenvolvimento.

## Durante a aula

- Clique no planeta da lateral e depois na mandala; também é possível arrastar.
- Clique em um planeta colocado e escolha Reposicionar para mover com dois cliques.
- Ligar planetas conecta dois símbolos com uma linha manual. O tipo é escolhido pela professora; não há identificação automática de ângulos ou orbes.
- Dois mapas separa mapa-base e trânsitos. Escolha o anel na lateral antes de colocar o símbolo.
- Ao selecionar um planeta, escolha seu signo e grau (de 0 até menos de 30) e clique em Aplicar. Decimais com vírgula ou ponto são aceitos.
- Os graus dentro do signo aparecem abaixo de cada planeta e acompanham sua posição. Aplicar uma posição ativa sua exibição; use **Graus dos planetas** para mostrar ou esconder os valores. Essa opção é salva na aula e também vale para o PNG.
- A rotação move apenas as casas, em passos de 15 graus. Signos e planetas ficam fixos. O controle Início da casa 1 define diretamente o signo e grau da primeira cúspide.
- Centro vazio oculta as divisões dentro do círculo central. As linhas dos aspectos ficam por cima e continuam visíveis. Essa opção também é salva na aula.
- O slider Tamanho do centro ajusta o círculo em tempo real. Soltar o controle registra uma alteração para Desfazer; o tamanho é salvo na aula.
- Ocultar não apaga. Trocar modelos preserva planetas e aspectos, inclusive os objetos do anel externo.
- Salvar baixa um arquivo `.astro.json`; Carregar carrega um arquivo escolhido pelo usuário.
- A última sessão é guardada no armazenamento deste navegador. Salve um arquivo para ter uma cópia independente; limpar os dados do navegador elimina essa recuperação.
- Exportar imagem gera PNG. Apresentar recolhe painéis; não usa a tela cheia do sistema. Escape volta a editar.
- As setas ao lado de **Planetas** e **Exibição** recolhem cada lateral independentemente. Quando recolhida, a lateral mantém uma seta para reabrir, liberando espaço sem alterar a aula.
- Desfazer/refazer guarda até 80 alterações nesta sessão; o histórico não é salvo entre aberturas.

Os graus são informados dentro do signo, de **0 até menos de 30**. Por exemplo: Escorpião, `15,5` graus.

Para fazer a casa 1 começar em Escorpião, mostre as casas e, em **Início da casa 1**, escolha **Escorpião**, grau **0**, e clique em **Aplicar**.

Atalhos opcionais: `Ctrl+Z` para desfazer, `Ctrl+Shift+Z` para refazer e `Delete` para remover o elemento selecionado.

## Dados locais

As aulas são processadas no navegador e não são enviadas a um servidor. A sessão automática pertence ao navegador e ao endereço utilizado. Mudar de navegador ou endereço pode impedir sua recuperação. Use **Salvar** para guardar uma cópia independente.

## Escopo e evolução

O Astroboard é um quadro didático manual. As casas usam setores iguais; o programa não calcula mapas por nascimento, efemérides, trânsitos reais, ângulos de aspectos ou orbes automaticamente. Os tipos de aspectos são escolhidos por quem conduz a aula.

Empacotamento para Windows com Tauri, gravação de tela/áudio e interface em inglês são possibilidades de evolução e ainda não estão implementados.

## Avaliação de uso

A avaliação visual e do touchpad é manual. Um percurso útil: colocar três planetas, reposicionar um, ligar dois, ocultar e revelar signos, girar casas, ajustar o centro, colocar um trânsito e salvar/reabrir a aula. Verifique os símbolos no Windows, legibilidade no projetor, arraste e conforto com o touchpad. Planetas muito próximos recebem deslocamento visual radial com uma marca de posição; aglomerações grandes podem exigir reposicionamento.
