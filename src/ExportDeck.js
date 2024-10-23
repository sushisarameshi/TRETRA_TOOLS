// ExportDeck.js

// 40種類の画像URLを配列に格納

document.getElementById('export-deck-button').addEventListener('click', () => {
    const cardDivs = document.querySelectorAll('.card-div img');  // 各カードの<img>要素を取得
    const selectedCardUrls = Array.from(cardDivs).map(img => img.src);  // 画像のURLを配列に変換

    // モーダル表示
    const modal = document.getElementById('deckModal');
    modal.style.display = 'block';
    
    // モーダルを閉じる機能
    document.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    const ClearSize = 0.5;
    ExportDeckContents(selectedCardUrls, ClearSize);
});

document.getElementById('hight-quality-button').addEventListener('click', () => {
    let checked = document.getElementById('hight-quality-check').checked;
    const cardDivs = document.querySelectorAll('.card-div img');  // 各カードの<img>要素を取得
    const selectedCardUrls = Array.from(cardDivs).map(img => img.src);  // 画像のURLを配列に変換
    let ClearSize = 0.5;
    if (!checked){
        ClearSize = 1;
    }
    ExportDeckContents(selectedCardUrls, ClearSize);
});

function ExportDeckContents(selectedCardUrls, ClearSize){
    const canvas = document.getElementById('deckCanvas');
    const ctx = canvas.getContext('2d');

    const cardWidth = 741 * ClearSize;  // カードの幅を調整
    const cardHeight = 1036 * ClearSize;  // カードの高さを調整
    const gridColumns = 5;  // カラムの数
    const gridRows = Math.ceil(selectedCardUrls.length / gridColumns);

    canvas.width = gridColumns * cardWidth ;
    canvas.height = gridRows * cardHeight;

    let loadedImages = 0;
    selectedCardUrls.forEach((url, index) => {
        const img = new Image();
        img.onload = () => {
            const x = (index % gridColumns) * cardWidth;
            const y = Math.floor(index / gridColumns) * cardHeight;
            ctx.drawImage(img, x, y, cardWidth, cardHeight);
            loadedImages++;
            if (loadedImages === selectedCardUrls.length) {
                exportCanvasAsJPG();
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
    link.download = 'deck.png';
    link.click();
}

function exportCanvasAsJPG() {
    const canvas = document.getElementById('deckCanvas');
    const jpgUrl = canvas.toDataURL('image/png');

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