# Tarefa: Ajustar Fluxo de Devolução, Ativação/Desativação de Contas e Livros, e Separação de Seções no Admin (`js/app.js`)

## Regras Obrigatórias e Preservação
- **Preservar URL de Produção:** Mantenha `API_BASE` apontando exatamente para `'https://onrender.com'` (não altere para `localhost`).
- **Preservar Visual e Classes CSS:** Não altere os arquivos `.html` nem `css/style.css`. Utilize exclusivamente as classes CSS já existentes no projeto (`admin-shell`, `admin-sidebar`, `admin-main`, `panel`, `section-title`, `table-wrap`, `admin-actions`, `btn`, `btn-small`, `btn-light`, `btn-danger`, `btn-gold`, `status`, `pending`, `cancelled`, `pill`, `muted`, `empty-state`).
- **Estilo de Código:** Não adicione comentários linha a linha no meio do código; mantenha apenas os títulos de cabeçalho das funções e seções.

---

## 1. Ajustes na Tela do Leitor (`renderRentals` — `alugueis.html`)
- **Remover o botão "Devolver" do cliente:** O usuário leitor (`cliente`) **não** deve ter mais o botão `data-action="return-rental"` ("Devolver") em nenhum lugar da sua tabela de aluguéis.
- **Regras da coluna "Ações" do leitor:**
  - Enquanto `r.status === 'ativo'`, exiba **apenas** o botão `<button class="btn btn-small btn-danger" data-action="cancel-rental" data-id="${r.id}">Cancelar</button>`.
  - Se `r.status === 'atrasado'`, exiba apenas o texto `<span class="muted" style="font-size:12px">Devolver no balcão</span>`.
  - Se `r.status === 'concluido'`, exiba apenas o texto `<span class="muted" style="font-size:12px">Finalizado</span>`.
- **Aviso informativo:** Atualize a faixa de aviso acima da tabela para informar ao leitor que a devolução deve ser feita presencialmente no balcão da biblioteca para que o administrador confirme a baixa no sistema.

---

## 2. Ajustes no Painel Administrativo (`renderAdmin` — `admin.html`)

### 2.1. Menu Lateral (`admin-sidebar`) e Indicadores (`admin-stats`)
- Adicione no `admin-sidebar` os links de navegação rápida para as 3 áreas distintas do painel:
  - `<a class="active" href="admin.html">▦ &nbsp; Visão geral</a>`
  - `<a href="#books-admin">▤ &nbsp; Gerenciar acervo</a>`
  - `<a href="#rentals-admin">⇄ &nbsp; Aluguéis dos usuários</a>`
  - `<a href="#users-admin">👥 &nbsp; Contas de usuários</a>`
  - `<a href="catalogo.html">⌕ &nbsp; Ver catálogo</a>`
  - `<a href="cliente.html">👤 &nbsp; Minha conta</a>`
  - `<a href="#" data-action="logout">↪ &nbsp; Sair</a>`
- Nos cards de estatísticas (`admin-stats`), exiba: **Títulos no acervo**, **Exemplares em estoque**, **Aluguéis em andamento** e **Contas cadastradas** (`users.length`).

### 2.2. Seção 1: Gerenciar Acervo de Livros (`#books-admin`)
- Liste todos os livros vindos de `GET /livros?size=100` (tanto ativos quanto desativados).
- Na coluna **Situação**, exiba `<span class="status pending">Ativo</span>` quando `b.statusLivro === 'ativo'` e `<span class="status cancelled">Desativado</span>` quando `b.statusLivro !== 'ativo'`.
- Na coluna **Ações**, mantenha os botões:
  - **Editar** (`data-action="edit-book"`).
  - **Desativar / Ativar** (`data-action="toggle-book"`): Quando `b.statusLivro === 'ativo'`, exibe botão vermelho (`btn-danger`) escrito **Desativar**. Quando `b.statusLivro !== 'ativo'`, exibe botão dourado (`btn-gold`) escrito **Ativar**.
- **Conferência da função `toggleBook(id)`:** Garanta que ao clicar em **Ativar** em um livro desativado, a requisição `PUT /livros/{id}` envie todos os campos obrigatórios do livro (`generosId`, `titulo`, `autor`, `descricao`, `anoPublicacao`, `isbn`, `quantidadeDisponivel`) com `statusLivro: 'ativo'`, reativando o livro no banco de dados e recarregando `renderAdmin()`.

