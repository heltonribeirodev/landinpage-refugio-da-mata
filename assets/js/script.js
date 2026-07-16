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



