// ════════════════════════════════════════════════════════
//  REFÚGIO DA MATA — script.js
//  · Carousel · Header scroll · WhatsApp fixo
//  · Barra de reserva rápida · Mobile menu · Reveal
//  · FAQ · Lightbox · Calendário com seleção de intervalo
//  · Sincronização bidirecional barra ↔ calendário
// ════════════════════════════════════════════════════════

// ── Utilitários de data ──────────────────────────────────
function fmtISO(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}
function fmtBR(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
}
function isoToDt(isoStr) {
    const [y, m, d] = isoStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
}

// ── Estado compartilhado barra ↔ calendário ──────────────
const reservaState = {
    checkin:  null,
    checkout: null,
    hospedes: '2 hóspedes',
    _listeners: [],
    subscribe(fn) { this._listeners.push(fn); },
    notify(origem) { this._listeners.forEach(fn => fn(origem)); },
    setCheckin(val, origem)  { this.checkin  = val || null; this.notify(origem); },
    setCheckout(val, origem) { this.checkout = val || null; this.notify(origem); },
    setHospedes(val, origem) { this.hospedes = val;         this.notify(origem); }
};

// ── Scroll reveal ────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
    });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Header scroll effect ─────────────────────────────────
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 60));

// ── Botão WhatsApp fixo ──────────────────────────────────
const wppFixo = document.getElementById('whatsapp-fixo');
if (wppFixo) {
    const checarWpp = () => wppFixo.classList.toggle('visivel', window.scrollY > window.innerHeight * 0.85);
    window.addEventListener('scroll', checarWpp, { passive: true });
    checarWpp();
}

// ── Mobile menu ──────────────────────────────────────────
const menuToggle = document.getElementById('menu-toggle');
const navMobile  = document.getElementById('nav-mobile');
menuToggle.addEventListener('click', () => {
    navMobile.classList.toggle('open');
    menuToggle.classList.toggle('open'); // anima as 3 barras → X via CSS
});
navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navMobile.classList.remove('open');
        menuToggle.classList.remove('open');
    });
});

// ── FAQ accordion ────────────────────────────────────────
document.querySelectorAll('.faq-pergunta').forEach(btn => {
    btn.addEventListener('click', () => {
        const item     = btn.closest('.faq-item');
        const resposta = item.querySelector('.faq-resposta');
        const isOpen   = btn.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('.faq-pergunta').forEach(b => {
            b.setAttribute('aria-expanded', 'false');
            b.closest('.faq-item').querySelector('.faq-resposta').classList.remove('open');
        });
        if (!isOpen) { btn.setAttribute('aria-expanded', 'true'); resposta.classList.add('open'); }
    });
});

// ── Carousel (sobre) ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const track   = document.getElementById('hotel-track');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (track && btnNext && btnPrev) {
        const cardWidth = () => { const c = track.querySelector('.carousel-card'); return c ? c.offsetWidth + 20 : 260; };
        btnNext.addEventListener('click', () => track.scrollBy({ left:  cardWidth(), behavior: 'smooth' }));
        btnPrev.addEventListener('click', () => track.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
    }
});

// ── Formulário de contato ─────────────────────────────────
function handleForm(e) {
    e.preventDefault();
    const success = document.getElementById('form-success');
    success.classList.add('show');
    e.target.reset();
    setTimeout(() => success.classList.remove('show'), 5000);
}

