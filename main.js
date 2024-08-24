// main.js

// 40種類の画像URLを配列に格納
import { loadCards, filterCardsByReleasePeriod } from './loadCards.js';
import { getRandomImageUrls } from './imageList.js';

// フィルタリングされたカードからランダム画像を取得する関数
async function getRandomImages(filteredCards) {
    const preselectedCardsInput = document.getElementById('preselected-cards').value;
    // カンマで区切られたカード番号を配列に変換
    const preselectedCards = preselectedCardsInput.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));

    try {
        const filteredCardIds = filteredCards.map(card => parseInt(card.id, 10));
        return await getRandomImageUrls(10, 2, preselectedCards, filteredCardIds);
    } catch (error) {
        alert(error.message);
        return [];
    }
}

// 画像を表示する
async function displayImages() {
    // フィルタリングされたカードがグローバル変数として利用できる前提で修正
    const filteredCards = window.filteredCards || [];
    const images = await getRandomImages(filteredCards);
    
    const container = document.getElementById("image-container");
    container.innerHTML = '';

    if (filteredCards.length === 0) {
        // デフォルトのチェックボックスで選択された場合に画像を表示
        const defaultFilteredCards = filterCardsByReleasePeriod(window.allCards);
        const defaultImages = await getRandomImages(defaultFilteredCards);

        if (defaultImages.length > 0) {
            defaultImages.forEach(url => {
                const img = document.createElement("img");
                img.src = url;
                img.onerror = () => img.src = './data/img/card_list/0.png'; // 代替画像を設定
                container.appendChild(img);
            });
        } else {
            alert('デフォルトで選択されたチェックボックスでも画像がありません。');
        }
    } else {
        images.forEach(url => {
            const img = document.createElement("img");
            img.src = url;
            img.onerror = () => img.src = './data/img/card_list/0.png'; // 代替画像を設定
            container.appendChild(img);
        });
    }
}

// ページロード時に画像を表示
window.onload = () => {
    loadCards().then(cards => {
        window.allCards = cards;
        const filteredCards = filterCardsByReleasePeriod(cards); // デフォルトでフィルタリング
        window.filteredCards = filteredCards;
        displayImages(); // 初期表示
    });
};

// ボタンがクリックされたときに画像を変更
document.getElementById('change-images-button').addEventListener('click', () => {
    if (window.allCards) {
        const filteredCards = filterCardsByReleasePeriod(window.allCards);
        window.filteredCards = filteredCards;
        displayImages();
    }
});