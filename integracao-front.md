# Tarefa: Interligar Front-end (HTML/CSS/JS) com a API Back-end (The Reading Nest)

## Contexto e Regras Absolutas
- **Tecnologia:** Utilize exclusivamente HTML5, CSS3 e JavaScript puro (Vanilla JS) já existentes neste projeto. Proibido instalar frameworks ou bibliotecas externas.
- **Preservação Visual:** Mantenha 100% do HTML, classes CSS, layout e estrutura visual existentes intactos. Altere apenas a camada JavaScript para substituir os dados simulados do `localStorage` (`rn_books`, `window.RN_DEFAULT_BOOKS`, etc.) pelas requisições `fetch` reais para a API.
- **URL Base da API:** `http://localhost:8080` (sem prefixo `/api`).

---

## Contrato Exato da API Back-end (`http://localhost:8080`)

### 1. Autenticação JWT (`POST /auth/login`)
- **Entrada (JSON):** `{ "email": "...", "senha": "..." }`
- **Saída (200 OK):**
  ```json
  {
    "tipo": "Bearer",
    "token": "eyJhbG...",
    "usuario": {
      "id": "uuid-do-usuario",
      "nome": "Nome",
      "email": "email@dominio.com",
      "perfil": "admin",
      "statusConta": "ativo"
    }
  }
  ```
- **Ação no Front-end:** Salvar `token` e `JSON.stringify(usuario)` no `localStorage`. Enviar `"Authorization": "Bearer " + token` no cabeçalho de todas as rotas protegidas. Se `usuario.perfil !== "admin"`, ocultar/bloquear o acesso à tela `admin.html`.

### 2. Cadastro de Novo Usuário (`POST /usuarios`)
- **Entrada (JSON):** `{ "nome": "...", "email": "...", "senha": "..." }`
- **Saída (201 Created):** Dados do usuário criado (nasce automaticamente com `perfil: "cliente"`).

### 3. Gêneros Literários (`/generos`)
- **Listar (`GET /generos?size=100`):** Retorna paginação Spring Data `{ "content": [ { "id": "uuid", "nome": "Fantasia" } ] }`. Ler sempre `dados.content`.
- **Criar (`POST /generos` — requer token admin):** Envia `{ "nome": "..." }`.
- **Excluir (`DELETE /generos/{id}` — requer token admin):** Remove o gênero.

### 4. Acervo de Livros (`/livros`)
- **Listar (`GET /livros?size=100`):** Retorna `{ "content": [ ... ] }`. Cada item possui:
  - `id` (String UUID)
  - `generosId` (String UUID)
  - `generoNome` (String)
  - `titulo` (String)
  - `autor` (String)
  - `descricao` (String)
  - `anoPublicacao` (Integer)
  - `isbn` (String)
  - `quantidadeDisponivel` (Integer)
  - `statusLivro` (`"ativo"` ou `"desativado"`)
- **Mapeamento para o Front-end:** Adaptar os campos recebidos da API para as propriedades já usadas no front-end (`id`, `title`: `titulo`, `author`: `autor`, `category`: `generoNome`, `generosId`, `year`: `anoPublicacao`, `isbn`, `stock`: `quantidadeDisponivel`, `description`: `descricao`, `available`: `statusLivro === "ativo"`).
- **Modal de Cadastro/Edição (`#book-form` / `openBookModal`):**
  - Preencher o `<select>` de categorias com os itens de `GET /generos` (usando `g.id` no `value` e `g.nome` no texto).
  - Ao salvar, enviar `POST /livros` (novo) ou `PUT /livros/{id}` (edição) com token admin e corpo:
    ```json
    {
      "generosId": "uuid-do-genero",
      "titulo": "...",
      "autor": "...",
      "descricao": "...",
      "anoPublicacao": 2024,
      "isbn": "...",
      "quantidadeDisponivel": 5,
      "statusLivro": "ativo"
    }
    ```
    *(Nota: Se o campo `isbn` estiver vazio, enviar `null`).*
- **Ativar/Desativar Livro (`data-action="toggle-book"` no Admin):**
  - Chamar `PUT /livros/{id}` enviando os dados do livro com `statusLivro` alternado entre `"ativo"` e `"desativado"` (ou `DELETE /livros/{id}` para desativar).

### 5. Empréstimos e Aluguéis (`/alugueis`)
- **Alugar Livro (`POST /alugueis` — requer token):**
  - Envia `{ "usuarioId": usuarioLogado.id, "dataDevolucaoPrevista": "AAAA-MM-DD", "livrosIds": [livroId] }`.
- **Meus Aluguéis (`GET /usuarios/{id}/alugueis?size=50` — requer token):**
  - Retorna `{ "content": [ { "id", "usuarioId", "usuarioNome", "dataAluguel", "dataDevolucaoPrevista", "status" } ] }`.
- **Todos os Aluguéis Pendentes (`GET /alugueis?size=50` — requer token admin):**
  - Retorna `{ "content": [ ... ] }` para exibição no painel administrativo.
- **Devolver (`POST /alugueis/{id}/devolver` — requer token):**
  - Finaliza o aluguel e devolve o livro ao estoque.
- **Cancelar (`POST /alugueis/{id}/cancelar` — requer token):**
  - Cancela o aluguel e repõe o estoque.

### 6. Tratamento Uniforme de Erros
- Em qualquer resposta com `!response.ok`, fazer `const erro = await response.json()` e exibir as mensagens contidas no array `erro.erros` (ex: `erro.erros.join("\n")`).
- Se `response.status === 401`, limpar o `localStorage` e redirecionar para `login.html`.
