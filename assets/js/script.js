// Slide imagens 

    document.addEventListener('DOMContentLoaded', () => {
        const track = document.getElementById('hotel-track');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        // Distância do deslocamento: Largura do card (260px) + gap (24px)
        const scrollAmount = 284; 

        if(btnNext && track) {
            btnNext.addEventListener('click', () => {
                track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        if(btnPrev && track) {
            btnPrev.addEventListener('click', () => {
                track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }
    });

    // ── Header scroll effect ──
    const header = document.getElementById('site-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ── Botão WhatsApp fixo — aparece ao sair do hero (85% de 100vh) ──
    const wppFixo = document.getElementById('whatsapp-fixo');
    if (wppFixo) {
        const checarWpp = () => {
            wppFixo.classList.toggle('visivel', window.scrollY > window.innerHeight * 0.85);
        };
        window.addEventListener('scroll', checarWpp, { passive: true });
        checarWpp();
    }

    // ── Barra de reserva → WhatsApp com datas preenchidas ──
    function reservarViaWpp() {
        const checkin  = document.getElementById('checkin')?.value;
        const checkout = document.getElementById('checkout')?.value;
        const hospedes = document.getElementById('hospedes')?.value || '2 hóspedes';

        let msg = 'Olá! Gostaria de reservar o Refúgio da Mata.';

        if (checkin && checkout) {
            const fmtData = (s) => {
                const [y, m, d] = s.split('-');
                return `${d}/${m}/${y}`;
            };
            msg = `Olá! Gostaria de reservar o Refúgio da Mata.\n\n📅 Check-in: ${fmtData(checkin)}\n📅 Check-out: ${fmtData(checkout)}\n👥 Hóspedes: ${hospedes}\n\nPodem confirmar a disponibilidade?`;
        } else if (checkin) {
            msg = `Olá! Gostaria de reservar o Refúgio da Mata a partir de ${checkin.split('-').reverse().join('/')}. Podem me informar a disponibilidade?`;
        }

        window.open('https://wa.me/5541996366554?text=' + encodeURIComponent(msg), '_blank');
    }

    // ── Mobile menu ──
    const menuToggle = document.getElementById('menu-toggle');
    const navMobile  = document.getElementById('nav-mobile');

    menuToggle.addEventListener('click', () => {
        navMobile.classList.toggle('open');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });

    navMobile.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMobile.classList.remove('open');
            const icon = menuToggle.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        });
    });

    // ── Scroll reveal ──
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });

    revealEls.forEach(el => observer.observe(el));

    // ── Carousel (sobre) ──
    const track   = document.getElementById('hotel-track');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    if (track && btnNext && btnPrev) {
        const cardWidth = () => {
            const card = track.querySelector('.carousel-card');
            return card ? card.offsetWidth + 20 : 260;
        };
        btnNext.addEventListener('click', () => track.scrollBy({ left:  cardWidth(), behavior: 'smooth' }));
        btnPrev.addEventListener('click', () => track.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
    }

    // ── FAQ accordion ──
    document.querySelectorAll('.faq-pergunta').forEach(btn => {
        btn.addEventListener('click', () => {
            const item     = btn.closest('.faq-item');
            const resposta = item.querySelector('.faq-resposta');
            const isOpen   = btn.getAttribute('aria-expanded') === 'true';

            // Fecha todos
            document.querySelectorAll('.faq-pergunta').forEach(b => {
                b.setAttribute('aria-expanded', 'false');
                b.closest('.faq-item').querySelector('.faq-resposta').classList.remove('open');
            });

            if (!isOpen) {
                btn.setAttribute('aria-expanded', 'true');
                resposta.classList.add('open');
            }
        });
    });

    // ── Formulário de contato ──
    function handleForm(e) {
        e.preventDefault();
        const success = document.getElementById('form-success');
        success.classList.add('show');
        e.target.reset();
        setTimeout(() => success.classList.remove('show'), 5000);
    }

    // ── Datas de reserva: mínimo = hoje ──
    const today    = new Date().toISOString().split('T')[0];
    const checkin  = document.getElementById('checkin');
    const checkout = document.getElementById('checkout');

    if (checkin && checkout) {
        checkin.min  = today;
        checkout.min = today;
        checkin.addEventListener('change', () => { checkout.min = checkin.value; });
    }

    // ════════════════════════════════════════════
    //  LIGHTBOX — Refúgio da Mata
    //  Adicione quantas fotos quiser em `fotos[]`
    // ════════════════════════════════════════════
    const fotos = [
        { src: 'assets/image/Hidro + vista.jpeg', label: 'Vista das Montanhas' },
        { src: 'assets/image/quarto.jpeg',         label: 'Quarto' },
        { src: 'assets/image/hidro.jpeg',          label: 'Hidromassagem' },
        { src: 'assets/image/cozinha.jpeg',        label: 'Cozinha' },
        { src: 'assets/image/quarto2.jpeg',        label: 'Suíte' },
        { src: 'assets/image/cozinha2.jpeg',       label: 'Cozinha — detalhe' },
        // ↓ adicione mais fotos aqui:
        // { src: 'assets/image/NOME.jpeg', label: 'Legenda' },
    ];

    let indiceAtual = 0;

    function abrirLightbox(index) {
        indiceAtual = index;
        const lb = document.getElementById('lightbox');
        lb.classList.add('ativo');
        document.body.style.overflow = 'hidden';
        renderizarThumbs();
        atualizarFoto();
    }

    function fecharLightbox() {
        document.getElementById('lightbox').classList.remove('ativo');
        document.body.style.overflow = '';
    }

    function fecharLightboxFora(e) {
        if (e.target.id === 'lightbox') fecharLightbox();
    }

    function navegarLightbox(dir) {
        indiceAtual = (indiceAtual + dir + fotos.length) % fotos.length;
        atualizarFoto();
    }

    function atualizarFoto() {
        const foto = fotos[indiceAtual];
        const img  = document.getElementById('lb-img');
        img.style.opacity = 0;
        setTimeout(() => {
            img.src = foto.src;
            img.alt = foto.label;
            img.style.opacity = 1;
        }, 150);
        document.getElementById('lb-label').textContent   = foto.label;
        document.getElementById('lb-counter').textContent = `${indiceAtual + 1} / ${fotos.length}`;
        // miniatura ativa + scroll automático
        document.querySelectorAll('.lb-thumb').forEach((t, i) => {
            const ativo = i === indiceAtual;
            t.classList.toggle('ativo', ativo);
            if (ativo) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    }

    function renderizarThumbs() {
        const container = document.getElementById('lb-thumbs');
        container.innerHTML = '';
        fotos.forEach((f, i) => {
            const div = document.createElement('div');
            div.className = 'lb-thumb' + (i === indiceAtual ? ' ativo' : '');
            div.onclick = () => { indiceAtual = i; atualizarFoto(); };
            const img = document.createElement('img');
            img.src = f.src;
            img.alt = f.label;
            div.appendChild(img);
            container.appendChild(div);
        });
    }

    // Teclado
    document.addEventListener('keydown', (e) => {
        const lb = document.getElementById('lightbox');
        if (!lb.classList.contains('ativo')) return;
        if (e.key === 'ArrowRight') navegarLightbox(1);
        if (e.key === 'ArrowLeft')  navegarLightbox(-1);
        if (e.key === 'Escape')     fecharLightbox();
    });

    // ════════════════════════════════════════════
    //  CALENDÁRIO DE DISPONIBILIDADE
    //  Consome ical-proxy.php e renderiza 2 meses
    // ════════════════════════════════════════════
    (function () {

        const PROXY_URL = 'ical-proxy.php';
        const MESES_PT  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const DIAS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

        let datasOcupadas = new Set();
        let mesBase = new Date();
        mesBase.setDate(1);
        mesBase.setHours(0,0,0,0);

        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        // Aguarda o DOM estar pronto
        function init() {
            const elLoading = document.getElementById('cal-loading');
            const elNav     = document.getElementById('cal-nav');
            const elMeses   = document.getElementById('cal-meses');
            const elLegenda = document.getElementById('cal-legenda');
            const elCta     = document.getElementById('cal-cta');
            const elBadge   = document.getElementById('cal-demo-badge');
            const btnPrev   = document.getElementById('cal-prev');
            const btnNext   = document.getElementById('cal-next');

            // Se a seção não existe na página, encerra
            if (!elLoading) return;

            async function carregarDados() {
                try {
                    const res  = await fetch(PROXY_URL + '?t=' + Date.now());
                    const data = await res.json();
                    if (data.datas_ocupadas) datasOcupadas = new Set(data.datas_ocupadas);
                    if (data.demo) elBadge.style.display = 'flex';
                } catch (e) {
                    // PHP não disponível (ex: ambiente local) — usa demo JS
                    datasOcupadas = gerarDemoJS();
                    elBadge.style.display = 'flex';
                } finally {
                    elLoading.style.display = 'none';
                    elNav.style.display     = 'flex';
                    elLegenda.style.display = 'flex';
                    elCta.style.display     = 'flex';
                    renderizar();
                }
            }

            function renderizar() {
                elMeses.innerHTML = '';
                const mes1 = new Date(mesBase.getFullYear(), mesBase.getMonth(), 1);
                const mes2 = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1);
                elMeses.appendChild(renderizarMes(mes1));
                elMeses.appendChild(renderizarMes(mes2));

                // Desabilita "anterior" se já estamos no mês atual
                const hojeM = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                btnPrev.disabled = mes1 <= hojeM;
            }

            function renderizarMes(data) {
                const wrap = document.createElement('div');
                wrap.className = 'cal-mes';

                const titulo = document.createElement('div');
                titulo.className = 'cal-mes-titulo';
                titulo.textContent = MESES_PT[data.getMonth()] + ' ' + data.getFullYear();
                wrap.appendChild(titulo);

                const grid = document.createElement('div');
                grid.className = 'cal-grid';

                // Cabeçalho Dom–Sáb
                DIAS_PT.forEach(d => {
                    const dow = document.createElement('div');
                    dow.className = 'cal-dow';
                    dow.textContent = d;
                    grid.appendChild(dow);
                });

                // Células vazias antes do dia 1
                const primeiroDow = new Date(data.getFullYear(), data.getMonth(), 1).getDay();
                for (let i = 0; i < primeiroDow; i++) {
                    const v = document.createElement('div');
                    v.className = 'cal-dia vazio';
                    grid.appendChild(v);
                }

                // Dias do mês
                const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                    const dt = new Date(data.getFullYear(), data.getMonth(), d);
                    dt.setHours(0,0,0,0);
                    const chave  = fmt(dt);
                    const celula = document.createElement('div');
                    celula.textContent = d;

                    if (dt < hoje) {
                        celula.className = 'cal-dia passado';
                    } else if (datasOcupadas.has(chave)) {
                        celula.className = 'cal-dia ocupado';
                        celula.title = 'Indisponível';
                    } else {
                        celula.className = 'cal-dia disponivel';
                        celula.title = 'Disponível — clique para reservar';
                        celula.addEventListener('click', () => {
                            const dataFmt = `${String(d).padStart(2,'0')}/${String(data.getMonth()+1).padStart(2,'0')}/${data.getFullYear()}`;
                            const msg = `Olá! Vi que o dia ${dataFmt} está disponível no Refúgio da Mata. Gostaria de fazer uma reserva!`;
                            window.open('https://wa.me/5541996366554?text=' + encodeURIComponent(msg), '_blank');
                        });
                    }

                    if (dt.getTime() === hoje.getTime()) celula.classList.add('hoje');
                    grid.appendChild(celula);
                }

                wrap.appendChild(grid);
                return wrap;
            }

            btnPrev.addEventListener('click', () => {
                mesBase.setMonth(mesBase.getMonth() - 1);
                renderizar();
            });

            btnNext.addEventListener('click', () => {
                mesBase.setMonth(mesBase.getMonth() + 1);
                renderizar();
            });

            function fmt(d) {
                return d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
            }

            // Datas de demo para ambiente local (sem PHP)
            function gerarDemoJS() {
                const s = new Set();
                const b = new Date();
                [[8,3],[16,2],[22,4],[35,3],[45,5],[62,2],[75,3],[88,4]].forEach(([o, dur]) => {
                    for (let i = 0; i < dur; i++) {
                        const d = new Date(b);
                        d.setDate(d.getDate() + o + i);
                        s.add(fmt(d));
                    }
                });
                return s;
            }

            carregarDados();
        }

        // Garante execução após o DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

    })();