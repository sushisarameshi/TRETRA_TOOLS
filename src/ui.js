// ui.js
// このモジュールはDOMの描画に専念します。
// アプリの状態を受け取り、カード一覧・選択済みカード・発売時期UIを描画します。

function clearContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

// カード選択用の<select>要素を生成します。
function populateCardSelect(cards) {
    const select = document.getElementById('card-select');
    if (!select) return;

    select.innerHTML = '';

    cards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;
        const releaseInfo = card.rel ? (parseFloat(card.rel) ? `[${card.rel}弾]` : ` [${card.rel}]`) : '';
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
        label.textContent = parseFloat(period) ? ` 第${period}弾` : ` ${period}`;

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
function renderCardImages(imageEntries) {
    const container = document.getElementById('image-container');
    if (!container) {
        console.error('image-container not found');  // デバッグログ
        return;
    }

    container.innerHTML = '';
    console.log('rendering images:', imageEntries);  // デバッグログ

    imageEntries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'card-div';

        const title = document.createElement('p');
        title.textContent = entry.card ? `${entry.card.rel ? `[${entry.card.rel}弾] ` : ''}${entry.card.name}` : '不明なカード';

        const img = document.createElement('img');
        img.src = entry.url;
        img.alt = entry.card ? entry.card.name : 'card image';
        img.loading = 'lazy';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';

        console.log('setting img.src:', img.src);  // デバッグログ

        div.appendChild(title);
        div.appendChild(img);
        container.appendChild(div);
    });

    console.log('container children:', container.children.length);  // デバッグログ
}

export { clearContainer, populateCardSelect, renderReleasePeriodOptions, renderSelectedCards, renderCardImages };