// ════════════════════════════════════════════════════════
//  BARRA DE RESERVA RÁPIDA
// ════════════════════════════════════════════════════════
(function initBarraReserva() {
    const elCheckin  = document.getElementById('checkin');
    const elCheckout = document.getElementById('checkout');
    const elHospedes = document.getElementById('hospedes');
    if (!elCheckin || !elCheckout) return;

    const today = fmtISO(new Date());
    elCheckin.min  = today;
    elCheckout.min = today;

    // Barra → Estado
    elCheckin.addEventListener('change', () => {
        reservaState.setCheckin(elCheckin.value, 'barra');
        if (elCheckin.value) elCheckout.min = elCheckin.value;
        if (reservaState.checkout && reservaState.checkout <= elCheckin.value)
            reservaState.setCheckout('', 'barra');
    });
    elCheckout.addEventListener('change', () => reservaState.setCheckout(elCheckout.value, 'barra'));
    if (elHospedes) elHospedes.addEventListener('change', () => reservaState.setHospedes(elHospedes.value, 'barra'));

    // Estado → Barra (quando origem for calendário)
    reservaState.subscribe((origem) => {
        if (origem === 'barra') return;
        elCheckin.value  = reservaState.checkin  || '';
        elCheckout.value = reservaState.checkout || '';
        if (reservaState.checkin) elCheckout.min = reservaState.checkin;
    });
})();

// ── Botão "Verificar Disponibilidade" da barra ───────────
function reservarViaWpp() {
    const ci = reservaState.checkin;
    const co = reservaState.checkout;
    const hp = reservaState.hospedes;

    // Sem datas → rola até o calendário para o usuário selecionar
    if (!ci) {
        const secao = document.getElementById('disponibilidade');
        if (secao) secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    let msg = `Olá! Gostaria de reservar o Refúgio da Mata.`;
    if (ci && co) {
        msg = `Olá! Gostaria de reservar o Refúgio da Mata.\n\n📅 Check-in: ${fmtBR(ci)}\n📅 Check-out: ${fmtBR(co)}\n👥 Hóspedes: ${hp}\n\nPodem confirmar a disponibilidade e o valor da reserva?`;
    } else if (ci) {
        msg = `Olá! Gostaria de reservar o Refúgio da Mata a partir de ${fmtBR(ci)}. Podem me informar a disponibilidade e o valor da reserva?`;
    }

    const secao = document.getElementById('disponibilidade');
    if (secao) {
        secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => window.open('https://wa.me/5541996366554?text=' + encodeURIComponent(msg), '_blank'), 600);
    } else {
        window.open('https://wa.me/5541996366554?text=' + encodeURIComponent(msg), '_blank');
    }
}

// ════════════════════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════════════════════
const fotos = [
    { src: 'assets/image/Hidro + vista.jpeg', label: 'Vista das Montanhas' },
    { src: 'assets/image/quarto.jpeg',         label: 'Quarto' },
    { src: 'assets/image/hidro.jpeg',          label: 'Hidromassagem' },
    { src: 'assets/image/cozinha.jpeg',        label: 'Cozinha' },
    { src: 'assets/image/quarto2.jpeg',        label: 'Suíte' },
    { src: 'assets/image/cozinha2.jpeg',       label: 'Cozinha — detalhe' },
];
let indiceAtual = 0;

function abrirLightbox(index) {
    indiceAtual = index;
    document.getElementById('lightbox').classList.add('ativo');
    document.body.style.overflow = 'hidden';
    renderizarThumbs(); atualizarFoto();
}
function fecharLightbox() {
    document.getElementById('lightbox').classList.remove('ativo');
    document.body.style.overflow = '';
}
function fecharLightboxFora(e) { if (e.target.id === 'lightbox') fecharLightbox(); }
function navegarLightbox(dir) { indiceAtual = (indiceAtual + dir + fotos.length) % fotos.length; atualizarFoto(); }
function atualizarFoto() {
    const foto = fotos[indiceAtual];
    const img  = document.getElementById('lb-img');
    img.style.opacity = 0;
    setTimeout(() => { img.src = foto.src; img.alt = foto.label; img.style.opacity = 1; }, 150);
    document.getElementById('lb-label').textContent   = foto.label;
    document.getElementById('lb-counter').textContent = `${indiceAtual + 1} / ${fotos.length}`;
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
        const img = document.createElement('img'); img.src = f.src; img.alt = f.label;
        div.appendChild(img); container.appendChild(div);
    });
}
document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('ativo')) return;
    if (e.key === 'ArrowRight') navegarLightbox(1);
    if (e.key === 'ArrowLeft')  navegarLightbox(-1);
    if (e.key === 'Escape')     fecharLightbox();
});

