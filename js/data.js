/*
 * The Reading Nest — Configurações e Acervo Oficial de Fallback
 * A aplicação consome a API RESTful em http://localhost:8080.
 * Estes dados oficiais garantem que a livraria nunca exiba telas quebradas em caso de oscilações da API.
 */
window.RN_API_BASE = 'https://the-reading-nest-back-1.onrender.com';


window.RN_DEFAULT_GENRES = [
    { id: 'c1d2e3f4-0001-4000-8000-000000000001', nome: 'Clássicos' },
    { id: 'c1d2e3f4-0002-4000-8000-000000000002', nome: 'Romance' },
    { id: 'c1d2e3f4-0003-4000-8000-000000000003', nome: 'Fantasia' },
    { id: 'c1d2e3f4-0004-4000-8000-000000000004', nome: 'Ficção' }
];

window.RN_DEFAULT_BOOKS = [
    {
        id: 'b1d2e3f4-0001-4000-8000-000000000001',
        generoId: 'c1d2e3f4-0001-4000-8000-000000000001',
        generoNome: 'Clássicos',
        titulo: 'Dom Casmurro',
        autor: 'Machado de Assis',
        descricao: 'Um dos grandes romances da literatura brasileira. Entre lembranças, ciúmes e dúvidas, Bentinho revisita sua história com Capitu e convida o leitor a questionar cada detalhe.',
        anoPublicacao: 1899,
        isbn: '9788535910663',
        quantidadeDisponivel: 4,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0002-4000-8000-000000000002',
        generoId: 'c1d2e3f4-0002-4000-8000-000000000002',
        generoNome: 'Romance',
        titulo: 'Orgulho e Preconceito',
        autor: 'Jane Austen',
        descricao: 'Elizabeth Bennet e Mr. Darcy protagonizam uma história sobre primeiras impressões, orgulho, afeto e as convenções sociais da Inglaterra do século XIX.',
        anoPublicacao: 1813,
        isbn: '9788544001820',
        quantidadeDisponivel: 3,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0003-4000-8000-000000000003',
        generoId: 'c1d2e3f4-0003-4000-8000-000000000003',
        generoNome: 'Fantasia',
        titulo: 'O Pequeno Príncipe',
        autor: 'Antoine de Saint-Exupéry',
        descricao: 'Uma fábula delicada sobre amizade, afeto e o essencial que tantas vezes passa despercebido aos olhos.',
        anoPublicacao: 1943,
        isbn: '9788522031443',
        quantidadeDisponivel: 5,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0004-4000-8000-000000000004',
        generoId: 'c1d2e3f4-0004-4000-8000-000000000004',
        generoNome: 'Ficção',
        titulo: '1984',
        autor: 'George Orwell',
        descricao: 'Uma distopia marcante sobre vigilância, linguagem, liberdade e poder, em uma sociedade controlada pelo Grande Irmão.',
        anoPublicacao: 1949,
        isbn: '9788535914845',
        quantidadeDisponivel: 2,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0005-4000-8000-000000000005',
        generoId: 'c1d2e3f4-0001-4000-8000-000000000001',
        generoNome: 'Clássicos',
        titulo: 'A Hora da Estrela',
        autor: 'Clarice Lispector',
        descricao: 'A trajetória de Macabéa, jovem nordestina no Rio de Janeiro, narrada com a sensibilidade e a profundidade características de Clarice Lispector.',
        anoPublicacao: 1977,
        isbn: '9788532508129',
        quantidadeDisponivel: 3,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0006-4000-8000-000000000006',
        generoId: 'c1d2e3f4-0003-4000-8000-000000000003',
        generoNome: 'Fantasia',
        titulo: 'O Hobbit',
        autor: 'J. R. R. Tolkien',
        descricao: 'Bilbo Bolseiro deixa o conforto de sua toca para viver uma aventura extraordinária ao lado de anões e de um mago.',
        anoPublicacao: 1937,
        isbn: '9788595084742',
        quantidadeDisponivel: 2,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0007-4000-8000-000000000007',
        generoId: 'c1d2e3f4-0004-4000-8000-000000000004',
        generoNome: 'Ficção',
        titulo: 'A Revolução dos Bichos',
        autor: 'George Orwell',
        descricao: 'Uma fábula satírica sobre poder, manipulação e desigualdade, protagonizada pelos animais de uma fazenda.',
        anoPublicacao: 1945,
        isbn: '9788535909551',
        quantidadeDisponivel: 4,
        statusLivro: 'ativo'
    },
    {
        id: 'b1d2e3f4-0008-4000-8000-000000000008',
        generoId: 'c1d2e3f4-0002-4000-8000-000000000002',
        generoNome: 'Romance',
        titulo: 'Persuasão',
        autor: 'Jane Austen',
        descricao: 'Anne Elliot reencontra um amor do passado em um romance sobre amadurecimento, escolhas e segundas oportunidades.',
        anoPublicacao: 1817,
        isbn: '9788544002131',
        quantidadeDisponivel: 1,
        statusLivro: 'ativo'
    }
];

window.RN_DEFAULT_USERS = [
    { id: 'u1d2e3f4-0002-4000-8000-000000000002', nome: 'Leitor Demonstração', email: 'cliente@thereadingnest.com', perfil: 'leitor' },
    { id: 'u1d2e3f4-0001-4000-8000-000000000001', nome: 'Administrador', email: 'admin@thereadingnest.com', perfil: 'admin' }
];
