# The Reading Nest — Biblioteca de Luxo

Projeto demonstrativo completo de uma biblioteca de aluguel de livros, feito com **HTML, CSS e JavaScript puro**. A pasta pode ser aberta diretamente no Visual Studio Code.

## Como abrir

1. Extraia a pasta `The-Reading-Nest` do arquivo ZIP.
2. Abra o VS Code.
3. Vá em **Arquivo → Abrir Pasta...** e selecione `The-Reading-Nest`.
4. Recomendado: instale a extensão **Live Server** (o VS Code pode sugeri-la ao abrir o projeto).
5. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.

Também é possível abrir `index.html` diretamente no navegador, mas o Live Server oferece uma experiência melhor durante o desenvolvimento.

## Contas para demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `cliente@thereadingnest.com` | `Cliente123!` |
| Administrador | `admin@thereadingnest.com` | `Admin123!` |

Você também pode criar uma nova conta pela tela **Criar conta**. Novos cadastros recebem automaticamente o perfil de cliente.

## O que está implementado

- Login com direcionamento por perfil e opção de mostrar/ocultar senha.
- Cadastro de clientes e validação de e-mail já cadastrado.
- Catálogo com busca por título/autor, filtros por categoria e disponibilidade e ordenação.
- Página de detalhes do livro.
- Solicitação de aluguel com verificação de disponibilidade e prevenção de solicitações duplicadas ativas.
- Área do cliente e histórico de aluguéis.
- Página institucional com história e valores.
- Painel administrativo com indicadores, cadastro, edição e exclusão de livros.
- Atualização do status de aluguéis e ajuste do estoque ao aprovar/encerrar solicitações.
- Layout responsivo para computador e celular.

## Estrutura

```text
The-Reading-Nest/
├── index.html              # Login
├── cadastro.html           # Cadastro de clientes
├── catalogo.html           # Página inicial e catálogo
├── livro.html              # Detalhes de um livro (?id=1)
├── cliente.html            # Conta do cliente
├── alugueis.html           # Histórico de aluguéis
├── sobre.html              # Sobre nós e valores
├── admin.html              # Painel administrativo
├── css/
│   └── style.css           # Estilos e responsividade
├── js/
│   ├── data.js             # Catálogo e contas iniciais
│   └── app.js              # Navegação, regras e interações
├── assets/
│   └── img/                # Imagens de referência fornecidas
└── .vscode/
    └── extensions.json    # Sugestão da extensão Live Server
```

## Onde os dados ficam

Para facilitar o teste local, livros, usuários e aluguéis são guardados no `localStorage` do navegador. A sessão de login usa `sessionStorage`. Os dados permanecem no navegador usado para o teste; não são sincronizados entre computadores e podem ser apagados ao limpar os dados do site.

Para reiniciar os dados de demonstração, abra as ferramentas do desenvolvedor do navegador → Console e execute:

```js
localStorage.removeItem('rn_books');
localStorage.removeItem('rn_users');
localStorage.removeItem('rn_rentals');
location.reload();
```

## Importante antes de publicar

Este projeto é um **protótipo front-end funcional**, não um sistema pronto para receber dados reais. As senhas de demonstração são mantidas no navegador e a separação de páginas por perfil é apenas uma simulação. Um usuário técnico pode contornar controles feitos somente em JavaScript.

Antes de colocar o site na internet ou usar com clientes reais, é necessário criar um backend, banco de dados, armazenamento seguro de senhas com hash, sessões seguras e autorização validada no servidor. Não cadastre dados pessoais ou senhas reais nesta versão.

## Personalização

- Para alterar os livros iniciais: `js/data.js`.
- Para alterar cores, tipografia e layout: `css/style.css`.
- Para alterar comportamentos: `js/app.js`.
- Para adicionar imagens próprias: coloque os arquivos em `assets/img/` e referencie-os nos componentes desejados.
