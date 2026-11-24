
/* =========================
   FAIRY CURSOR EFFECT
========================= */

const glow = document.getElementById('cursorGlow');
const orb = document.getElementById('cursorOrb');
const scrollTopBtn = document.getElementById('scrollTopBtn');

let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;
let lastDustX = 0;
let lastDustY = 0;
let isVisible = false;

const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;

const dustColors = [
    '#fff9fd',
    '#ffeaf5',
    '#ffd6e9',
    '#ffc6df',
    '#ffb3d1'
];


/* =========================
   MOUSE MOVEMENT
========================= */

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    orb.style.opacity = '1';

    const hoveredElement = e.target.closest(
        'a, button, [role="button"]'
    );

    orb.classList.toggle('hovering', !!hoveredElement);

    if (!isVisible) {
        isVisible = true;

        currentX = mouseX;
        currentY = mouseY;

        lastDustX = mouseX;
        lastDustY = mouseY;

        glow.style.opacity = '1';
    }

    if (!prefersReducedMotion) {
        const distance = Math.hypot(
            mouseX - lastDustX,
            mouseY - lastDustY
        );

        if (distance > 8) {
            spawnDust(mouseX, mouseY);

            lastDustX = mouseX;
            lastDustY = mouseY;
        }
    }
});


/* =========================
   HIDE CURSOR
========================= */

document.addEventListener('mouseleave', () => {
    isVisible = false;

    glow.style.opacity = '0';
    orb.style.opacity = '0';

    orb.classList.remove('hovering');
});


/* =========================
   CREATE FAIRY DUST
========================= */

function spawnDust(x, y) {
    const dust = document.createElement('span');

    dust.className = 'cursor-dust';

    const size = Math.random() * 3 + 1;
    const driftX = Math.random() * 70 - 35;
    const driftY = Math.random() * 70 - 35;
    const duration = Math.random() * 1.5 + 0.8;
    const opacity = Math.random() * 0.5 + 0.3;

    const color = dustColors[
        Math.floor(Math.random() * dustColors.length)
    ];

    const glowSize = Math.random() * 7 + 2;

    dust.style.width = `${size}px`;
    dust.style.height = `${size}px`;

    dust.style.left = `${x + (Math.random() * 16 - 8)}px`;
    dust.style.top = `${y + (Math.random() * 16 - 8)}px`;

    dust.style.setProperty('--dust-color', color);
    dust.style.setProperty('--dust-glow', `${glowSize}px`);
    dust.style.setProperty('--dust-duration', `${duration}s`);
    dust.style.setProperty('--dust-drift-x', `${driftX}px`);
    dust.style.setProperty('--dust-drift-y', `${driftY}px`);
    dust.style.setProperty('--dust-opacity', opacity);

    document.body.appendChild(dust);

    dust.addEventListener('animationend', () => {
        dust.remove();
    });
}


/* =========================
   CURSOR GLOW ANIMATION
========================= */

function animateGlow() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;

    glow.style.left = `${currentX}px`;
    glow.style.top = `${currentY}px`;

    orb.style.left = `${mouseX}px`;
    orb.style.top = `${mouseY}px`;

    requestAnimationFrame(animateGlow);
}

animateGlow();


/* =========================
   BACK TO TOP BUTTON
========================= */

window.addEventListener('scroll', () => {
    if (window.scrollY > 320) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
});
