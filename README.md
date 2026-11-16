# Gota Certa

Protótipo de **Tecnologia Cidadã** para a avaliação de Desenvolvimento Web I (Fatec).

## Objetivo

Ajudar moradores a **enxergar quanto de água a casa usa por dia** e comparar com a referência de 110 litros por pessoa (ONU), para que possam economizar. O site permite registrar o consumo por atividade (banho, descarga, lavar louça etc.), editar e apagar registros e acompanhar a média por pessoa.

## Problema e cidadão

- **Cidadão afetado:** moradores de casas e apartamentos urbanos que pagam pela água mas não acompanham o próprio consumo, em especial famílias de renda apertada e pequenos comércios de bairro.
- **Problema:** a conta mostra só o total do mês. Sem ver onde a água é gasta no dia a dia, é difícil mudar o hábito e economizar.
- **Evidência (dado público, SNIS organizado pelo Instituto Trata Brasil):**
  - 37,78% da água tratada é perdida na distribuição (SNIS 2022).
  - O consumo médio no país fica entre 150 e 160 litros por pessoa por dia, acima dos 110 litros que a ONU indica como suficientes.
- **ODS:** 6 (água potável e saneamento), 11 (cidades e comunidades sustentáveis) e 13 (ação contra a mudança do clima).

Fontes:
- Instituto Trata Brasil. *Estudo de Perdas de Água 2024 (resumo executivo)*: <https://tratabrasil.org.br/wp-content/uploads/2024/06/Resumo-Executivo-Perdas-de-Agua-2024-ITB-V2.pdf>
- O Popular. *Água: um recurso vital sob ameaça do desperdício* (SNIS 2022): <https://opopular.com.br/infomercial/agua-um-recurso-vital-sob-ameaca-do-desperdicio-1.3306904>

## Tecnologias

- HTML5 semântico (`header`, `nav`, `main`, `section`, `footer`)
- CSS3 em arquivo externo: Flexbox, Grid, abordagem Mobile First e media queries
- JavaScript puro (sem frameworks), com `try/catch` e manipulação do DOM
- Bootstrap 5.3.3 via CDN (navbar, cards, formulário e tabelas), com verificação de integridade (SRI)
- Git e GitHub

## Como executar

1. Baixe ou clone o repositório.
2. Abra a pasta no **VS Code**.
3. Instale a extensão **Live Server**, clique com o botão direito em `index.html` e escolha **Open with Live Server**.
   (Também funciona abrindo o `index.html` direto no navegador.)

É preciso estar online na primeira abertura, para carregar o Bootstrap pelo CDN.

## Estrutura de pastas

```
gota-certa/
├── index.html        Página inicial: problema, cidadão, evidência e ODS
├── registro.html     Formulário, lista de registros, resumo do dia e painel de atividades
├── sobre.html        Como funciona, modelo de negócio, privacidade e tecnologias
├── css/
│   └── style.css     Estilos próprios (Mobile First)
├── js/
│   ├── validacao.js  Regras de validação (funções pequenas e sem acesso ao DOM)
│   └── registro.js   Adicionar, listar, editar, remover, resumo, painel e armazenamento
├── img/              Prints das telas
└── README.md
```

## O que o site faz (requisitos da atividade)

| Requisito | Onde está |
| --- | --- |
| 3 páginas HTML semânticas com navegação | `index.html`, `registro.html`, `sobre.html` |
| CSS externo, Flexbox/Grid, Mobile First, 3 larguras | `css/style.css` (celular, 768 px tablet, 1024 px desktop) |
| Formulário com `label`, validação HTML5 e validação em JavaScript com mensagens na tela | `registro.html` e `js/validacao.js` |
| Adicionar, listar, editar e remover pelo DOM | `js/registro.js` |
| Painel de atividades (data/hora, ação, resultado) | seção "Painel de atividades" em `registro.html` |
| Bootstrap em ao menos uma seção | navbar (todas as páginas), cards do resumo, formulário e tabelas |
| Dados mantidos ao recarregar | `localStorage` (opcional; se falhar, o site continua funcionando) |

Sobre a validação: o formulário usa os atributos nativos do HTML5 (`required`, `type`, `min`, `max`, `maxlength`) e o atributo `novalidate`. Assim, o navegador não mostra os balões dele, e o JavaScript mostra as mensagens na tela, junto de cada campo.

## Segurança e privacidade

- Toda entrada é validada (campo vazio, tipo, faixa de valores, data real, tamanho e caracteres permitidos) antes de ser usada.
- Textos vão para a tela com `textContent`, nunca com `innerHTML`, para impedir injeção de HTML/JavaScript (XSS).
- Os dados lidos do `localStorage` são validados de novo, porque podem ter sido alterados pelo usuário.
- Mensagens de erro não mostram detalhes técnicos: o usuário vê "Não foi possível carregar os dados. Tente novamente."
- O Bootstrap é carregado com `integrity` (SRI), para o navegador recusar o arquivo se ele for alterado.
- LGPD: coleta mínima (atividade, litros, data e observação opcional), sem nome, e-mail ou endereço. Há aviso de privacidade no formulário. Use apenas dados fictícios.
- Não há chaves, senhas ou segredos no repositório.

## Prints das telas

| Celular | Tablet | Desktop |
| --- | --- | --- |
| ![Início no celular](img/inicio-celular.png) | ![Início no tablet](img/inicio-tablet.png) | ![Início no desktop](img/inicio-desktop.png) |
| ![Registro no celular](img/registro-celular.png) | ![Registro no tablet](img/registro-tablet.png) | ![Registro no desktop](img/registro-desktop.png) |

Mensagens de validação na tela:

![Erros de validação](img/registro-erros-desktop.png)


## Autor

Gustavo — Desenvolvimento de Software Multiplataforma, Fatec Luigi Papaiz.
