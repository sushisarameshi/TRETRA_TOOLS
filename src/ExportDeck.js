// ExportDeck.js

// 40種類の画像URLを配列に格納

let lastExportMimeType = 'image/png';

function getSelectedCardUrls() {
    const cardDivs = document.querySelectorAll('.card-div img');

    return Array.from(cardDivs).map(img => {
        const original = img.dataset.originalUrl || img.src;
        return original;
    });
}

function computeExportSettings(isHighQuality) {
    return {
        clearSize: isHighQuality ? 1 : 0.4,
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

document.getElementById('export-deck-button').addEventListener('click', () => {
    // モーダル表示
    openDeckModal();
    
    // モーダルを閉じる機能
    const closeButton = document.querySelector('.close');
    if (closeButton) {
        closeButton.onclick = closeDeckModal;
    }

    const isHighQuality = document.getElementById('hight-quality-check').checked;
    const selectedCardUrls = getSelectedCardUrls();
    const settings = computeExportSettings(isHighQuality);
    ExportDeckContents(selectedCardUrls, settings);
});

document.getElementById('hight-quality-button').addEventListener('click', () => {
    const checked = document.getElementById('hight-quality-check').checked;
    const selectedCardUrls = getSelectedCardUrls();
    const settings = computeExportSettings(checked);
    ExportDeckContents(selectedCardUrls, settings);
});

function ExportDeckContents(selectedCardUrls, settings){
    if (!selectedCardUrls || selectedCardUrls.length === 0) {
        return;
    }

    const canvas = document.getElementById('deckCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cardWidth = 741 * settings.clearSize;  // カードの幅を調整
    const cardHeight = 1036 * settings.clearSize;  // カードの高さを調整
    const gridColumns = settings.gridColumns;  // カラムの数
    const gridRows = Math.ceil(selectedCardUrls.length / gridColumns);

    canvas.width = gridColumns * cardWidth ;
    canvas.height = gridRows * cardHeight;

    // 毎回クリアして描画ズレを防ぎます。
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let loadedImages = 0;
    selectedCardUrls.forEach((url, index) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            const x = (index % gridColumns) * cardWidth;
            const y = Math.floor(index / gridColumns) * cardHeight;
            ctx.drawImage(img, x, y, cardWidth, cardHeight);
            loadedImages++;
            if (loadedImages === selectedCardUrls.length) {
                lastExportMimeType = settings.mimeType;
                exportCanvasAsJPG(settings.mimeType, settings.quality);
            }
        };
        img.onerror = () => {
            loadedImages++;
            if (loadedImages === selectedCardUrls.length) {
                lastExportMimeType = settings.mimeType;
                exportCanvasAsJPG(settings.mimeType, settings.quality);
            }
        };
        img.src = url;
    });
}



document.getElementById('saveButton').addEventListener('click', () => {
    const popup_content_img = document.querySelector('#popup-content img:first-child');  // 各カードの<img>要素を取得
    saveAsJPG(popup_content_img.currentSrc);
    
});

function saveAsJPG(jpgUrl) {
    const link = document.createElement('a');
    link.href = jpgUrl;
    link.download = lastExportMimeType === 'image/jpeg' ? 'deck.jpg' : 'deck.png';
    link.click();
}

function exportCanvasAsJPG(mimeType = 'image/png', quality = 1) {
    const canvas = document.getElementById('deckCanvas');
    const jpgUrl = canvas.toDataURL(mimeType, quality);

    // // ポップアップ内容の追加
    const popupContent = document.getElementById('popup-content');
    popupContent.innerHTML = '';
    const img = document.createElement('img');
    img.src = jpgUrl;
    // img.style.width = String(card_width/dedc);
    img.style.width = "80%";
    img.style.height = "height auto";
    img.style.margin = '5px';
    popupContent.appendChild(img);
}