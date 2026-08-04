// ExportDeck.js

import { state } from './app.js';

let lastExportMimeType = 'image/png';
let lastExportDataUrl = '';
let exportJobId = 0;

function getDeckEntriesForExport() {
    if (Array.isArray(state.currentEntries) && state.currentEntries.length > 0) {
        return state.currentEntries.map(entry => ({
            originalUrl: entry.originalUrl || entry.url,
            previewUrl: entry.url || entry.originalUrl
        }));
    }

    const cardDivs = document.querySelectorAll('.card-div img');
    return Array.from(cardDivs).map(img => ({
        originalUrl: img.dataset.originalUrl || img.src,
        previewUrl: img.dataset.thumbnailUrl || img.src
    }));
}

function sleep(ms) {
    return new Promise(resolve => {
        window.setTimeout(resolve, ms);
    });
}

async function waitForDeckRenderCompletion(timeoutMs = 5000) {
    const start = Date.now();
    while ((state.renderInProgress || state.renderPending) && (Date.now() - start) < timeoutMs) {
        await sleep(40);
    }
}

function ensureDeckModalHandlers() {
    const closeButton = document.querySelector('.close');
    if (closeButton && !closeButton.dataset.boundClose) {
        closeButton.onclick = closeDeckModal;
        closeButton.dataset.boundClose = '1';
    }

    const qualityButton = document.getElementById('hight-quality-button');
    const qualityCheck = document.getElementById('hight-quality-check');
    if (qualityCheck) {
        qualityCheck.checked = true;
        qualityCheck.disabled = true;
    }
    if (qualityButton) {
        qualityButton.style.pointerEvents = 'none';
        qualityButton.style.opacity = '0.6';
    }
}

function ensureExportProgressUI() {
    const popupContent = document.getElementById('popup-content');
    if (!popupContent) return null;

    if (!popupContent.querySelector('.export-stage')) {
        popupContent.innerHTML = `
            <div class="export-stage">
                <div class="export-status-row" id="export-status-row">
                    <span class="export-spinner" aria-hidden="true"></span>
                    <span id="export-status-text">書き出しを準備中...</span>
                </div>
                <div class="export-progress" id="export-progress">0 / 0</div>
                <img id="export-preview-image" class="export-preview-image" alt="export preview" />
            </div>
        `;
    }

    return {
        popupContent,
        statusRow: popupContent.querySelector('#export-status-row'),
        statusText: popupContent.querySelector('#export-status-text'),
        progressText: popupContent.querySelector('#export-progress'),
        previewImage: popupContent.querySelector('#export-preview-image')
    };
}

function setLoadingState(ui, isLoading) {
    if (!ui || !ui.statusRow) return;
    ui.statusRow.classList.toggle('is-done', !isLoading);
}

function updateExportStatus(ui, text, loaded = 0, total = 0) {
    if (!ui) return;
    if (ui.statusText) {
        ui.statusText.textContent = text;
    }
    if (ui.progressText) {
        ui.progressText.textContent = total > 0 ? `${loaded} / ${total}` : '';
    }
}

function setPreviewImage(ui, src, { blurred = false } = {}) {
    if (!ui || !ui.previewImage || !src) return;
    ui.previewImage.src = src;
    ui.previewImage.classList.toggle('is-blurred', blurred);
}

function setSaveButtonEnabled(enabled) {
    const saveButton = document.getElementById('saveButton');
    if (!saveButton) return;
    saveButton.disabled = !enabled;
}

function loadImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

async function buildQuickPreview(entries, gridColumns = 5) {
    if (!entries || entries.length === 0) return '';

    const cellWidth = 120;
    const cellHeight = 168;
    const gridRows = Math.ceil(entries.length / gridColumns);
    const canvas = document.createElement('canvas');
    canvas.width = gridColumns * cellWidth;
    canvas.height = gridRows * cellHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const images = await Promise.all(entries.map(entry => loadImage(entry.previewUrl || entry.originalUrl)));

    images.forEach((img, index) => {
        const x = (index % gridColumns) * cellWidth;
        const y = Math.floor(index / gridColumns) * cellHeight;
        if (img) {
            ctx.drawImage(img, x, y, cellWidth, cellHeight);
        }
    });

    return canvas.toDataURL('image/webp', 0.55);
}