### 2.3. Seção 2: Aluguéis dos Usuários (`#rentals-admin`)
- Liste todos os aluguéis vindos de `GET /alugueis?size=50` mostrando: **Cliente**, **Empréstimo**, **Data do Aluguel**, **Prazo Devolução**, **Status** e **Ações**.
- **Remover o botão "Cancelar" do administrador:** O administrador **não** deve ter botão `data-action="cancel-rental"` na tabela de aluguéis.
- Na coluna **Ações** do administrador:
  - Quando `r.status !== 'concluido'`, exiba **apenas** o botão `<button class="btn btn-small btn-light" data-action="return-rental" data-id="${r.id}">Confirmar Devolução</button>`.
  - Quando `r.status === 'concluido'`, exiba `<span class="muted" style="font-size:12px">Devolução confirmada</span>`.

### 2.4. Seção 3: Contas de Usuários (`#users-admin`)
- Crie uma nova seção `<section class="panel" id="users-admin" style="margin-top:30px">` logo abaixo de `#rentals-admin`, alimentada por `GET /usuarios?size=100`.
- Exiba uma tabela (`table-wrap`) com as colunas: **Nome**, **E-mail**, **Perfil**, **Status da Conta** e **Ações**:
  - **Perfil:** Exibe `<span class="pill">${usr.perfil === 'admin' ? 'Administrador' : 'Leitor'}</span>`.
  - **Status da Conta:** Exibe `<span class="status pending">Ativo</span>` quando `usr.statusConta === 'ativo'` e `<span class="status cancelled">Desativado</span>` quando `usr.statusConta !== 'ativo'`.
  - **Ações:**
    1. **Ver Perfil (`data-action="inspect-user"`):** Botão `<button class="btn btn-small btn-light" data-action="inspect-user" data-id="${usr.id}" data-name="${esc(usr.nome)}">Ver Perfil</button>` disponível para todas as contas.
    2. **Desativar / Ativar Conta (`data-action="toggle-user"`):** Exibido para contas onde `usr.perfil !== 'admin'`:
       - Se `usr.statusConta === 'ativo'`, exibe botão vermelho `<button class="btn btn-small btn-danger" data-action="toggle-user" data-id="${usr.id}" data-status="ativo">Desativar Conta</button>`.
       - Se `usr.statusConta !== 'ativo'`, exibe botão dourado `<button class="btn btn-small btn-gold" data-action="toggle-user" data-id="${usr.id}" data-status="desativado">Ativar Conta</button>`.

---

## 3. Implementação dos Eventos de Clique (`actionEl`)

No listener global de cliques de `js/app.js` (onde ficam `edit-book`, `toggle-book`, `return-rental`), adicione os handlers para `inspect-user` e `toggle-user` respeitando o escopo da função (usando `.then()/.catch()` se o listener não for `async`):

### 3.1. Handler `inspect-user` (Ver Perfil e Aluguéis do Usuário)
- Ao clicar em **Ver Perfil** (`action === 'inspect-user'`):
  - Consulta `GET /usuarios/${actionEl.dataset.id}` para obter os dados completos da conta (`nome`, `email`, `perfil`, `statusConta`).
  - Consulta `GET /usuarios/${actionEl.dataset.id}/alugueis?size=50` para obter todos os aluguéis feitos por aquele usuário, e para cada aluguel consulta `GET /alugueis/${r.id}` para obter os títulos dos livros emprestados.
  - Exibe um resumo claro (em modal próprio usando a estrutura de modal já existente no projeto ou em janela de exibição detalhada) contendo:
    - **Dados do Perfil:** Nome, E-mail, Perfil e Status da Conta.
    - **Aluguéis Feitos pelo Usuário:** Lista com nome do(s) livro(s), data do pedido, prazo de devolução e status (`Ativo`, `Atrasado` ou `Concluído`).

### 3.2. Handler `toggle-user` (Desativar ou Ativar Conta)
- Ao clicar em **Desativar Conta** ou **Ativar Conta** (`action === 'toggle-user'`):
  - Verifica `const isCurrentlyActive = actionEl.dataset.status === 'ativo';`.
  - Pede confirmação ao administrador (`confirm(...)`).
  - **Se estiver ativa (`isCurrentlyActive === true`):** Envia `DELETE /usuarios/${actionEl.dataset.id}` para desativar a conta, exibe toast `"Conta desativada com sucesso."` e chama `renderAdmin()`.
  - **Se estiver desativada (`isCurrentlyActive === false`):** Busca os dados atuais do usuário (`GET /usuarios/${actionEl.dataset.id}`) e envia `PUT /usuarios/${actionEl.dataset.id}` com `{ nome, email, statusConta: 'ativo' }` para reativar a conta, exibe toast `"Conta ativada com sucesso."` e chama `renderAdmin()`.
