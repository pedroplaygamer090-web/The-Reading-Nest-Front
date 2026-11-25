(() => {
    'use strict';

    // =========================================================================
    // 1. Configurações Globais e Utilitários de Navegação / Sessão
    // =========================================================================
    const API_BASE = window.RN_API_BASE || 'https://onrender.com';
    const page = document.body.dataset.page || 'home';

    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => [...root.querySelectorAll(s)];

    const getToken = () => localStorage.getItem('rn_token');

    const current = () => {
        try {
            const raw = localStorage.getItem('rn_user');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return {
                ...parsed,
                name: parsed.nome || parsed.name || 'Leitor',
                role: parsed.perfil || parsed.role || 'cliente'
            };
        } catch {
            return null;
        }
    };

    const setSession = (token, usuario) => {
        localStorage.setItem('rn_token', token);
        localStorage.setItem('rn_user', JSON.stringify(usuario));
    };

    const logout = () => {
        localStorage.removeItem('rn_token');
        localStorage.removeItem('rn_user');
        location.href = 'index.html';
    };

    const requireRole = (role) => {
        const u = current();
        const t = getToken();
        if (!u || !t) {
            location.replace('login.html');
            return false;
        }
        if (role && u.role !== role) {
            toast('Acesso restrito ao perfil autorizado.');
            location.replace(u.role === 'admin' ? 'admin.html' : 'cliente.html');
            return false;
        }
        return true;
    };

    const requireAuth = () => {
        const u = current();
        const t = getToken();
        if (!u || !t) {
            location.replace('login.html');
            return false;
        }
        return true;
    };

    const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const initials = name => (name || 'RN').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
    const toneFromId = id => Math.abs(String(id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 5;

    const toast = (msg) => {
        let el = $('.toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'toast';
            document.body.append(el);
        }
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(window.rnToastTimer);
        window.rnToastTimer = setTimeout(() => el.classList.add('hidden'), 3800);
    };

    // =========================================================================
    // 2. Cliente Centralizado de Requisições HTTP (API RESTful)
    // =========================================================================
    async function apiRequest(endpoint, options = {}) {
        const headers = { ...options.headers };
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        let response;
        try {
            response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });
        } catch (networkErr) {
            throw new Error(`Não foi possível conectar ao servidor (${API_BASE}). Verifique se o backend está em execução.`);
        }

        // Tratamento Uniforme de Erros (Conforme integracao-front.md)
        if (response.status === 401) {
            localStorage.removeItem('rn_token');
            localStorage.removeItem('rn_user');
            toast('Sessão expirada. Redirecionando para o login...');
            setTimeout(() => { location.href = 'login.html'; }, 1200);
            const err = new Error('ACESSO NÃO AUTORIZADO: TOKEN AUSENTE OU EXPIRADO');
            err.status = 401;
            throw err;
        }

        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch {}

            let message = 'Ocorreu um erro no servidor.';
            if (errorData && Array.isArray(errorData.erros) && errorData.erros.length > 0) {
                message = errorData.erros.join('\n');
            } else if (errorData && errorData.mensagem) {
                message = errorData.mensagem;
            }

            const err = new Error(message);
            err.status = response.status;
            err.data = errorData;
            throw err;
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    // =========================================================================
    // 3. Mapeador de Dados da API para o Front-end
    // =========================================================================
    function mapBook(item) {
        if (!item) return null;
        const stock = Number(item.quantidadeDisponivel ?? item.stock ?? 0);
        const statusLivro = item.statusLivro || 'ativo';
        return {
            id: item.id,
            title: item.titulo || item.title || '',
            author: item.autor || item.author || '',
            category: item.generoNome || item.category || 'Geral',
            generoId: item.generoId || item.generosId || '',
            year: item.anoPublicacao || item.year || new Date().getFullYear(),
            isbn: item.isbn || '',
            stock: stock,
            description: item.descricao || item.description || '',
            statusLivro: statusLivro,
            available: statusLivro === 'ativo' && stock > 0,
            price: 15.00,
            tone: toneFromId(item.id || item.titulo)
        };
    }

    const fallbackBooks = () => (window.RN_DEFAULT_BOOKS || []).map(mapBook).filter(Boolean);
    const fallbackGenres = () => (window.RN_DEFAULT_GENRES || []).map(g => ({ id: g.id, nome: g.nome }));

    // =========================================================================
    // 4. Componentes Compartilhados (Header, Footer, Capas, Cards)
    // =========================================================================
    const cover = b => `<div class="cover-art tone-${Number(b.tone) || 0}"><span class="cover-title">${esc(b.title)}</span><span class="cover-author">${esc(b.author)}</span></div>`;

    const bookCard = b => `
        <article class="book-card">
            ${cover(b)}
            <div class="book-info">
                <span class="pill">${esc(b.category)}</span>
                <h3>${esc(b.title)}</h3>
                <p>${esc(b.author)} · ${b.year}</p>
                <div class="book-meta">
                    <span>${b.available ? 'Disponível' : 'Indisponível'}</span>
                    <strong>${money(b.price)} / aluguel</strong>
                </div>
                <div class="book-actions">
                    <a class="btn btn-small" href="livro.html?id=${b.id}">Ver detalhes</a>
                </div>
            </div>
        </article>
    `;

    const header = (active = '') => {
        const u = current();
        return `
            <header class="topbar">
                <a class="brand" href="index.html">
                    <span class="brand-mark">♧</span>
                    <span>
                        <span class="brand-name">The Reading Nest</span>
                        <span class="brand-sub">BIBLIOTECA & LIVRARIA DE LUXO</span>
                    </span>
                </a>
                <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu">☰</button>
                <nav class="nav" id="main-nav">
                    <a class="${active === 'home' ? 'active' : ''}" href="index.html">Início</a>
                    <a class="${active === 'catalog' ? 'active' : ''}" href="catalogo.html">Catálogo</a>
                    <a class="${active === 'about' ? 'active' : ''}" href="sobre.html">Sobre nós</a>
                    ${u?.role === 'cliente' ? `<a class="${active === 'rentals' ? 'active' : ''}" href="alugueis.html">Meus aluguéis</a>` : ''}
                    ${u ? `<a class="${active === 'account' ? 'active' : ''}" href="cliente.html">Minha conta</a>` : ''}
                    ${u?.role === 'admin' ? `<a class="${active === 'admin' ? 'active' : ''}" href="admin.html">Painel admin</a>` : ''}
                </nav>
                <div class="nav-actions">
                    ${u ? `
                        <a class="nav-icon" href="cliente.html">Olá, ${esc(u.name.split(' ')[0])}</a>
                        <button class="btn btn-small btn-light" data-action="logout">Sair</button>
                    ` : `
                        <a class="nav-icon" href="login.html">Entrar</a>
                        <a class="btn btn-small" href="cadastro.html">Criar conta</a>
                    `}
                </div>
            </header>
        `;
    };

    const footer = `
        <footer class="site-footer">
            <p class="tagline">“Uma boa história sempre encontra seu leitor.”</p>
            <p>The Reading Nest · Livraria & Biblioteca de Luxo — Alameda dos Alfarrábios, 1428, Jardins, São Paulo - SP</p>
            <p>Atendimento & Retiradas: Segunda a Sexta, das 09h às 20h | Sábados, das 10h às 18h · Tel: (11) 3456-7890</p>
            <p>© ${new Date().getFullYear()} The Reading Nest. Todos os direitos reservados. Alugue online e retire em nossa livraria física.</p>
        </footer>
    `;

    const shell = (active, content) => `${header(active)}${content}${footer}`;

    // =========================================================================
    // 5. Renderizadores das Páginas
    // =========================================================================

    // --- PÁGINA INICIAL PRINCIPAL (index.html) ---
    async function renderHome() {
        const content = `
            <main>
                <!-- Hero Section Principal -->
                <section class="hero">
                    <div class="hero-copy">
                        <span class="eyebrow">BIBLIOTECA & LIVRARIA DE LUXO</span>
                        <h1>Histórias que merecem ser <em>vividas.</em></h1>
                        <p>Descubra uma curadoria exclusiva de obras clássicas e contemporâneas. Solicite seu aluguel online com toda a comodidade e retire pessoalmente em nossa charmosa livraria física nos Jardins.</p>
                        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">
                            <a class="btn btn-gold" href="catalogo.html">Explorar acervo completo <span>↗</span></a>
                            <a class="btn" href="#como-funciona" style="background:rgba(255,255,255,0.08);color:#f7edda;border:1px solid var(--gold)">Como funciona</a>
                        </div>
                    </div>
                    <div class="hero-art">
                        <div class="hero-books">
                            <div class="book-cover"><small>THE READING NEST</small><strong>Grandes<br>Clássicos</strong><span>Edição Especial</span></div>
                            <div class="book-cover"><small>CURADORIA DE LUXO</small><strong>O Prazer<br>de Ler</strong><span>Exemplares Raros</span></div>
                            <div class="book-cover"><small>RETIRE NO NINHO</small><strong>Novos<br>Mundos</strong><span>Histórias para Viver</span></div>
                        </div>
                    </div>
                </section>

                <!-- Seção: Como Funciona o Aluguel e Retirada Presencial -->
                <section class="section container" id="como-funciona">
                    <div class="section-title">
                        <div>
                            <span class="eyebrow">EXPERIÊNCIA PRESENCIAL & DIGITAL</span>
                            <h2>Como funciona o aluguel no The Reading Nest</h2>
                            <p>A conveniência da reserva digital unida ao aconchego da nossa livraria física.</p>
                        </div>
                    </div>
                    <div class="values-grid">
                        <article class="value-card">
                            <span class="symbol">✦</span>
                            <h3>1. Escolha & Reserve Online</h3>
                            <p>Navegue pelo nosso catálogo digital, consulte a disponibilidade em tempo real e confirme seu pedido de aluguel em poucos segundos.</p>
                        </article>
                        <article class="value-card">
                            <span class="symbol">❧</span>
                            <h3>2. Prazo Confortável</h3>
                            <p>Desfrute de um período estendido de 14 dias para ler a obra no seu próprio ritmo, com possibilidade de renovação ou devolução facilitada.</p>
                        </article>
                        <article class="value-card">
                            <span class="symbol">♡</span>
                            <h3>3. Retire na Livraria</h3>
                            <p>Visite nossa livraria física nos Jardins para retirar o livro preparado com carinho, e aproveite para degustar um café em nossa sala de leitura.</p>
                        </article>
                    </div>
                </section>

                <!-- Seção: Destaques da Curadoria -->
                <section class="section container">
                    <div class="section-title">
                        <div>
                            <span class="eyebrow">CURADORIA ESPECIAL</span>
                            <h2>Livros em destaque</h2>
                            <p>Obras selecionadas pela nossa equipe literária para começar sua jornada.</p>
                        </div>
                        <a href="catalogo.html" class="btn btn-light btn-small">Ver catálogo completo <span>→</span></a>
                    </div>
                    <div class="book-grid" id="home-featured-list">
                        <div class="empty-state" style="grid-column:1/-1">Carregando acervo em destaque...</div>
                    </div>
                </section>

                <!-- Seção: Localização Física e Horários de Atendimento -->
                <section class="section container" style="margin-bottom:50px">
                    <div class="section-title">
                        <div>
                            <span class="eyebrow">NOSSO ESPAÇO FÍSICO</span>
                            <h2>Venha nos visitar</h2>
                            <p>Um ambiente planejado para leitores apaixonados.</p>
                        </div>
                    </div>
                    <div class="panel" style="background:#fffaf2;border:1px solid var(--gold);padding:32px">
                        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:24px;align-items:center">
                            <div>
                                <h3 style="font:600 24px var(--serif);margin-top:0">The Reading Nest — Livraria & Café</h3>
                                <p style="line-height:1.8;color:var(--muted)">
                                    📍 <strong>Endereço:</strong> Alameda dos Alfarrábios, 1428 — Jardins, São Paulo - SP<br>
                                    🚇 <strong>Referência:</strong> A 400m da Estação Oscar Freire<br>
                                    📞 <strong>Telefone & WhatsApp:</strong> (11) 3456-7890<br>
                                    ✉️ <strong>E-mail:</strong> contato@thereadingnest.com
                                </p>
                            </div>
                            <div style="border-left:1px solid var(--line);padding-left:clamp(0px, 3vw, 24px)">
                                <h4 style="font:600 18px var(--serif);margin-top:0">Horários de Retiradas e Devoluções</h4>
                                <p style="line-height:1.8;color:var(--muted)">
                                    🗓️ <strong>Segunda a Sexta:</strong> das 09h às 20h<br>
                                    🗓️ <strong>Sábados e Feriados:</strong> das 10h às 18h<br>
                                    ☕ <strong>Café Literário:</strong> aberto ao público durante todo o expediente
                                </p>
                                <a href="catalogo.html" class="btn btn-small btn-gold" style="margin-top:10px">Ver acervo disponível para retirada</a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        `;

        $('#app').innerHTML = shell('home', content);

        // Carrega livros em destaque da API (primeiros 4 livros ativos)
        try {
            const data = await apiRequest('/livros?size=8');
            const rawList = data?.content || [];
            const mapped = rawList.map(mapBook).filter(b => b.statusLivro === 'ativo').slice(0, 4);
            const container = $('#home-featured-list');
            if (container) {
                const featured = mapped.length
                    ? mapped
                    : fallbackBooks().filter(b => b.statusLivro === 'ativo').slice(0, 4);
                container.innerHTML = featured.length
                    ? featured.map(bookCard).join('')
                    : `<div class="empty-state" style="grid-column:1/-1">Nenhum livro em destaque no momento. Visite o catálogo!</div>`;
            }
        } catch (err) {
            const container = $('#home-featured-list');
            if (container) {
                const featured = fallbackBooks().filter(b => b.statusLivro === 'ativo').slice(0, 4);
                container.innerHTML = featured.length
                    ? featured.map(bookCard).join('')
                    : `<div class="empty-state" style="grid-column:1/-1">${esc(err.message)}</div>`;
            }
        }
    }

    // --- PÁGINA CATÁLOGO (catalogo.html) ---
    async function renderCatalog() {
        const content = `
            <main class="container section">
                <div class="page-head" style="margin-bottom:30px">
                    <span class="eyebrow">ACERVO COMPLETO</span>
                    <h1>Catálogo de Livros</h1>
                    <p class="muted">Pesquise por títulos, autores ou selecione uma categoria literária para encontrar sua próxima leitura.</p>
                </div>

                <div class="categories" id="home-categories" style="margin-bottom:30px">
                    <button class="category-chip active" data-category="">Todos os gêneros</button>
                </div>

                <div class="catalog-layout">
                    <aside class="filter-panel">
                        <h3>Filtrar acervo</h3>
                        
                        <label for="search-book">Buscar título ou autor</label>
                        <input class="form-control" id="search-book" placeholder="Ex.: Dom Casmurro, Orwell...">

                        <label for="category-filter">Gênero literário</label>
                        <select class="form-control" id="category-filter">
                            <option value="">Todos os gêneros</option>
                        </select>

                        <label for="availability-filter">Disponibilidade</label>
                        <select class="form-control" id="availability-filter">
                            <option value="">Todos</option>
                            <option value="yes">Disponíveis para aluguel</option>
                            <option value="no">Exemplares esgotados</option>
                        </select>

                        <button class="btn btn-light btn-small" id="clear-filters" style="width:100%;margin-top:18px">Limpar filtros</button>
                    </aside>

                    <div>
                        <div class="catalog-toolbar">
                            <span class="muted" id="results-count">Carregando acervo...</span>
                            <select class="form-control" id="sort-books" style="max-width:190px">
                                <option value="title">Ordenar: A–Z</option>
                                <option value="year">Ano de publicação</option>
                            </select>
                        </div>
                        <div class="book-grid" id="catalog-list">
                            <div class="empty-state" style="grid-column:1/-1">Carregando livros...</div>
                        </div>
                    </div>
                </div>
            </main>
        `;

        $('#app').innerHTML = shell('catalog', content);

        let allBooks = [];
        let allGenres = [];

        // Carrega Gêneros e Livros em paralelo da API
        try {
            const [genresData, booksData] = await Promise.all([
                apiRequest('/generos?size=100').catch(() => ({ content: fallbackGenres() })),
                apiRequest('/livros?size=100').catch(() => ({ content: fallbackBooks().map(b => ({
                    id: b.id,
                    generosId: b.generoId,
                    generoNome: b.category,
                    titulo: b.title,
                    autor: b.author,
                    descricao: b.description,
                    anoPublicacao: b.year,
                    isbn: b.isbn,
                    quantidadeDisponivel: b.stock,
                    statusLivro: b.statusLivro
                })) }))
            ]);

            allGenres = (genresData?.content || []).map(g => ({ id: g.id, nome: g.nome }));
            allBooks = (booksData?.content || []).map(mapBook);
            if (!allGenres.length) allGenres = fallbackGenres();
            if (!allBooks.length) allBooks = fallbackBooks();

            // Popula Chips de Categoria
            const chipsContainer = $('#home-categories');
            if (chipsContainer) {
                chipsContainer.innerHTML = [
                    `<button class="category-chip active" data-category="">Todos</button>`,
                    ...allGenres.map(g => `<button class="category-chip" data-category="${esc(g.nome)}">${esc(g.nome)}</button>`)
                ].join('');

                $$('.category-chip', chipsContainer).forEach(btn => {
                    btn.addEventListener('click', () => {
                        $$('.category-chip', chipsContainer).forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        $('#category-filter').value = btn.dataset.category;
                        applyFilters();
                    });
                });
            }

            // Popula Dropdown de Gêneros
            const catSelect = $('#category-filter');
            if (catSelect) {
                catSelect.innerHTML = [
                    `<option value="">Todos os gêneros</option>`,
                    ...allGenres.map(g => `<option value="${esc(g.nome)}">${esc(g.nome)}</option>`)
                ].join('');
            }
        } catch (err) {
            toast('Erro ao carregar dados do catálogo: ' + err.message);
        }

        const applyFilters = () => {
            const listEl = $('#catalog-list');
            if (!listEl) return;

            const q = ($('#search-book')?.value || '').trim().toLowerCase();
            const cat = $('#category-filter')?.value || '';
            const avail = $('#availability-filter')?.value || '';
            const sort = $('#sort-books')?.value || 'title';

            let filtered = allBooks.filter(b => {
                const matchQuery = !q || (`${b.title} ${b.author} ${b.description}`).toLowerCase().includes(q);
                const matchCat = !cat || b.category.toLowerCase() === cat.toLowerCase();
                const matchAvail = !avail || (avail === 'yes' ? b.available : !b.available);
                return matchQuery && matchCat && matchAvail;
            });

            filtered.sort((a, b) => {
                if (sort === 'year') return b.year - a.year;
                return a.title.localeCompare(b.title, 'pt-BR');
            });

            listEl.innerHTML = filtered.length
                ? filtered.map(bookCard).join('')
                : `<div class="empty-state" style="grid-column:1/-1">Nenhum livro encontrado com os filtros selecionados.</div>`;

            const countEl = $('#results-count');
            if (countEl) {
                countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'livro encontrado' : 'livros encontrados'}`;
            }
        };

        // Eventos de filtro
        ['search-book', 'category-filter', 'availability-filter', 'sort-books'].forEach(id => {
            const el = $('#' + id);
            if (el) el.addEventListener(id === 'search-book' ? 'input' : 'change', () => {
                if (id === 'category-filter') {
                    const selVal = el.value;
                    $$('.category-chip').forEach(b => b.classList.toggle('active', b.dataset.category === selVal || (!selVal && b.dataset.category === '')));
                }
                applyFilters();
            });
        });

        const clearBtn = $('#clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                $('#search-book').value = '';
                $('#category-filter').value = '';
                $('#availability-filter').value = '';
                $('#sort-books').value = 'title';
                $$('.category-chip').forEach(b => b.classList.toggle('active', !b.dataset.category));
                applyFilters();
            });
        }

        applyFilters();
    }

    // --- PÁGINA DETALHES DO LIVRO (livro.html) ---
    async function renderBook() {
        const id = new URLSearchParams(location.search).get('id');
        if (!id) {
            location.replace('catalogo.html');
            return;
        }

        $('#app').innerHTML = shell('catalog', `
            <main class="container section">
                <div class="empty-state">Carregando detalhes da obra...</div>
            </main>
        `);

        try {
            const raw = await apiRequest(`/livros/${id}`);
            const b = mapBook(raw);

            if (!b) {
                $('#app').innerHTML = shell('catalog', `
                    <main class="container section">
                        <div class="empty-state">
                            <h2>Livro não localizado</h2>
                            <p class="muted">A obra solicitada não existe ou foi desativada do acervo.</p>
                            <a class="btn btn-gold" href="catalogo.html">Voltar ao catálogo</a>
                        </div>
                    </main>
                `);
                return;
            }

            const content = `
                <main class="container">
                    <div class="page-head">
                        <a href="catalogo.html" class="muted">← Voltar ao catálogo</a>
                    </div>
                    <section class="detail-layout">
                        <div class="detail-cover">
                            ${cover(b)}
                        </div>
                        <div class="detail-copy">
                            <span class="eyebrow">${esc(b.category)} · Publicado em ${b.year}</span>
                            <h1>${esc(b.title)}</h1>
                            <p class="muted">por <strong>${esc(b.author)}</strong></p>
                            ${b.isbn ? `<p class="muted" style="font-size:12px">ISBN: ${esc(b.isbn)}</p>` : ''}
                            <p class="lead">${esc(b.description || 'Uma obra primorosa selecionada para o acervo The Reading Nest.')}</p>
                            
                            <div class="detail-facts">
                                <div class="fact">
                                    <small>Taxa de aluguel</small>
                                    <strong>${money(b.price)}</strong>
                                </div>
                                <div class="fact">
                                    <small>Disponibilidade</small>
                                    <strong>${b.available ? 'Disponível' : 'Esgotado'}</strong>
                                </div>
                                <div class="fact">
                                    <small>Exemplares no acervo</small>
                                    <strong>${b.stock}</strong>
                                </div>
                            </div>

                            <div class="notice" style="margin-top:20px;border-left:3px solid var(--gold);padding:14px;background:#fffaf2">
                                <strong>📍 Retirada Presencial:</strong> Solicite seu aluguel online e venha retirar seu exemplar preparado com cuidado em nossa livraria física nos Jardins (Alameda dos Alfarrábios, 1428). O prazo padrão de leitura é de 14 dias a partir da reserva.
                            </div>

                            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
                                <button class="btn btn-gold" data-action="rent" data-id="${b.id}" ${!b.available ? 'disabled' : ''}>
                                    ${b.available ? 'Solicitar aluguel online' : 'Exemplar indisponível'}
                                </button>
                                <a class="btn btn-light" href="catalogo.html">Continuar explorando</a>
                            </div>
                        </div>
                    </section>
                </main>
            `;

            $('#app').innerHTML = shell('catalog', content);
        } catch (err) {
            $('#app').innerHTML = shell('catalog', `
                <main class="container section">
                    <div class="empty-state">
                        <h2>Não foi possível carregar o livro</h2>
                        <p class="muted">${esc(err.message)}</p>
                        <a class="btn" href="catalogo.html">Voltar ao catálogo</a>
                    </div>
                </main>
            `);
        }
    }

    // --- AÇÃO DE SOLICITAR ALUGUEL ---
    async function rentBook(id) {
        const u = current();
        if (!u) {
            toast('Entre na sua conta para solicitar um aluguel.');
            setTimeout(() => { location.href = 'login.html'; }, 1000);
            return;
        }

        if (u.role !== 'cliente') {
            toast('Apenas contas de clientes podem solicitar empréstimos de livros.');
            return;
        }

        // Calcula a data de devolução prevista para 14 dias a partir de hoje (YYYY-MM-DD)
        const devDate = new Date();
        devDate.setDate(devDate.getDate() + 14);
        const dataDevolucaoPrevista = devDate.toISOString().split('T')[0];

        const payload = {
            usuarioId: u.id,
            dataDevolucaoPrevista: dataDevolucaoPrevista,
            livrosIds: [String(id)]
        };

        try {
            await apiRequest('/alugueis', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast('Aluguel solicitado com sucesso! Retire seu exemplar na livraria.');
            setTimeout(() => { location.href = 'alugueis.html'; }, 1200);
        } catch (err) {
            toast('Erro ao solicitar aluguel: ' + err.message);
        }
    }

    // --- PÁGINA LOGIN (login.html) ---
    function renderLogin() {
        const content = `
            <main class="auth-shell">
                <section class="auth-story">
                    <span class="eyebrow">UM REFÚGIO PARA QUEM AMA LER</span>
                    <h1>Histórias que merecem ser <em>vividas.</em></h1>
                    <p>Descubra nossa curadoria de livros especiais, escolha sua próxima leitura e reserve online para retirar em nossa livraria física.</p>
                    <div style="margin-top:20px">
                        <a class="btn btn-gold" href="catalogo.html">Explorar catálogo <span>↗</span></a>
                    </div>
                </section>
                <section class="auth-card-wrap">
                    <div class="auth-card">
                        <p class="eyebrow">BEM-VINDO AO SEU NINHO LITERÁRIO</p>
                        <h2>Acesso exclusivo</h2>
                        <p class="intro">Entre para gerenciar seus aluguéis e leituras.</p>

                        <form id="login-form">
                            <div class="field">
                                <label for="email">E-mail</label>
                                <input class="form-control" id="email" type="email" required placeholder="seu@email.com" autocomplete="username">
                            </div>
                            <div class="field">
                                <label for="password">Senha</label>
                                <div class="password-box">
                                    <input class="form-control" id="password" type="password" required placeholder="Digite sua senha" autocomplete="current-password">
                                    <button class="password-toggle" type="button" data-action="toggle-pass">Mostrar</button>
                                </div>
                            </div>
                            <p id="login-message" class="muted" style="min-height:20px" aria-live="polite"></p>
                            <button class="btn btn-gold" style="width:100%" type="submit">Entrar na minha conta</button>
                        </form>

                        <div class="auth-links">
                            <span>Ainda não é membro?</span>
                            <a href="cadastro.html">Criar minha conta</a>
                            <a href="catalogo.html">Ver catálogo</a>
                        </div>

                        <div class="demo-box" style="margin-top:24px;padding:14px;background:#fffaf2;border:1px dashed var(--gold);font-size:12px">
                            <strong>Contas de Teste Oficiais</strong><br>
                            Cliente: cliente@thereadingnest.com · Cliente123!<br>
                            Admin: &nbsp; admin@thereadingnest.com &nbsp; · Admin123!
                        </div>
                    </div>
                </section>
            </main>
        `;

        $('#app').innerHTML = shell('login', content);

        $('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = $('#email').value.trim();
            const senha = $('#password').value;
            const msg = $('#login-message');
            msg.textContent = 'Verificando credenciais...';
            msg.style.color = 'var(--muted)';

            try {
                const res = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, senha })
                });

                setSession(res.token, res.usuario);
                toast(`Bem-vindo, ${res.usuario.nome}!`);

                const perfil = res.usuario.perfil || res.usuario.role;
                setTimeout(() => {
                    location.href = perfil === 'admin' ? 'admin.html' : 'cliente.html';
                }, 800);
            } catch (err) {
                msg.textContent = err.message;
                msg.style.color = 'var(--red)';
            }
        });
    }

    // --- PÁGINA CADASTRO (cadastro.html) ---
    function renderRegister() {
        const content = `
            <main class="auth-shell">
                <section class="auth-story">
                    <span class="eyebrow">FAÇA PARTE DA NOSSA COMUNIDADE</span>
                    <h1>Seu próximo capítulo começa aqui.</h1>
                    <p>Cadastre-se para alugar livros com facilidade, acompanhar seus prazos e retirar obras exclusivas em nossa livraria física.</p>
                </section>
                <section class="auth-card-wrap">
                    <div class="auth-card">
                        <p class="eyebrow">NOVO MEMBRO</p>
                        <h2>Criar conta</h2>
                        <p class="intro">Preencha seus dados para começar.</p>

                        <form id="register-form">
                            <div class="field">
                                <label for="name">Nome completo</label>
                                <input class="form-control" id="name" required minlength="3" placeholder="Como podemos te chamar?">
                            </div>
                            <div class="field">
                                <label for="reg-email">E-mail</label>
                                <input class="form-control" id="reg-email" type="email" required placeholder="seu@email.com">
                            </div>
                            <div class="field">
                                <label for="reg-password">Senha</label>
                                <input class="form-control" id="reg-password" type="password" required minlength="6" placeholder="Mínimo de 6 caracteres">
                            </div>
                            <div class="field">
                                <label for="confirm-password">Confirmar senha</label>
                                <input class="form-control" id="confirm-password" type="password" required minlength="6" placeholder="Repita sua senha">
                            </div>
                            <p id="register-message" class="muted" style="min-height:20px" aria-live="polite"></p>
                            <button class="btn btn-gold" style="width:100%" type="submit">Criar minha conta</button>
                        </form>

                        <div class="auth-links">
                            <a href="login.html">Já tenho uma conta · Entrar</a>
                        </div>
                    </div>
                </section>
            </main>
        `;

        $('#app').innerHTML = shell('register', content);

        $('#register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = $('#name').value.trim();
            const email = $('#reg-email').value.trim().toLowerCase();
            const pass = $('#reg-password').value;
            const confirmPass = $('#confirm-password').value;
            const msg = $('#register-message');

            if (pass !== confirmPass) {
                msg.textContent = 'As senhas informadas não coincidem.';
                msg.style.color = 'var(--red)';
                return;
            }

            msg.textContent = 'Criando seu cadastro...';
            msg.style.color = 'var(--muted)';

            try {
                // 1. Cadastra o novo usuário (recebe perfil cliente automaticamente)
                await apiRequest('/usuarios', {
                    method: 'POST',
                    body: JSON.stringify({ nome, email, senha: pass })
                });

                // 2. Realiza o login automático
                const loginRes = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, senha: pass })
                });

                setSession(loginRes.token, loginRes.usuario);
                toast('Conta criada com sucesso! Bem-vindo ao The Reading Nest.');
                setTimeout(() => { location.href = 'cliente.html'; }, 800);
            } catch (err) {
                msg.textContent = err.message;
                msg.style.color = 'var(--red)';
            }
        });
    }

    // --- PÁGINA MINHA CONTA (cliente.html) ---
    async function renderAccount() {
        if (!requireAuth()) return;
        const u = current();
        const isAdmin = u.role === 'admin';

        let mine = [];
        let active = [];

        if (!isAdmin) {
            try {
                const data = await apiRequest(`/usuarios/${u.id}/alugueis?size=50`);
                mine = data?.content || [];
                active = mine.filter(r => r.status === 'ativo' || r.status === 'atrasado');
            } catch (err) {
                // Histórico não carregado ou vazio
            }
        }

        const content = `
            <main class="container section">
                <div class="page-head">
                    <span class="eyebrow">SEU ESPAÇO PESSOAL</span>
                    <h1>Minha conta</h1>
                    <p>Bem-vindo de volta, ${esc(u.name.split(' ')[0])}. Aqui você visualiza seus dados cadastrais e acessa as áreas do sistema.</p>
                </div>
                <div class="profile-layout">
                    <aside class="profile-menu">
                        <div class="profile-summary">
                            <div class="avatar">${initials(u.name)}</div>
                            <div>
                                <strong>${esc(u.name)}</strong>
                                <div class="muted" style="color:var(--gold);font-size:11px">
                                    ${isAdmin ? 'Administrador Geral' : 'Membro Reading Nest'}
                                </div>
                            </div>
                        </div>
                        <a class="active" href="cliente.html">Visão geral</a>
                        ${!isAdmin ? `<a href="alugueis.html">Meus aluguéis</a>` : ''}
                        ${isAdmin ? `<a href="admin.html">Painel administrativo</a>` : ''}
                        <a href="catalogo.html">Explorar catálogo</a>
                        <a href="sobre.html">Sobre a livraria</a>
                        <a href="#" data-action="logout">Sair da conta</a>
                    </aside>
                    <section>
                        <div class="dashboard-grid">
                            ${!isAdmin ? `
                                <div class="stat-card">
                                    <small>Aluguéis solicitados</small>
                                    <strong>${mine.length}</strong>
                                </div>
                                <div class="stat-card">
                                    <small>Em andamento</small>
                                    <strong>${active.length}</strong>
                                </div>
                                <div class="stat-card">
                                    <small>Status cadastral</small>
                                    <strong style="font-size:20px;color:var(--green)">Ativo</strong>
                                </div>
                            ` : `
                                <div class="stat-card">
                                    <small>Nível de Acesso</small>
                                    <strong style="font-size:20px;color:var(--gold)">Admin</strong>
                                </div>
                                <div class="stat-card">
                                    <small>Operações</small>
                                    <strong style="font-size:20px">Total</strong>
                                </div>
                                <div class="stat-card">
                                    <small>Status cadastral</small>
                                    <strong style="font-size:20px;color:var(--green)">Ativo</strong>
                                </div>
                            `}
                        </div>

                        ${isAdmin ? `
                            <div class="panel" style="margin:20px 0;background:#fffaf2;border:1px solid var(--gold)">
                                <h3 style="font:600 22px var(--serif);margin-top:0">Acesso ao Painel Administrativo</h3>
                                <p class="muted">Como administrador, você gerencia o acervo físico, cadastra novos livros, ativa/desativa títulos e controla devoluções.</p>
                                <a class="btn btn-gold" href="admin.html">Abrir Painel Admin →</a>
                            </div>
                        ` : ''}

                        <div class="panel">
                            <h2>Seus dados cadastrais</h2>
                            <div class="field">
                                <label>Nome completo</label>
                                <input class="form-control" value="${esc(u.name)}" disabled>
                            </div>
                            <div class="field">
                                <label>E-mail cadastrado</label>
                                <input class="form-control" value="${esc(u.email)}" disabled>
                            </div>
                            <div class="field">
                                <label>Perfil de usuário</label>
                                <input class="form-control" value="${isAdmin ? 'Administrador da Biblioteca' : 'Cliente Leitor'}" disabled>
                            </div>
                            <p class="muted" style="font-size:11px">Para atualizar seus dados de e-mail ou nome, consulte a administração da livraria.</p>
                        </div>

                        ${!isAdmin ? `
                            <div class="panel">
                                <h2>Próxima leitura</h2>
                                <p class="muted">Encontre novos títulos disponíveis para aluguel e retirada na nossa livraria física.</p>
                                <a class="btn btn-gold" href="catalogo.html">Explorar catálogo</a>
                            </div>
                        ` : ''}
                    </section>
                </div>
            </main>
        `;

        $('#app').innerHTML = shell('account', content);
    }

    // --- PÁGINA MEUS ALUGUÉIS (alugueis.html) ---
    async function renderRentals() {
        if (!requireRole('cliente')) return;
        const u = current();

        $('#app').innerHTML = shell('rentals', `
            <main class="container section">
                <div class="empty-state">Carregando seus aluguéis...</div>
            </main>
        `);

        try {
            const data = await apiRequest(`/usuarios/${u.id}/alugueis?size=50`);
            const rentals = data?.content || [];

            // Busca detalhes de livros dos aluguéis em paralelo
            const detailedRentals = await Promise.all(
                rentals.map(async (r) => {
                    try {
                        const detail = await apiRequest(`/alugueis/${r.id}`);
                        const bookTitles = (detail?.livros || []).map(l => l.titulo).join(', ');
                        return { ...r, bookTitle: bookTitles || 'Livro da Biblioteca' };
                    } catch {
                        return { ...r, bookTitle: 'Empréstimo #' + r.id.slice(0, 8) };
                    }
                })
            );

            const content = `
                <main class="container section">
                    <div class="page-head">
                        <span class="eyebrow">SUA BIBLIOTECA PESSOAL</span>
                        <h1>Meus aluguéis</h1>
                        <p>Acompanhe seus pedidos de aluguel para retirada presencial na livraria e controle seus prazos de devolução.</p>
                    </div>

                    <div class="notice" style="margin-bottom:24px;border-left:3px solid var(--gold);padding:14px;background:#fffaf2">
                        📍 <strong>Local de Retirada & Devolução:</strong> Alameda dos Alfarrábios, 1428 — Jardins. Apresente seu nome no balcão de atendimento.
                    </div>

                    <section class="panel">
                        <h2>Histórico de pedidos</h2>
                        ${detailedRentals.length ? `
                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Livro(s)</th>
                                            <th>Data do Pedido</th>
                                            <th>Devolução Prevista</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detailedRentals.map(r => {
                                            const isPending = r.status === 'ativo';
                                            const isLate = r.status === 'atrasado';
                                            const statusClass = isPending ? 'pending' : (isLate ? 'cancelled' : '');
                                            const statusLabel = r.status === 'ativo' ? 'Ativo (Em leitura)' : (r.status === 'atrasado' ? 'Atrasado' : 'Concluído');
                                            return `
                                                <tr>
                                                    <td><strong>${esc(r.bookTitle)}</strong></td>
                                                    <td>${r.dataAluguel ? new Date(r.dataAluguel).toLocaleDateString('pt-BR') : '-'}</td>
                                                    <td>${r.dataDevolucaoPrevista ? new Date(r.dataDevolucaoPrevista + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                                                    <td><span class="status ${statusClass}">${esc(statusLabel)}</span></td>
                                                    <td>
                                                        ${(isPending || isLate) ? `
                                                            <div style="display:flex;gap:6px;flex-wrap:wrap">
                                                                <button class="btn btn-small btn-light" data-action="return-rental" data-id="${r.id}" title="Devolver livro à biblioteca">Devolver</button>
                                                                <button class="btn btn-small btn-danger" data-action="cancel-rental" data-id="${r.id}" title="Cancelar aluguel">Cancelar</button>
                                                            </div>
                                                        ` : `<span class="muted" style="font-size:12px">Finalizado</span>`}
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="empty-state">
                                <p>Você ainda não realizou nenhum pedido de aluguel.</p>
                                <a class="btn btn-gold" href="catalogo.html">Encontrar meu próximo livro</a>
                            </div>
                        `}
                    </section>
                </main>
            `;

            $('#app').innerHTML = shell('rentals', content);
        } catch (err) {
            $('#app').innerHTML = shell('rentals', `
                <main class="container section">
                    <div class="empty-state">
                        <h2>Não foi possível carregar os aluguéis</h2>
                        <p class="muted">${esc(err.message)}</p>
                        <a class="btn" href="catalogo.html">Ir para o catálogo</a>
                    </div>
                </main>
            `);
        }
    }

    // --- PÁGINA SOBRE NÓS (sobre.html) ---
    function renderAbout() {
        const content = `
            <main>
                <section class="hero" style="min-height:350px">
                    <div class="hero-copy">
                        <span class="eyebrow">NOSSA HISTÓRIA</span>
                        <h1>Mais do que livros. <em>Encontros.</em></h1>
                        <p>Acreditamos que cada livro guarda uma possibilidade: uma descoberta, uma memória, uma nova forma de enxergar o mundo.</p>
                    </div>
                    <div class="hero-art">
                        <div class="book-cover" style="height:260px;width:180px">
                            <small>THE READING NEST</small>
                            <strong>Histórias<br>que ficam</strong>
                            <span>Desde sempre, leitores</span>
                        </div>
                    </div>
                </section>

                <section class="section container">
                    <div class="section-title">
                        <div>
                            <span class="eyebrow">QUEM SOMOS</span>
                            <h2>Um ninho para boas histórias</h2>
                        </div>
                    </div>
                    <p style="max-width:780px;line-height:1.9;color:var(--muted)">
                        The Reading Nest nasceu da ideia de tornar a leitura uma experiência acolhedora e especial. Nossa biblioteca física, localizada no charmoso bairro dos Jardins em São Paulo, reúne títulos clássicos e modernos, com uma curadoria pensada para leitores curiosos, apaixonados e para quem deseja começar uma nova jornada entre páginas.
                    </p>
                </section>

                <section class="section container">
                    <div class="section-title">
                        <div>
                            <span class="eyebrow">O QUE NOS GUIA</span>
                            <h2>Nossos valores</h2>
                        </div>
                    </div>
                    <div class="values-grid">
                        <article class="value-card">
                            <span class="symbol">✦</span>
                            <h3>Excelência</h3>
                            <p>Cuidamos da conservação física dos livros e da experiência presencial para que cada encontro com uma obra seja memorável.</p>
                        </article>
                        <article class="value-card">
                            <span class="symbol">❧</span>
                            <h3>Conhecimento</h3>
                            <p>Acreditamos na leitura como caminho transformador para aprender, imaginar e ampliar horizontes com liberdade.</p>
                        </article>
                        <article class="value-card">
                            <span class="symbol">♡</span>
                            <h3>Comunidade</h3>
                            <p>Aproximamos leitores em um ambiente acolhedor, onde alugar um livro físico significa também desacelerar e viver a história.</p>
                        </article>
                    </div>
                </section>
            </main>
        `;

        $('#app').innerHTML = shell('about', content);
    }

    // --- PAINEL ADMINISTRATIVO (admin.html) ---
    async function renderAdmin() {
        if (!requireRole('admin')) return;

        $('#app').innerHTML = shell('admin', `
            <main class="container section">
                <div class="empty-state">Carregando painel de administração...</div>
            </main>
        `);

        try {
            const [booksData, rentalsData, genresData] = await Promise.all([
                apiRequest('/livros?size=100').catch(() => ({ content: [] })),
                apiRequest('/alugueis?size=50').catch(() => ({ content: [] })),
                apiRequest('/generos?size=100').catch(() => ({ content: [] }))
            ]);

            const books = (booksData?.content || []).map(mapBook);
            const rentals = rentalsData?.content || [];
            const genres = (genresData?.content || []).map(g => ({ id: g.id, nome: g.nome }));

            const totalBooks = books.length;
            const stockTotal = books.reduce((acc, b) => acc + (b.stock || 0), 0);
            const totalRentals = rentals.length;
            const pendingRentals = rentals.filter(r => r.status === 'ativo' || r.status === 'atrasado').length;

            const content = `
                <main class="admin-shell">
                    <aside class="admin-sidebar">
                        <p class="eyebrow">ADMINISTRAÇÃO</p>
                        <a class="active" href="admin.html">▦ &nbsp; Visão geral</a>
                        <a href="#books-admin">▤ &nbsp; Gerenciar acervo</a>
                        <a href="#rentals-admin">⇄ &nbsp; Gerenciar aluguéis</a>
                        <a href="catalogo.html">⌕ &nbsp; Ver catálogo</a>
                        <a href="cliente.html">👤 &nbsp; Minha conta</a>
                        <a href="#" data-action="logout">↪ &nbsp; Sair</a>
                    </aside>

                    <section class="admin-main">
                        <div class="admin-top">
                            <div>
                                <span class="eyebrow">THE READING NEST</span>
                                <h1>Painel administrativo</h1>
                                <p class="muted">Gestão integrada do acervo de livros e controle operacional dos aluguéis.</p>
                            </div>
                            <span class="pill" style="background:var(--gold);color:#191813;font-weight:700">Administrador</span>
                        </div>

                        <div class="admin-stats" style="margin:24px 0">
                            <div class="stat-card">
                                <small>Títulos no acervo</small>
                                <strong>${totalBooks}</strong>
                            </div>
                            <div class="stat-card">
                                <small>Exemplares em estoque</small>
                                <strong>${stockTotal}</strong>
                            </div>
                            <div class="stat-card">
                                <small>Empréstimos registrados</small>
                                <strong>${totalRentals}</strong>
                            </div>
                            <div class="stat-card">
                                <small>Aluguéis em andamento</small>
                                <strong>${pendingRentals}</strong>
                            </div>
                        </div>

                        <!-- Gestão do Acervo de Livros -->
                        <section class="panel" id="books-admin">
                            <div class="section-title">
                                <div>
                                    <span class="eyebrow">CONTROLE DE ACERVO</span>
                                    <h2>Gerenciar livros</h2>
                                </div>
                                <button class="btn btn-small btn-gold" data-action="add-book">+ Adicionar livro</button>
                            </div>

                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Livro</th>
                                            <th>Gênero</th>
                                            <th>Estoque</th>
                                            <th>Situação</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${books.map(b => `
                                            <tr>
                                                <td>
                                                    <strong>${esc(b.title)}</strong><br>
                                                    <span class="muted">${esc(b.author)} (${b.year})</span>
                                                </td>
                                                <td><span class="pill">${esc(b.category)}</span></td>
                                                <td><strong>${b.stock}</strong> un.</td>
                                                <td>
                                                    <span class="status ${b.statusLivro === 'ativo' ? 'pending' : 'cancelled'}">
                                                        ${b.statusLivro === 'ativo' ? 'Ativo' : 'Desativado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="admin-actions">
                                                        <button class="btn btn-light btn-small" data-action="edit-book" data-id="${b.id}">Editar</button>
                                                        <button class="btn btn-small ${b.statusLivro === 'ativo' ? 'btn-danger' : 'btn-gold'}" data-action="toggle-book" data-id="${b.id}">
                                                            ${b.statusLivro === 'ativo' ? 'Desativar' : 'Ativar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <!-- Gestão de Aluguéis e Devoluções -->
                        <section class="panel" id="rentals-admin" style="margin-top:30px">
                            <div class="section-title">
                                <div>
                                    <span class="eyebrow">BALCÃO DE ATENDIMENTO</span>
                                    <h2>Gerenciar aluguéis</h2>
                                </div>
                            </div>
                            ${rentals.length ? `
                                <div class="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Cliente</th>
                                                <th>Empréstimo</th>
                                                <th>Data do Aluguel</th>
                                                <th>Prazo Devolução</th>
                                                <th>Status</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rentals.map(r => `
                                                <tr>
                                                    <td><strong>${esc(r.usuarioNome || 'Cliente')}</strong></td>
                                                    <td>#${esc(r.id.slice(0, 8))}</td>
                                                    <td>${r.dataAluguel ? new Date(r.dataAluguel).toLocaleDateString('pt-BR') : '-'}</td>
                                                    <td>${r.dataDevolucaoPrevista ? new Date(r.dataDevolucaoPrevista + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                                                    <td>
                                                        <span class="status ${r.status === 'ativo' ? 'pending' : (r.status === 'atrasado' ? 'cancelled' : '')}">
                                                            ${esc(r.status === 'ativo' ? 'Ativo' : (r.status === 'atrasado' ? 'Atrasado' : 'Concluído'))}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${r.status !== 'concluido' ? `
                                                            <div style="display:flex;gap:6px">
                                                                <button class="btn btn-small btn-light" data-action="return-rental" data-id="${r.id}" title="Registrar devolução e repor estoque">Devolver</button>
                                                                <button class="btn btn-small btn-danger" data-action="cancel-rental" data-id="${r.id}" title="Cancelar aluguel e repor estoque">Cancelar</button>
                                                            </div>
                                                        ` : `<span class="muted" style="font-size:12px">Concluído</span>`}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : `<div class="empty-state">Nenhuma solicitação de aluguel registrada até o momento.</div>`}
                        </section>
                    </section>
                </main>
            `;

            $('#app').innerHTML = shell('admin', content);

            // Vincula os livros e gêneros na janela para uso dos modais
            window._adminBooks = books;
            window._adminGenres = genres;
        } catch (err) {
            $('#app').innerHTML = shell('admin', `
                <main class="container section">
                    <div class="empty-state">
                        <h2>Erro ao carregar o painel administrativo</h2>
                        <p class="muted">${esc(err.message)}</p>
                        <a class="btn" href="index.html">Voltar ao início</a>
                    </div>
                </main>
            `);
        }
    }

    // --- MODAL DE CADASTRO E EDIÇÃO DE LIVRO ---
    async function openBookModal(id = null) {
        let b = {
            titulo: '',
            autor: '',
            generoId: '',
            anoPublicacao: new Date().getFullYear(),
            quantidadeDisponivel: 1,
            isbn: '',
            descricao: '',
            statusLivro: 'ativo'
        };

        if (id) {
            try {
                const fetched = await apiRequest(`/livros/${id}`);
                b = {
                    titulo: fetched.titulo,
                    autor: fetched.autor,
                    generoId: fetched.generoId || fetched.generosId,
                    anoPublicacao: fetched.anoPublicacao,
                    quantidadeDisponivel: fetched.quantidadeDisponivel,
                    isbn: fetched.isbn || '',
                    descricao: fetched.descricao || '',
                    statusLivro: fetched.statusLivro || 'ativo'
                };
            } catch (err) {
                toast('Erro ao carregar dados do livro: ' + err.message);
                return;
            }
        }

        let genres = window._adminGenres || [];
        if (!genres.length) {
            try {
                const res = await apiRequest('/generos?size=100');
                genres = res?.content || [];
            } catch {}
        }

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML = `
            <div class="modal">
                <div class="modal-head">
                    <h2>${id ? 'Editar obra' : 'Cadastrar novo livro'}</h2>
                    <button class="close-modal" data-close aria-label="Fechar">×</button>
                </div>
                <form id="book-form">
                    <div class="field">
                        <label for="f-titulo">Título da obra</label>
                        <input class="form-control" id="f-titulo" name="titulo" required value="${esc(b.titulo)}">
                    </div>

                    <div class="field">
                        <label for="f-autor">Autor ou Autora</label>
                        <input class="form-control" id="f-autor" name="autor" required value="${esc(b.autor)}">
                    </div>

                    <div class="form-row">
                        <div class="field">
                            <label for="f-genero">Gênero literário</label>
                            <select class="form-control" id="f-genero" name="generoId" required>
                                <option value="">Selecione um gênero</option>
                                ${genres.map(g => `
                                    <option value="${g.id}" ${b.generoId === g.id ? 'selected' : ''}>${esc(g.nome)}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="field">
                            <label for="f-ano">Ano de publicação</label>
                            <input class="form-control" id="f-ano" name="anoPublicacao" type="number" min="1000" max="2100" required value="${b.anoPublicacao}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="field">
                            <label for="f-estoque">Quantidade em estoque</label>
                            <input class="form-control" id="f-estoque" name="quantidadeDisponivel" type="number" min="0" required value="${b.quantidadeDisponivel}">
                        </div>
                        <div class="field">
                            <label for="f-status">Situação do livro</label>
                            <select class="form-control" id="f-status" name="statusLivro">
                                <option value="ativo" ${b.statusLivro === 'ativo' ? 'selected' : ''}>Ativo</option>
                                <option value="desativado" ${b.statusLivro === 'desativado' ? 'selected' : ''}>Desativado</option>
                            </select>
                        </div>
                    </div>

                    <div class="field">
                        <label for="f-isbn">Código ISBN (opcional)</label>
                        <input class="form-control" id="f-isbn" name="isbn" placeholder="Ex.: 9788535910663" value="${esc(b.isbn)}">
                    </div>

                    <div class="field">
                        <label for="f-descricao">Sinopse / Descrição da obra</label>
                        <textarea class="form-control" id="f-descricao" name="descricao" rows="4">${esc(b.descricao)}</textarea>
                    </div>

                    <p id="book-modal-error" class="muted" style="color:var(--red)"></p>

                    <button class="btn btn-gold" style="width:100%" type="submit">
                        ${id ? 'Salvar alterações' : 'Cadastrar no acervo'}
                    </button>
                </form>
            </div>
        `;

        document.body.append(backdrop);

        backdrop.addEventListener('click', e => {
            if (e.target === backdrop || e.target.closest('[data-close]')) backdrop.remove();
        });

        $('#book-form', backdrop).addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const errEl = $('#book-modal-error', backdrop);
            errEl.textContent = '';

            const generoId = fd.get('generoId');
            if (!generoId) {
                errEl.textContent = 'Selecione um gênero literário para a obra.';
                return;
            }

            const payload = {
                generosId: generoId,
                titulo: String(fd.get('titulo') || '').trim(),
                autor: String(fd.get('autor') || '').trim(),
                descricao: String(fd.get('descricao') || '').trim() || null,
                anoPublicacao: Number(fd.get('anoPublicacao')),
                isbn: String(fd.get('isbn') || '').trim() || null,
                quantidadeDisponivel: Number(fd.get('quantidadeDisponivel')),
                statusLivro: fd.get('statusLivro') || 'ativo'
            };

            try {
                if (id) {
                    await apiRequest(`/livros/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                    toast('Livro atualizado com sucesso!');
                } else {
                    await apiRequest('/livros', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    toast('Novo livro adicionado ao acervo!');
                }

                backdrop.remove();
                await renderAdmin();
            } catch (err) {
                errEl.textContent = err.message;
            }
        });
    }

    // --- ATIVAR OU DESATIVAR LIVRO (data-action="toggle-book") ---
    async function toggleBook(id) {
        try {
            const currentBook = await apiRequest(`/livros/${id}`);
            const nextStatus = currentBook.statusLivro === 'ativo' ? 'desativado' : 'ativo';

            const payload = {
                generosId: currentBook.generoId || currentBook.generosId,
                titulo: currentBook.titulo,
                autor: currentBook.autor,
                descricao: currentBook.descricao,
                anoPublicacao: currentBook.anoPublicacao,
                isbn: currentBook.isbn,
                quantidadeDisponivel: currentBook.quantidadeDisponivel,
                statusLivro: nextStatus
            };

            await apiRequest(`/livros/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            toast(`Livro ${nextStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
            await renderAdmin();
        } catch (err) {
            toast('Erro ao alterar status do livro: ' + err.message);
        }
    }

    // --- DEVOLVER ALUGUEL (data-action="return-rental") ---
    async function returnRental(id) {
        if (!confirm('Confirmar a devolução deste livro e reposição ao estoque físico?')) return;
        try {
            await apiRequest(`/alugueis/${id}/devolver`, { method: 'POST' });
            toast('Devolução confirmada com sucesso! O exemplar retornou ao estoque.');
            if (page === 'admin') {
                await renderAdmin();
            } else {
                await renderRentals();
            }
        } catch (err) {
            toast('Erro ao registrar devolução: ' + err.message);
        }
    }

    // --- CANCELAR ALUGUEL (data-action="cancel-rental") ---
    async function cancelRental(id) {
        if (!confirm('Deseja realmente cancelar este aluguel? O livro retornará ao estoque disponível.')) return;
        try {
            await apiRequest(`/alugueis/${id}/cancelar`, { method: 'POST' });
            toast('Aluguel cancelado e exemplar reposto ao acervo.');
            if (page === 'admin') {
                await renderAdmin();
            } else {
                await renderRentals();
            }
        } catch (err) {
            toast('Erro ao cancelar aluguel: ' + err.message);
        }
    }

    // =========================================================================
    // 6. Delegação Global de Eventos de Clique
    // =========================================================================
    document.addEventListener('click', (e) => {
        // Toggle Menu Mobile
        if (e.target.id === 'menu-toggle' || e.target.closest('#menu-toggle')) {
            $('#main-nav')?.classList.toggle('open');
            return;
        }

        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;

        if (action === 'logout') {
            e.preventDefault();
            logout();
        }

        if (action === 'toggle-pass') {
            const input = $('#password');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                actionEl.textContent = isPassword ? 'Ocultar' : 'Mostrar';
            }
        }

        if (action === 'rent') {
            rentBook(actionEl.dataset.id);
        }

        if (action === 'add-book') {
            openBookModal();
        }

        if (action === 'edit-book') {
            openBookModal(actionEl.dataset.id);
        }

        if (action === 'toggle-book') {
            toggleBook(actionEl.dataset.id);
        }

        if (action === 'return-rental') {
            returnRental(actionEl.dataset.id);
        }

        if (action === 'cancel-rental') {
            cancelRental(actionEl.dataset.id);
        }
    });

    // =========================================================================
    // 7. Roteamento por Página (data-page)
    // =========================================================================
    const renderers = {
        home: renderHome,
        catalog: renderCatalog,
        book: renderBook,
        login: renderLogin,
        register: renderRegister,
        account: renderAccount,
        rentals: renderRentals,
        about: renderAbout,
        admin: renderAdmin
    };

    const run = renderers[page] || renderHome;
    run();

})();