async function buildFinalDeckImage(entries, settings, ui, currentJobId) {
    const selectedCardUrls = entries.map(entry => entry.originalUrl);
    const canvas = document.getElementById('deckCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const cardWidth = 741 * settings.clearSize;
    const cardHeight = 1036 * settings.clearSize;
    const gridColumns = settings.gridColumns;
    const gridRows = Math.ceil(selectedCardUrls.length / gridColumns);

    canvas.width = gridColumns * cardWidth;
    canvas.height = gridRows * cardHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = selectedCardUrls.length;
    let loaded = 0;

    const images = await Promise.all(selectedCardUrls.map(async (url) => {
        const img = await loadImage(url);
        loaded++;
        if (currentJobId !== exportJobId) {
            return null;
        }
        updateExportStatus(ui, 'デッキ画像を書き出し中...', loaded, total);
        return img;
    }));

    if (currentJobId !== exportJobId) {
        return '';
    }

    images.forEach((img, index) => {
        if (!img) return;
        const x = (index % gridColumns) * cardWidth;
        const y = Math.floor(index / gridColumns) * cardHeight;
        ctx.drawImage(img, x, y, cardWidth, cardHeight);
    });

    return canvas.toDataURL(settings.mimeType, settings.quality);
}

function computeExportSettings() {
    return {
        clearSize: 1,
        gridColumns: 5,
        mimeType: 'image/png',
        quality: 1
    };
}

function openDeckModal() {
    const modal = document.getElementById('deckModal');
    if (!modal) return;
    modal.style.display = 'flex';
}

function closeDeckModal() {
    const modal = document.getElementById('deckModal');
    if (!modal) return;
    modal.style.display = 'none';
}

async function exportDeck() {
    const currentJobId = ++exportJobId;

    openDeckModal();
    ensureDeckModalHandlers();

    const ui = ensureExportProgressUI();
    setLoadingState(ui, true);
    setSaveButtonEnabled(false);
    lastExportDataUrl = '';

    updateExportStatus(ui, 'デッキ更新完了を待っています...', 0, 0);
    await waitForDeckRenderCompletion();
    if (currentJobId !== exportJobId) return;

    const entries = getDeckEntriesForExport();
    if (!entries || entries.length === 0) {
        updateExportStatus(ui, '出力対象のカードがありません。', 0, 0);
        setLoadingState(ui, false);
        return;
    }

    updateExportStatus(ui, 'プレビューを作成中...', 0, entries.length);
    const quickPreview = await buildQuickPreview(entries, 5);
    if (currentJobId !== exportJobId) return;
    if (quickPreview) {
        setPreviewImage(ui, quickPreview, { blurred: true });
    }

    const settings = computeExportSettings();
    const finalDataUrl = await buildFinalDeckImage(entries, settings, ui, currentJobId);
    if (currentJobId !== exportJobId || !finalDataUrl) return;

    lastExportMimeType = settings.mimeType;
    lastExportDataUrl = finalDataUrl;
    setPreviewImage(ui, finalDataUrl, { blurred: false });
    updateExportStatus(ui, '書き出し完了', entries.length, entries.length);
    setLoadingState(ui, false);
    setSaveButtonEnabled(true);
}

document.getElementById('export-deck-button').addEventListener('click', () => {
    exportDeck();
});

document.getElementById('hight-quality-button').addEventListener('click', () => {
    // 常時高画質運用のため、トグル操作では再生成しません。
});

document.getElementById('saveButton').addEventListener('click', () => {
    if (!lastExportDataUrl) return;
    saveAsJPG(lastExportDataUrl);
});

function saveAsJPG(jpgUrl) {
    const link = document.createElement('a');
    link.href = jpgUrl;
    link.download = lastExportMimeType === 'image/jpeg' ? 'deck.jpg' : 'deck.png';
    link.click();
}