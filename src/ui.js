// ui.js
// このモジュールはDOMの描画に専念します。
// アプリの状態を受け取り、カード一覧・選択済みカード・発売時期UIを描画します。

function clearContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

function updateImageContainerColumns(displayColumns = 3) {
    const container = document.getElementById('image-container');
    if (!container) return;
    container.style.setProperty('--deck-columns', String(displayColumns));
    container.classList.remove('image-cols-2', 'image-cols-3', 'image-cols-4', 'image-cols-5');
    container.classList.add(`image-cols-${displayColumns}`);
}

function ensureCardPreviewModal() {
    let modal = document.getElementById('card-preview-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'card-preview-modal';
    modal.className = 'card-preview-modal';
    modal.innerHTML = `
        <div class="card-preview-backdrop"></div>
        <div class="card-preview-content">
            <button type="button" class="card-preview-close" aria-label="閉じる">×</button>
            <p class="card-preview-title"></p>
            <img class="card-preview-image" alt="card preview" />
        </div>
    `;

    const close = () => {
        modal.style.display = 'none';
    };

    modal.querySelector('.card-preview-close').addEventListener('click', close);
    modal.querySelector('.card-preview-backdrop').addEventListener('click', close);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            close();
        }
    });

    document.body.appendChild(modal);
    return modal;
}

function openCardPreview(entry) {
    const modal = ensureCardPreviewModal();
    const title = modal.querySelector('.card-preview-title');
    const image = modal.querySelector('.card-preview-image');
    const relText = entry.card && entry.card.rel
        ? (isNumericReleaseTag(entry.card.rel) ? `[${entry.card.rel}弾] ` : `[${entry.card.rel}] `)
        : '';

    title.textContent = entry.card
        ? `${relText}${entry.card.name}`
        : 'カード詳細';

    image.src = entry.originalUrl || entry.url;
    image.alt = entry.card ? entry.card.name : 'card preview';

    modal.style.display = 'flex';
}

// 収録弾タグが純粋な数値かどうかを判定します。
function isNumericReleaseTag(value) {
    return /^\d+(?:\.\d+)?$/.test(String(value || '').trim());
}

// カード選択用の<select>要素を生成します。
function populateCardSelect(cards) {
    const select = document.getElementById('card-select');
    if (!select) return;

    select.innerHTML = '';

    cards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;
        const releaseInfo = card.rel
            ? (isNumericReleaseTag(card.rel) ? `[${card.rel}弾]` : ` [${card.rel}]`)
            : '';
        option.textContent = `${releaseInfo} ${card.name}`;
        select.appendChild(option);
    });
}

// 発売時期チェックボックスを描画します。
function renderReleasePeriodOptions(periods) {
    const container = document.getElementById('release-period-container');
    if (!container) return;

    container.innerHTML = '';

    periods.forEach(period => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = period;
        checkbox.id = `release-period-${period}`;
        checkbox.checked = true;

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = isNumericReleaseTag(period) ? ` 第${period}弾` : ` ${period}`;

        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
    });
}

// 事前選択されたカードをUI上に表示します。
function renderSelectedCards(selectedCards, onRemove) {
    const container = document.getElementById('selected-cards-container');
    if (!container) return;

    container.innerHTML = '';

    selectedCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'selected-card';
        cardDiv.dataset.cardId = card.id;

        const label = document.createElement('span');
        label.textContent = card.name;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-card-button';
        removeButton.textContent = '－ 削除';
        removeButton.addEventListener('click', () => onRemove(card.id));

        cardDiv.appendChild(label);
        cardDiv.appendChild(removeButton);
        container.appendChild(cardDiv);
    });
}

// 画像カード一覧を描画します。
function renderCardImages(imageEntries, displayColumns = 3) {
    const container = document.getElementById('image-container');
    if (!container) {
        console.error('image-container not found');
        return;
    }

    container.innerHTML = '';
    updateImageContainerColumns(displayColumns);

    // 上部に表示されるカードを優先表示し、体感速度を改善します。
    const priorityCount = 6;
    const deferredChunkSize = 4;

    function createCardNode(entry, index) {
        const div = document.createElement('div');
        div.className = 'card-div';

        const title = document.createElement('p');
        const relText = entry.card && entry.card.rel
            ? (isNumericReleaseTag(entry.card.rel) ? `[${entry.card.rel}弾] ` : `[${entry.card.rel}] `)
            : '';
        title.textContent = entry.card ? `${relText}${entry.card.name}` : '不明なカード';

        const img = document.createElement('img');
        // 読み込み中はカード背面(0)を表示し、完了後に本画像へ切り替えます。
        img.src = 'src/data/img/thumbnails/0.png';
        img.alt = entry.card ? entry.card.name : 'card image';
        img.classList.add('card-image-loading');
        const isPriority = index < priorityCount;
        img.loading = isPriority ? 'eager' : 'lazy';
        img.decoding = isPriority ? 'sync' : 'async';
        img.fetchPriority = isPriority ? 'high' : 'low';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        // 元の高品質画像のURLをdata属性に保存
        if (entry.originalUrl) {
            img.dataset.originalUrl = entry.originalUrl;
        }
        img.dataset.thumbnailUrl = entry.url;

        const loadedImage = new Image();
        loadedImage.decoding = 'async';
        loadedImage.onload = () => {
            img.src = entry.url;
            img.classList.remove('card-image-loading');
            img.classList.add('card-image-loaded');
        };
        loadedImage.onerror = () => {
            const fallbackImage = new Image();
            fallbackImage.decoding = 'async';
            fallbackImage.onload = () => {
                img.src = entry.originalUrl;
                img.classList.remove('card-image-loading');
                img.classList.add('card-image-loaded');
            };
            fallbackImage.onerror = () => {
                img.src = 'src/data/img/thumbnails/0.png';
                img.classList.remove('card-image-loading');
                img.classList.add('card-image-loaded');
            };
            fallbackImage.src = entry.originalUrl || '';
        };
        loadedImage.src = entry.url;

        img.addEventListener('click', () => {
            openCardPreview(entry);
        });

        div.appendChild(title);
        div.appendChild(img);
        return div;
    }

    const priorityEntries = imageEntries.slice(0, priorityCount);
    const deferredEntries = imageEntries.slice(priorityCount);

    priorityEntries.forEach((entry, index) => {
        container.appendChild(createCardNode(entry, index));
    });

    if (deferredEntries.length === 0) {
        return;
    }

    let cursor = 0;
    const appendDeferred = () => {
        const end = Math.min(cursor + deferredChunkSize, deferredEntries.length);
        for (let i = cursor; i < end; i++) {
            container.appendChild(createCardNode(deferredEntries[i], priorityCount + i));
        }
        cursor = end;

        if (cursor < deferredEntries.length) {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(appendDeferred, { timeout: 120 });
            } else {
                window.requestAnimationFrame(appendDeferred);
            }
        }
    };

    appendDeferred();
}

export { clearContainer, populateCardSelect, renderReleasePeriodOptions, renderSelectedCards, renderCardImages, updateImageContainerColumns };