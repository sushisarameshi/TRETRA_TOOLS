// main.js

// 40種類の画像URLを配列に格納
import { loadCards, filterCardsByReleasePeriod } from './loadCards.js';
import { getRandomImageUrls, imageExists } from './imageList.js';
let deck_size = 10;

// サポートする画像形式の配列
const supportedExtensions = ['png', 'jpg', 'jpeg'];


// フィルタリングされたカードからランダム画像を取得する関数
async function getRandomImages(filteredCards) {
    const preselectedCardsInput = document.getElementById('preselected-cards').value;
    // カンマで区切られたカード番号を配列に変換
    const preselectedCards = preselectedCardsInput.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));

    try {
        const filteredCardIds = filteredCards.map(card => parseInt(card.id, deck_size));
        const imageUrls = await getRandomImageUrls(deck_size, 2, preselectedCards, filteredCardIds);

        // 画像URLとカードIDをマッピングする
        return imageUrls.map(url => {
            let cardId = null;
            for (const ext of supportedExtensions) {
                const match = url.match(new RegExp(`(\\d+)\\.${ext}$`)); // 画像URLからカードIDを抽出
                if (match) {
                    cardId = parseInt(match[1], 10);
                    break;
                }
            }
            if (cardId === null) {
                console.error(`URL does not match any supported pattern: ${url}`);
                return { url, card: null };
            }
            // すべてのカード（window.allCards）からカード情報を取得
            const card = window.allCards.find(card => parseInt(card.id, 10) === cardId);
            if (!card) {
                console.error(`Card with ID ${cardId} not found in allCards.`);
            }
            return { url, card };
        });
    } catch (error) {
        alert(error.message);
        return [];
    }
}

// 画像を表示する
let isDisplayingImages = false;

async function displayImages() {
    if (isDisplayingImages) return; // すでに実行中ならば処理を中断
    isDisplayingImages = true; // フラグを立てる

    const filteredCards = window.filteredCards || [];
    const images = await getRandomImages(filteredCards);
    const container = document.getElementById("image-container");
    container.innerHTML = '';

    if (filteredCards.length === 0) {
        const defaultFilteredCards = filterCardsByReleasePeriod(window.allCards);
        const defaultImages = await getRandomImages(defaultFilteredCards);

        if (defaultImages.length > 0) {
            for (const { url, card } of defaultImages) {
                const div = document.createElement("div"); // 画像とタイトルを囲む<div>を作成
                div.classList.add("card-div"); // カードごとのdivにクラスを追加
                const img = document.createElement("img");

                try {
                    const exists = await imageExists(url);
                    img.src = exists ? url : './data/img/card_list/0.png'; // 見つからない場合は代替画像を使用
                } catch (error) {
                    console.error(`Failed to check image existence for ${url}: ${error}`);
                    img.src = './data/img/card_list/0.png';
                }
                const title = document.createElement("p"); // カードのタイトル要素を作成
                title.textContent = card ? card.name : '不明なカード'; // カードが見つからない場合の処理

                container.appendChild(div); // <div>をコンテナに追加
                div.appendChild(title); // <div>にタイトルを追加
                div.appendChild(img); // <div>に<img>を追加
            }
        } else {
            alert('デフォルトで選択されたチェックボックスでも画像がありません。');
        }
    } else {
        for (const { url, card } of images) {
            const div = document.createElement("div"); // 画像とタイトルを囲む<div>を作成
            div.classList.add("card-div"); // カードごとのdivにクラスを追加
            const img = document.createElement("img");

            try {
                const exists = await imageExists(url);
                img.src = exists ? url : './data/img/card_list/0.png'; // 見つからない場合は代替画像を使用
            } catch (error) {
                console.error(`Failed to check image existence for ${url}: ${error}`);
                img.src = './data/img/card_list/0.png';
            }
            const title = document.createElement("p"); // カードのタイトル要素を作成
            title.textContent = card ? card.id + '. ' + card.name : '不明なカード'; // カードが見つからない場合の処理

            container.appendChild(div); // <div>をコンテナに追加
            div.appendChild(title); // <div>にタイトルを追加
            div.appendChild(img); // <div>に<img>を追加
        }
    }
    isDisplayingImages = false; // 処理が完了したらフラグをリセット
}

// ページロード時に画像を表示 呼び出しが一度だけ行われるように変更
window.onload = () => {
    loadCards().then(cards => {
        window.allCards = cards;
        const filteredCards = filterCardsByReleasePeriod(cards); // デフォルトでフィルタリング
        window.filteredCards = filteredCards;
        populateCardSelect(cards); // プルダウンメニューにカードを追加
        displayImages(); // 初期表示
    }).catch(error => {
        console.error('Error loading cards:', error);
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

// カードのプルダウンメニューを生成する関数
function populateCardSelect(cards) {
    const select = document.getElementById('card-select');
    select.innerHTML = ''; // 既存のオプションをクリア

    cards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;
        if (parseFloat(card.rel)){
            option.textContent = card.id + '. ' + card.name + ' [第' + card.rel + '弾]';
        }else{
            option.textContent = card.id + '. ' + card.name + ' [' + card.rel + ']';
        }
        
        select.appendChild(option); // メモ：appendChildでhtmlに新しい要素を追加できる
    });
}

// 検索ボックスの入力に基づいてプルダウンをフィルタリングする関数
document.getElementById('card-search').addEventListener('keyup', function() {
    const query = this.value.toLowerCase();
    const filteredCards = window.allCards.filter(card => card.name.toLowerCase().includes(query));
    populateCardSelect(filteredCards); // フィルタリングされたカードでプルダウンを更新
});

// ボタンがクリックされたときに選択されたカードを追加
document.getElementById('add-selected-card-button').addEventListener('click', () => {
    const select = document.getElementById('card-select');
    const selectedCardId = select.value;
    const preselectedInput = document.getElementById('preselected-cards');
    
    if (selectedCardId && !preselectedInput.value.split(',').includes(selectedCardId)) {
        preselectedInput.value += preselectedInput.value ? `,${selectedCardId}` : selectedCardId;
    }
});

// デバウンス関数の例
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function adjustLayout() {
    // 必要に応じて画像のサイズやレイアウトを調整する処理を記述
    // 例: 表示中のカード画像のサイズを変更するなど
    const container = document.getElementById("image-container");
    const images = container.getElementsByTagName("img");

    for (let img of images) {
        // ここで各画像のサイズをリサイズまたは再調整する
        // img.style.width = "新しい幅";
        // img.style.height = "新しい高さ";
    }
}

// resizeイベントをデバウンスする
window.addEventListener('resize', debounce(() => {
    adjustLayout(); // レイアウトの調整のみ行う
}, 300)); // 300ミリ秒の遅延