// ════════════════════════════════════════════════════════
//  CALENDÁRIO DE DISPONIBILIDADE
//  · Seleção de intervalo check-in / check-out
//  · Sincronização bidirecional com a barra de reserva
// ════════════════════════════════════════════════════════
(function () {

    const PROXY_URL = 'ical-proxy.php';
    const MESES_PT  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                       'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const DIAS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

    let datasOcupadas = new Set();
    let mesBase = new Date(); mesBase.setDate(1); mesBase.setHours(0,0,0,0);
    const hoje  = new Date(); hoje.setHours(0,0,0,0);

    // Fase de seleção: 'checkin' | 'checkout' | null
    let selecionando = 'checkin';

    function init() {
        const elLoading = document.getElementById('cal-loading');
        const elNav     = document.getElementById('cal-nav');
        const elMeses   = document.getElementById('cal-meses');
        const elLegenda = document.getElementById('cal-legenda');
        const elCta     = document.getElementById('cal-cta');
        const btnPrev   = document.getElementById('cal-prev');
        const btnNext   = document.getElementById('cal-next');
        if (!elLoading) return;

        // ── Painel de datas selecionadas ──
        const painelDatas = document.createElement('div');
        painelDatas.id        = 'cal-painel-datas';
        painelDatas.className = 'cal-painel-datas';
        painelDatas.innerHTML = `
            <div class="cal-painel-campo" id="cal-campo-checkin">
                <span class="cal-painel-label"><i class="fa-regular fa-calendar"></i> Check-in</span>
                <span class="cal-painel-valor" id="cal-val-checkin">Selecione uma data</span>
            </div>
            <div class="cal-painel-seta"><i class="fa-solid fa-arrow-right"></i></div>
            <div class="cal-painel-campo" id="cal-campo-checkout">
                <span class="cal-painel-label"><i class="fa-regular fa-calendar"></i> Check-out</span>
                <span class="cal-painel-valor" id="cal-val-checkout">Selecione uma data</span>
            </div>
            <div class="cal-painel-divider"></div>
            <div class="cal-painel-campo cal-hospedes-campo" id="cal-campo-hospedes">
                <span class="cal-painel-label"><i class="fa-solid fa-user"></i> Hóspedes</span>
                <div class="cal-hospedes-dropdown" id="cal-hospedes-dropdown">
                    <button type="button" class="cal-hospedes-trigger" id="cal-hospedes-trigger" aria-haspopup="listbox" aria-expanded="false">
                        <span id="cal-hospedes-valor">1 hóspede</span>
                        <i class="fa-solid fa-chevron-down cal-hospedes-chevron"></i>
                    </button>
                    <ul class="cal-hospedes-menu" id="cal-hospedes-menu" role="listbox">
                        <li class="cal-hospedes-opcao ativo" role="option" data-valor="1 hóspede">1 hóspede</li>
                        <li class="cal-hospedes-opcao" role="option" data-valor="2 hóspedes">2 hóspedes</li>
                        <li class="cal-hospedes-opcao" role="option" data-valor="3 hóspedes">3 hóspedes</li>
                        <li class="cal-hospedes-opcao" role="option" data-valor="4+ hóspedes">4+ hóspedes</li>
                    </ul>
                </div>
            </div>
            <button class="cal-painel-limpar" id="cal-limpar" title="Limpar seleção">
                <i class="fa-solid fa-xmark"></i> Limpar
            </button>`;
        elLegenda.parentNode.insertBefore(painelDatas, elLegenda);

        // ── Dropdown customizado de hóspedes ──
        const trigger = document.getElementById('cal-hospedes-trigger');
        const menu    = document.getElementById('cal-hospedes-menu');
        const valor   = document.getElementById('cal-hospedes-valor');
        const dropdown = document.getElementById('cal-hospedes-dropdown');

        function toggleDropdown(abrir) {
            const estado = abrir !== undefined ? abrir : !dropdown.classList.contains('aberto');
            dropdown.classList.toggle('aberto', estado);
            trigger.setAttribute('aria-expanded', String(estado));
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.cal-hospedes-opcao');
            if (!item) return;
            const val = item.dataset.valor;
            valor.textContent = val;
            menu.querySelectorAll('.cal-hospedes-opcao').forEach(o => o.classList.remove('ativo'));
            item.classList.add('ativo');
            toggleDropdown(false);
            reservaState.setHospedes(val, 'calendario');
            atualizarPainel();
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) toggleDropdown(false);
        });

        document.getElementById('cal-limpar').addEventListener('click', () => {
            reservaState.setCheckin(null, 'calendario');
            reservaState.setCheckout(null, 'calendario');
            selecionando = 'checkin';
            atualizarPainel(); renderizar();
        });
        document.getElementById('cal-campo-checkin').addEventListener('click', () => {
            selecionando = 'checkin'; atualizarPainel();
        });
        document.getElementById('cal-campo-checkout').addEventListener('click', () => {
            if (reservaState.checkin) { selecionando = 'checkout'; atualizarPainel(); }
        });

        // ── Atualiza painel e CTA ──
        function atualizarPainel() {
            const ci = reservaState.checkin;
            const co = reservaState.checkout;
            document.getElementById('cal-val-checkin').textContent  = ci ? fmtBR(ci) : 'Selecione uma data';
            document.getElementById('cal-val-checkout').textContent = co ? fmtBR(co) : 'Selecione uma data';
            document.getElementById('cal-campo-checkin').classList.toggle('ativo',      selecionando === 'checkin');
            document.getElementById('cal-campo-checkout').classList.toggle('ativo',     selecionando === 'checkout');
            document.getElementById('cal-campo-checkin').classList.toggle('preenchido', !!ci);
            document.getElementById('cal-campo-checkout').classList.toggle('preenchido',!!co);
            atualizarCTA(ci, co);
        }

        function atualizarCTA(ci, co) {
            elCta.innerHTML = '';
            elCta.style.display = 'flex';
            if (ci && co) {
                const noites = Math.round((isoToDt(co) - isoToDt(ci)) / 86400000);
                const hp  = reservaState.hospedes;
                const msg = `Olá! Gostaria de reservar o Refúgio da Mata.\n\n📅 Check-in: ${fmtBR(ci)}\n📅 Check-out: ${fmtBR(co)}\n👥 Hóspedes: ${hp}\n\nPodem confirmar a disponibilidade e o valor da reserva?`;
                const url = 'https://wa.me/5541996366554?text=' + encodeURIComponent(msg);
                elCta.innerHTML = `
                    <div class="cal-cta-resumo">
                        <span class="cal-cta-datas">${fmtBR(ci)} → ${fmtBR(co)}</span>
                        <span class="cal-cta-noites">${noites} ${noites === 1 ? 'noite' : 'noites'}</span>
                    </div>
                    <a href="${url}" class="btn-whatsapp btn-whatsapp-lg" target="_blank" rel="noopener">
                        <i class="fa-brands fa-whatsapp"></i> Reservar pelo WhatsApp
                    </a>`;
            } else if (ci) {
                elCta.innerHTML = `<p class="cal-cta-hint"><i class="fa-solid fa-hand-pointer"></i> Agora selecione a data de <strong>check-out</strong> no calendário</p>`;
            } else {
                elCta.innerHTML = `<p class="cal-cta-hint"><i class="fa-solid fa-hand-pointer"></i> Clique em uma data disponível para iniciar a reserva</p>`;
            }
        }

        // Ouve mudanças da barra → atualiza calendário
        reservaState.subscribe((origem) => {
            if (origem === 'calendario') return;
            if (reservaState.checkin) {
                const dtCI  = isoToDt(reservaState.checkin);
                const mesCI = new Date(dtCI.getFullYear(), dtCI.getMonth(), 1);
                const mes2  = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1);
                if (mesCI < mesBase || mesCI > mes2) mesBase = new Date(mesCI);
                selecionando = reservaState.checkout ? null : 'checkout';
            } else {
                selecionando = 'checkin';
            }
            atualizarPainel(); renderizar();
        });

        // ── Carrega disponibilidade ──
        async function carregarDados() {
            try {
                const res  = await fetch(PROXY_URL + '?t=' + Date.now());
                const data = await res.json();
                if (data.datas_ocupadas) datasOcupadas = new Set(data.datas_ocupadas);
                if (data.demo) elBadge.style.display = 'flex';
            } catch (e) {
                datasOcupadas = gerarDemoJS();
                elBadge.style.display = 'flex';
            } finally {
                elLoading.style.display = 'none';
                elNav.style.display     = 'flex';
                elLegenda.style.display = 'flex';
                renderizar(); atualizarPainel();
            }
        }

        // ── Renderiza dois meses ──
        function renderizar() {
            elMeses.innerHTML = '';
            const mes1 = new Date(mesBase.getFullYear(), mesBase.getMonth(), 1);
            const mes2 = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1);
            elMeses.appendChild(renderizarMes(mes1));
            elMeses.appendChild(renderizarMes(mes2));
            const hojeM = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            btnPrev.disabled = mes1 <= hojeM;
        }

        // ── Renderiza um mês ──
        function renderizarMes(data) {
            const wrap   = document.createElement('div'); wrap.className = 'cal-mes';
            const titulo = document.createElement('div'); titulo.className = 'cal-mes-titulo';
            titulo.textContent = MESES_PT[data.getMonth()] + ' ' + data.getFullYear();
            wrap.appendChild(titulo);

            const grid = document.createElement('div'); grid.className = 'cal-grid';
            DIAS_PT.forEach(d => {
                const dow = document.createElement('div'); dow.className = 'cal-dow'; dow.textContent = d;
                grid.appendChild(dow);
            });

            const primeiroDow = new Date(data.getFullYear(), data.getMonth(), 1).getDay();
            for (let i = 0; i < primeiroDow; i++) {
                const v = document.createElement('div'); v.className = 'cal-dia vazio'; grid.appendChild(v);
            }

            const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
            for (let d = 1; d <= ultimoDia; d++) {
                const dt = new Date(data.getFullYear(), data.getMonth(), d);
                dt.setHours(0,0,0,0);
                const chave  = fmtISO(dt);
                const celula = document.createElement('div');
                celula.textContent = d;

                const ci = reservaState.checkin  ? isoToDt(reservaState.checkin)  : null;
                const co = reservaState.checkout ? isoToDt(reservaState.checkout) : null;

                if (dt < hoje) {
                    celula.className = 'cal-dia passado';
                } else if (datasOcupadas.has(chave)) {
                    celula.className = 'cal-dia ocupado'; celula.title = 'Indisponível';
                } else {
                    celula.className = 'cal-dia disponivel';
                    if      (ci && dt.getTime() === ci.getTime()) { celula.classList.add('cal-checkin');  celula.title = 'Check-in'; }
                    else if (co && dt.getTime() === co.getTime()) { celula.classList.add('cal-checkout'); celula.title = 'Check-out'; }
                    else if (ci && co && dt > ci && dt < co)      { celula.classList.add('cal-intervalo'); }
                    else                                           { celula.title = 'Disponível'; }

                    celula.addEventListener('mouseenter', () => { if (selecionando === 'checkout' && ci) destacarHover(dt, ci); });
                    celula.addEventListener('mouseleave', limparHover);
                    celula.addEventListener('click', () => handleCliqueDia(dt, chave));
                }
                if (dt.getTime() === hoje.getTime()) celula.classList.add('hoje');
                grid.appendChild(celula);
            }
            wrap.appendChild(grid);
            return wrap;
        }

        // ── Lógica de clique ──
        function handleCliqueDia(dt, chave) {
            if (selecionando === 'checkin' || !reservaState.checkin) {
                reservaState.setCheckin(chave, 'calendario');
                reservaState.setCheckout(null, 'calendario');
                selecionando = 'checkout';
                atualizarPainel(); renderizar();
                return;
            }
            if (selecionando === 'checkout') {
                const ci = reservaState.checkin ? isoToDt(reservaState.checkin) : null;
                if (ci && dt <= ci) {
                    reservaState.setCheckin(chave, 'calendario');
                    reservaState.setCheckout(null, 'calendario');
                    selecionando = 'checkout';
                    atualizarPainel(); renderizar();
                    return;
                }
                if (ci && temOcupadoNoIntervalo(ci, dt)) {
                    const painel = document.getElementById('cal-painel-datas');
                    painel.classList.add('cal-painel-erro');
                    setTimeout(() => painel.classList.remove('cal-painel-erro'), 600);
                    return;
                }
                reservaState.setCheckout(chave, 'calendario');
                selecionando = null;
                atualizarPainel(); renderizar();
            }
        }

        function temOcupadoNoIntervalo(dtInicio, dtFim) {
            let cur = new Date(dtInicio); cur.setDate(cur.getDate() + 1);
            while (cur < dtFim) { if (datasOcupadas.has(fmtISO(cur))) return true; cur.setDate(cur.getDate() + 1); }
            return false;
        }

        // ── Hover preview ──
        function destacarHover(dtHover, dtCheckin) {
            document.querySelectorAll('.cal-dia.disponivel').forEach(cel => {
                cel.classList.remove('cal-hover-intervalo', 'cal-hover-checkout');
                const dtCel = celToDt(cel);
                if (!dtCel) return;
                if      (dtCel > dtCheckin && dtCel < dtHover)      cel.classList.add('cal-hover-intervalo');
                else if (dtCel.getTime() === dtHover.getTime())      cel.classList.add('cal-hover-checkout');
            });
        }
        function limparHover() {
            document.querySelectorAll('.cal-hover-intervalo,.cal-hover-checkout').forEach(cel =>
                cel.classList.remove('cal-hover-intervalo','cal-hover-checkout'));
        }

        // Converte célula DOM → Date
        function celToDt(cel) {
            const grid    = cel.closest('.cal-grid'); if (!grid) return null;
            const mesWrap = grid.closest('.cal-mes'); if (!mesWrap) return null;
            const tituloEl = mesWrap.querySelector('.cal-mes-titulo'); if (!tituloEl) return null;
            const partes  = tituloEl.textContent.trim().split(' ');
            const mesIdx  = MESES_PT.indexOf(partes[0]);
            if (mesIdx === -1) return null;
            const dia = parseInt(cel.textContent); if (isNaN(dia)) return null;
            const dt  = new Date(parseInt(partes[1]), mesIdx, dia); dt.setHours(0,0,0,0);
            return dt;
        }

        // ── Navegação de meses ──
        btnPrev.addEventListener('click', () => { mesBase.setMonth(mesBase.getMonth() - 1); renderizar(); });
        btnNext.addEventListener('click', () => { mesBase.setMonth(mesBase.getMonth() + 1); renderizar(); });

        // ── Demo local ──
        function gerarDemoJS() {
            const s = new Set(), b = new Date();
            [[8,3],[16,2],[22,4],[35,3],[45,5],[62,2],[75,3],[88,4]].forEach(([o,dur]) => {
                for (let i = 0; i < dur; i++) { const d = new Date(b); d.setDate(d.getDate()+o+i); s.add(fmtISO(d)); }
            });
            return s;
        }

        carregarDados();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();