// 40種類の画像URLを配列に格納

document.getElementById('export-deck-button').addEventListener('click', () => {
    const cardDivs = document.querySelectorAll('.card-div img');  // 各カードの<img>要素を取得
    const selectedCardUrls = Array.from(cardDivs).map(img => img.src);  // 画像のURLを配列に変換

    const canvas = document.getElementById('deckCanvas');
    const ctx = canvas.getContext('2d');

    const cardWidth = 274;  // カードの幅を調整
    const cardHeight = 383;  // カードの高さを調整
    const gridColumns = 5;  // カラムの数
    const gridRows = Math.ceil(selectedCardUrls.length / gridColumns);

    canvas.width = gridColumns * cardWidth;
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
});

function exportCanvasAsJPG() {
    const canvas = document.getElementById('deckCanvas');
    const jpgUrl = canvas.toDataURL('image/jpeg', 1.0);  // 高品質
    const link = document.createElement('a');
    link.href = jpgUrl;
    link.download = 'deck.jpg';
    link.click();
}