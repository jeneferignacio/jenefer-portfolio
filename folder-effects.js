
/* =========================
   FAIRY CURSOR
========================= */

const cursorGlow = document.querySelector(".cursor-glow");
const cursorOrb = document.querySelector(".cursor-orb");

let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;
let lastDustX = 0;
let lastDustY = 0;

if (window.matchMedia("(pointer: fine)").matches) {

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (cursorGlow) cursorGlow.style.opacity = "1";
        if (cursorOrb) cursorOrb.style.opacity = "1";

        if (
            Math.abs(mouseX - lastDustX) > 8 ||
            Math.abs(mouseY - lastDustY) > 8
        ) {
            createDust(mouseX, mouseY);
            lastDustX = mouseX;
            lastDustY = mouseY;
        }
    });

    document.addEventListener("mouseleave", () => {
        if (cursorGlow) cursorGlow.style.opacity = "0";
        if (cursorOrb) cursorOrb.style.opacity = "0";
    });
}

function createDust(x, y) {
    const dust = document.createElement("div");
    dust.className = "cursor-dust";

    dust.style.left = x + "px";
    dust.style.top = y + "px";

    const size = Math.random() * 3 + 1;

    dust.style.width = size + "px";
    dust.style.height = size + "px";

    document.body.appendChild(dust);

    setTimeout(() => {
        dust.remove();
    }, 1500);
}

function animateGlow() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;

    if (cursorGlow) {
        cursorGlow.style.left = currentX + "px";
        cursorGlow.style.top = currentY + "px";
    }

    if (cursorOrb) {
        cursorOrb.style.left = mouseX + "px";
        cursorOrb.style.top = mouseY + "px";
    }

    requestAnimationFrame(animateGlow);
}

if (cursorGlow || cursorOrb) {
    animateGlow();
}

/* =========================
   SCROLL TO TOP
========================= */

const scrollTopBtn = document.querySelector(".scroll-top-btn");

