Introdução
Informações básicas do projeto

Projeto: Sinaliza

Repositório GitHub: [https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2026-1-ti1-0438200-g2-1]

Membros da equipe:

Victhor Gabriel Freire de Oliveira[https://github.com/VicthorFreire]
Diego Vitor Pinto Mariano Portella[https://github.com/diegovitorportella]
Lucca Marinho Eterovik Tavares Pereira[https://github.com/LuccaMarinhoDev]
Gustavo Emanuel Gonçalves de Sousa[https://github.com/gustavogoncalves1704-lgtm]
Rafael Mota Azevedo[https://github.com/m0taaz]
Nelson Buralli Dabes[https://github.com/NelsonBuralliDabesDEV]

O projeto visa desenvolver uma plataforma para facilitar a experiência de pessoas com deficiência auditiva em restaurantes, proporcionando autonomia durante todo o processo de escolha do estabelecimento, realização do pedido e acompanhamento da refeição.

Contexto
Problema

Pessoas com deficiência auditiva enfrentam diversas dificuldades ao frequentar restaurantes. A comunicação com garçons normalmente depende da fala, tornando o atendimento demorado, desconfortável e, muitas vezes, sujeito a erros.

Além disso, poucos estabelecimentos oferecem recursos acessíveis, como atendimento em Libras, comunicação por texto ou cardápios adaptados. Essa situação reduz a autonomia do usuário e prejudica sua experiência durante uma atividade cotidiana.

Embora aplicativos de delivery e restaurantes digitais estejam cada vez mais populares, poucos possuem funcionalidades voltadas especificamente para usuários surdos ou com deficiência auditiva.

Objetivos
Objetivo Geral

Desenvolver um aplicativo para restaurantes que promova acessibilidade e autonomia para pessoas com deficiência auditiva durante toda a experiência de consumo.

Objetivos Específicos
Disponibilizar cardápios digitais acessíveis.
Facilitar a realização de pedidos sem necessidade de comunicação verbal.
Possibilitar avaliações sobre acessibilidade dos estabelecimentos.
Incentivar restaurantes a oferecerem atendimento inclusivo.

Justificativa

Segundo o IBGE, milhões de brasileiros possuem algum grau de deficiência auditiva. Apesar do crescimento dos serviços digitais, ainda existem poucas soluções voltadas para esse público.

O projeto busca reduzir barreiras de comunicação, oferecendo maior independência durante uma atividade cotidiana como sair para comer.

Além do impacto social positivo, a solução beneficia restaurantes, que passam a atender um público maior de forma inclusiva e moderna.

Público-Alvo

O aplicativo é destinado principalmente a:

Pessoas surdas;
Pessoas com deficiência auditiva parcial;
Usuários de Libras;
Familiares e acompanhantes;
Restaurantes interessados em oferecer atendimento inclusivo.

Os usuários possuem diferentes níveis de familiaridade com tecnologia, mas compartilham a necessidade de uma comunicação clara, visual e acessível.

Product Discovery
Etapa de Entendimento

Durante o processo de Discovery foram realizadas pesquisas sobre acessibilidade digital, levantamento de dificuldades enfrentadas por pessoas surdas em restaurantes e análise de aplicativos existentes.

Também foram produzidos:

Matriz CSD;
Mapa de Stakeholders;
Entrevistas;
Highlights da pesquisa.
Etapa de Definição
Personas

Foram definidas três personas principais:

Persona 1 — Ana Clara Silva

Estudante universitária de 22 anos, usuária de Libras, que busca autonomia para realizar pedidos sem depender de terceiros.


Persona 2 — Rafael Martins

Analista de TI de 35 anos que procura rapidez e praticidade em restaurantes, valorizando comunicação totalmente por texto.


Persona 3 — Mariana Souza

Professora de 42 anos que costuma sair para restaurantes com a família e deseja encontrar estabelecimentos realmente preparados para atender pessoas surdas.


Product Design
Histórias de Usuário
Eu como...	Quero	Para
Usuária surda	Fazer pedidos por texto	Não depender da comunicação verbal
Usuário surdo	Receber notificações visuais	Acompanhar o pedido facilmente
Cliente	Visualizar cardápios acessíveis	Escolher refeições com autonomia
Cliente	Encontrar restaurantes acessíveis	Ter uma experiência mais confortável
Restaurante	Receber pedidos digitais	Reduzir erros no atendimento
Usuário	Avaliar acessibilidade dos restaurantes	Ajudar outros usuários
Proposta de Valor

O aplicativo oferece uma experiência gastronômica inclusiva através de recursos como:

Tradução para Libras (vídeos);
Cardápio acessível;
Avaliações de acessibilidade;
Filtros para localizar restaurantes inclusivos.

Enquanto aplicativos tradicionais focam apenas no pedido, o SinalFood busca eliminar barreiras de comunicação durante toda a experiência.

Projeto de Interface
Wireframes
Tela Inicial

Exibe restaurantes próximos e filtros de acessibilidade.

Tela do Restaurante

Mostra:

Cardápio
Informações
Avaliações
Recursos de acessibilidade

Permite:

Observações por texto;
Comunicação com o restaurante.

Exibe:

Pedido recebido;
Em preparo;
Saiu para entrega;
Pedido entregue.

Tudo utilizando indicadores visuais.

Tela de Perfil

Permite:

Editar dados;
Histórico de pedidos;
Restaurantes favoritos;
Configurações de acessibilidade.
User Flow

Fluxo principal:

Login

↓

Tela Inicial

↓

Pesquisar Restaurante

↓

Selecionar Restaurante

↓

Visualizar Cardápio

↓

Adicionar Produtos

↓

Confirmar Pedido

↓

Acompanhar Pedido

↓

Avaliar Restaurante
Metodologia
Ferramentas
Ferramenta	Utilização
Figma	Protótipos
GitHub	Versionamento
Visual Studio Code	Desenvolvimento
JSON Server	API Fake
Trello	Gerenciamento
Discord	Comunicação
Gerenciamento

Foi utilizada a metodologia Scrum.

As tarefas foram divididas em Sprints semanais contendo:

Backlog
To Do
Doing
Review
Done
Solução Implementada
Funcionalidades
Cadastro/Login

Permite criar conta e acessar o aplicativo.

Pesquisa de Restaurantes

Localiza restaurantes próximos com filtros de acessibilidade.

Cardápio Digital

Exibe produtos organizados por categoria.

Pedidos

Realização completa do pedido pelo aplicativo.

Chat

Comunicação totalmente por texto entre cliente e restaurante.

Favoritos

Salvar restaurantes preferidos.

Avaliações

Usuários podem avaliar:

Atendimento;
Comunicação;
Acessibilidade.
Estruturas de Dados
Usuário
{
  "id": 1,
  "nome": "Ana Clara",
  "email": "ana@email.com",
  "senha": "123456",
  "tipo": "cliente"
}
Restaurante
{
  "id": 10,
  "nome": "Pizzaria Itália",
  "categoria": "Pizza",
  "cidade": "Belo Horizonte",
  "acessivel": true
}
Produto
{
  "id": 1,
  "nome": "Pizza Calabresa",
  "preco": 59.90,
  "descricao": "Pizza grande com queijo e calabresa."
}
Pedido
{
  "id": 20,
  "usuario": 1,
  "restaurante": 10,
  "status": "Em preparo",
  "valor": 79.90
}
Avaliação
{
  "id": 5,
  "usuario": 1,
  "restaurante": 10,
  "nota": 5,
  "comentario": "Excelente atendimento em Libras."
}
Módulos e APIs
Bibliotecas
Bootstrap 5
Font Awesome
SweetAlert2
APIs
JSON Server
ViaCEP
OpenStreetMap/Leaflet
Referências

BRASIL. Lei Brasileira de Inclusão da Pessoa com Deficiência (Lei nº 13.146/2015).

IBGE. Censo Demográfico. Disponível em: https://www.ibge.gov.br.

W3Schools. JSON Tutorial. Disponível em: https://www.w3schools.com/.

MDN Web Docs. JavaScript. Disponível em: https://developer.mozilla.org/.