if (scrollTopBtn) {

    window.addEventListener("scroll", () => {
        if (window.scrollY > 320) {
            scrollTopBtn.classList.add("visible");
        } else {
            scrollTopBtn.classList.remove("visible");
        }
    });

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/* =========================
   CUSTOM VIEWER
========================= */

const viewer = document.createElement("div");
viewer.className = "viewer-overlay";
viewer.setAttribute("role", "dialog");
viewer.setAttribute("aria-modal", "true");

viewer.innerHTML = `
    <div class="viewer-toolbar">

        <div class="viewer-title" id="viewerTitle">
            File Viewer
        </div>

        <div class="viewer-controls" id="viewerControls">

            <button class="viewer-btn"
                    data-action="prev"
                    title="Previous">
                ‹
            </button>

            <button class="viewer-btn"
                    data-action="next"
                    title="Next">
                ›
            </button>

            <button class="viewer-btn"
                    data-action="zoom-out"
                    title="Zoom out">
                −
            </button>

            <button class="viewer-btn"
                    data-action="zoom-in"
                    title="Zoom in">
                +
            </button>

            <button class="viewer-btn"
                    data-action="reset"
                    title="Reset zoom">
                Reset
            </button>

            <button class="viewer-btn"
                    data-action="fit"
                    title="Fit PDF to width">
                Fit
            </button>

            <button class="viewer-btn"
                    data-action="download"
                    title="Download">
                ↓
            </button>

            <button class="viewer-btn"
                    data-action="fullscreen"
                    title="Fullscreen">
                ⛶
            </button>

            <button class="viewer-btn"
                    data-action="close"
                    title="Close">
                ✕
            </button>

        </div>
    </div>

    <div class="viewer-content" id="viewerContent">
        <div class="viewer-loading">
            ✨ Preparing your file...
        </div>
    </div>
`;

document.body.appendChild(viewer);

const viewerTitle = viewer.querySelector("#viewerTitle");
const viewerControls = viewer.querySelector("#viewerControls");
const viewerContent = viewer.querySelector("#viewerContent");

let viewerType = "";
let viewerSource = "";
let viewerZoom = 1;

let viewerIndex = 0;
let viewerFiles = [];

let pdfDocument = null;
let pdfPageNumber = 1;
let pdfRenderScale = 1.3;
let pdfRenderTask = null;

let lastFocusedElement = null;

const PDFJS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

let pdfLibraryPromise = null;

/* =========================
   LOAD PDF.JS
========================= */

function loadPDFLibrary() {

    if (window.pdfjsLib) {
        return Promise.resolve(window.pdfjsLib);
    }

    if (!pdfLibraryPromise) {

        pdfLibraryPromise = new Promise((resolve, reject) => {

            const script = document.createElement("script");
            script.src = PDFJS_URL;

            script.onload = () => {

                if (!window.pdfjsLib) {
                    reject(new Error("PDF.js failed to initialize."));
                    return;
                }

                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

                resolve(window.pdfjsLib);
            };

            script.onerror = () => {
                reject(new Error("Unable to load the PDF viewer library."));
            };

            document.head.appendChild(script);
        });
    }

    return pdfLibraryPromise;
}

/* =========================
   OPEN IMAGE
========================= */

function openImage(src, title, images = []) {

    viewerType = "image";
    viewerSource = src;
    viewerFiles = images;

    viewerIndex = Math.max(
        0,
        images.findIndex(item => item.src === src)
    );

    viewerZoom = 1;

    viewerTitle.textContent = title || "Image Viewer";

    viewerControls.querySelector('[data-action="prev"]').style.display =
        images.length > 1 ? "" : "none";

    viewerControls.querySelector('[data-action="next"]').style.display =
        images.length > 1 ? "" : "none";

    viewerControls.querySelector('[data-action="fit"]').style.display =
        "none";

    viewerContent.innerHTML = `
        <div class="viewer-image-stage">
            <img class="viewer-image" alt="">
        </div>
    `;

    const img = viewerContent.querySelector(".viewer-image");

    img.src = src;
    img.alt = title || "Portfolio image";

    img.onload = () => {
        viewerContent.scrollTop = 0;
        viewerContent.scrollLeft = 0;
    };

    img.onerror = () => {
        viewerContent.innerHTML = `
            <div class="viewer-error">
                <h3>Unable to load image</h3>
                <p>Please check if the image file exists.</p>
            </div>
        `;
    };

    showViewer();
    updateImageZoom();
}

/* =========================
   OPEN PDF
========================= */

async function openPDF(src, title) {

    viewerType = "pdf";
    viewerSource = src;
    viewerFiles = [];

    pdfDocument = null;
    pdfPageNumber = 1;
    pdfRenderScale = 1.3;

    viewerTitle.textContent = title || "PDF Viewer";

    viewerControls.querySelector('[data-action="prev"]').style.display = "";
    viewerControls.querySelector('[data-action="next"]').style.display = "";
    viewerControls.querySelector('[data-action="fit"]').style.display = "";

    viewerContent.innerHTML = `
        <div class="viewer-loading">
            ✨ Loading PDF...
        </div>
    `;

    showViewer();

    try {

        const pdfjs = await loadPDFLibrary();

        const loadingTask = pdfjs.getDocument(src);
        pdfDocument = await loadingTask.promise;

        renderPDFPage();

    } catch (error) {

        viewerContent.innerHTML = `
            <div class="viewer-error">
                <h3>Unable to open this PDF</h3>
                <p>${error.message}</p>
                <p>Try downloading the file instead.</p>
            </div>
        `;
    }
}

/* =========================
   RENDER PDF PAGE
========================= */

async function renderPDFPage() {

    if (!pdfDocument) return;

    if (pdfRenderTask) {
        try {
            pdfRenderTask.cancel();
        } catch (error) {
            // Ignore cancelled rendering tasks
        }
    }

    viewerContent.innerHTML = `
        <div class="viewer-pdf-stage">
            <canvas class="viewer-pdf-page"></canvas>

            <div class="viewer-page-info">
                Page ${pdfPageNumber} / ${pdfDocument.numPages}
            </div>
        </div>
    `;

    const canvas = viewerContent.querySelector("canvas");

    const page = await pdfDocument.getPage(pdfPageNumber);

    const viewport = page.getViewport({
        scale: pdfRenderScale
    });

    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    canvas.style.width = viewport.width + "px";
    canvas.style.height = viewport.height + "px";

    pdfRenderTask = page.render({
        canvasContext: context,
        viewport: viewport
    });

    try {
        await pdfRenderTask.promise;
    } catch (error) {

        if (error.name !== "RenderingCancelledException") {
            console.error(error);
        }
    }

    updatePDFControls();
}

/* =========================
   PDF BUTTON STATES
========================= */

function updatePDFControls() {

    if (!pdfDocument) return;

    viewerControls.querySelector('[data-action="prev"]').disabled =
        pdfPageNumber <= 1;

    viewerControls.querySelector('[data-action="next"]').disabled =
        pdfPageNumber >= pdfDocument.numPages;
}

/* =========================
   SHOW / CLOSE VIEWER
========================= */

function showViewer() {

    lastFocusedElement = document.activeElement;

    viewer.classList.add("active");
    document.body.classList.add("viewer-open");

    viewer.querySelector('[data-action="close"]').focus();
}

function closeViewer() {

    viewer.classList.remove("active");
    document.body.classList.remove("viewer-open");

    if (pdfRenderTask) {
        try {
            pdfRenderTask.cancel();
        } catch (error) {
            // Ignore
        }
    }

    pdfDocument = null;
    pdfRenderTask = null;

    if (lastFocusedElement && lastFocusedElement.focus) {
        lastFocusedElement.focus();
    }
}

/* =========================
   IMAGE ZOOM
========================= */

function updateImageZoom() {

    const img = viewerContent.querySelector(".viewer-image");

    if (img) {
        img.style.transform = `scale(${viewerZoom})`;
        img.style.cursor = viewerZoom > 1 ? "grab" : "default";
    }
}

/* =========================
   ZOOM CONTROLS
========================= */

function changeZoom(amount) {

    if (viewerType === "image") {

        viewerZoom = Math.max(
            0.25,
            Math.min(5, viewerZoom + amount)
        );

        updateImageZoom();
    }

    if (viewerType === "pdf") {

        pdfRenderScale = Math.max(
            0.5,
            Math.min(3, pdfRenderScale + amount)
        );

        renderPDFPage();
    }
}

function resetZoom() {

    if (viewerType === "image") {
        viewerZoom = 1;
        updateImageZoom();
    }

    if (viewerType === "pdf") {
        pdfRenderScale = 1.3;
        renderPDFPage();
    }
}

/* =========================
   IMAGE NAVIGATION
========================= */

function navigateImage(direction) {

    if (viewerType !== "image" || viewerFiles.length < 2) {
        return;
    }

    viewerIndex =
        (viewerIndex + direction + viewerFiles.length) %
        viewerFiles.length;

    const item = viewerFiles[viewerIndex];

    openImage(
        item.src,
        item.title,
        viewerFiles
    );
}

/* =========================
   PDF NAVIGATION
========================= */

function navigatePDF(direction) {

    if (!pdfDocument) return;

    pdfPageNumber = Math.max(
        1,
        Math.min(
            pdfDocument.numPages,
            pdfPageNumber + direction
        )
    );

    renderPDFPage();
}

/* =========================
   FIT PDF TO WIDTH
========================= */

async function fitPDFWidth() {

    if (!pdfDocument) return;

    const page = await pdfDocument.getPage(pdfPageNumber);

    const baseViewport = page.getViewport({
        scale: 1
    });

    const availableWidth = viewerContent.clientWidth - 40;

    pdfRenderScale = Math.max(
        0.5,
        Math.min(
            3,
            availableWidth / baseViewport.width
        )
    );

    renderPDFPage();
}

/* =========================
   DOWNLOAD
========================= */

function downloadFile() {

    if (!viewerSource) return;

    const link = document.createElement("a");

    link.href = viewerSource;
    link.download = viewerSource.split("/").pop().split("?")[0];

    link.click();
}

/* =========================
   FULLSCREEN
========================= */

function toggleFullscreen() {

    if (!document.fullscreenElement) {
        viewer.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
}

/* =========================
   TOOLBAR BUTTONS
========================= */

viewerControls.addEventListener("click", (e) => {

    const button = e.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    switch (action) {

        case "close":
            closeViewer();
            break;

        case "prev":
            if (viewerType === "image") navigateImage(-1);
            if (viewerType === "pdf") navigatePDF(-1);
            break;

        case "next":
            if (viewerType === "image") navigateImage(1);
            if (viewerType === "pdf") navigatePDF(1);
            break;

        case "zoom-in":
            changeZoom(0.25);
            break;

        case "zoom-out":
            changeZoom(-0.25);
            break;

        case "reset":
            resetZoom();
            break;

        case "fit":
            fitPDFWidth();
            break;

        case "download":
            downloadFile();
            break;

        case "fullscreen":
            toggleFullscreen();
            break;
    }
});

/* =========================
   KEYBOARD CONTROLS
========================= */

document.addEventListener("keydown", (e) => {

    if (!viewer.classList.contains("active")) return;

    if (e.key === "Escape") {
        closeViewer();
    }

    if (e.key === "ArrowLeft") {
        if (viewerType === "image") navigateImage(-1);
        if (viewerType === "pdf") navigatePDF(-1);
    }

    if (e.key === "ArrowRight") {
        if (viewerType === "image") navigateImage(1);
        if (viewerType === "pdf") navigatePDF(1);
    }

    if (e.key === "+" || e.key === "=") {
        changeZoom(0.25);
    }

    if (e.key === "-") {
        changeZoom(-0.25);
    }
});

/* =========================
   CLOSE BY CLICKING BACKGROUND
========================= */

viewer.addEventListener("click", (e) => {

    if (e.target === viewer) {
        closeViewer();
    }
});

/* =========================
   CONNECT IMAGE AND PDF LINKS
========================= */

document.querySelectorAll("[data-viewer]").forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        const type = link.dataset.viewer;
        const src = link.dataset.src;
        const title = link.dataset.title || link.textContent.trim();

        /* IMAGE VIEWER WITH GALLERY NAVIGATION */

        if (type === "image") {

            const imageLinks = Array.from(
                document.querySelectorAll('[data-viewer="image"]')
            ).map(item => ({
                src: item.dataset.src,
                title: item.dataset.title || item.textContent.trim()
            }));

            openImage(
                src,
                title,
                imageLinks
            );
        }

        /* PDF VIEWER */

        if (type === "pdf") {
            openPDF(src, title);
        }

    });
});

/* =========================
   CONNECT CERTIFICATE IMAGES
========================= */

const certificateImages = Array.from(
    document.querySelectorAll("[data-certificate]")
).map(img => ({
    src: img.src,
    title: img.dataset.title || img.alt
}));

document.querySelectorAll("[data-certificate]").forEach(img => {

    img.addEventListener("click", () => {

        openImage(
            img.src,
            img.dataset.title || img.alt,
            certificateImages
        );

    });

});


/* =========================
   CONNECT CERTIFICATE BUTTONS
========================= */

document.querySelectorAll("[data-certificate-open]").forEach(button => {

    button.addEventListener("click", () => {

        const filename = button.dataset.certificateOpen;

        const image = Array.from(
            document.querySelectorAll("[data-certificate]")
        ).find(img => img.getAttribute("src") === filename);

        if (image) {
            image.click();
        }

    });

});

