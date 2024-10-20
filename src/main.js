// main.js

// 40種類の画像URLを配列に格納
import { loadCards, filterCardsByReleasePeriod } from './loadCards.js';
import { getRandomImageUrls, imageExists } from './imageList.js';
import { populateCardSelect } from './pullDown.js';
import * as wanakana from 'wanakana';
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

        // カード番号で昇順にソート
        imageUrls.sort((a, b) => {
            const idA = parseInt(a.match(/(\d+)\./)[1], 10);
            const idB = parseInt(b.match(/(\d+)\./)[1], 10);
            return idA - idB;
        });

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
            const cardRel = parseFloat(card.rel) ? `[${card.rel}弾] ` : ` [${card.rel}] `;
            title.textContent = card ? cardRel + card.name : '不明なカード'; // カードが見つからない場合の処理

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

// 検索ボックスの入力に基づいてプルダウンをフィルタリングする関数
document.getElementById('card-search').addEventListener('keyup', function() {
    const query = wanakana.toHiragana(this.value);// 入力をひらがなに変換
    const filteredCards = window.allCards.filter(card => wanakana.toHiragana(card.name).includes(query)); // カード名もひらがなに変換して検索
    populateCardSelect(filteredCards); // フィルタリングされたカードでプルダウンを更新
});

// ボタンがクリックされたときに選択されたカードを追加
document.getElementById('add-selected-card-button').addEventListener('click', () => {
    const select = document.getElementById('card-select');
    const selectedCardId = select.value;
    const preselectedInput = document.getElementById('preselected-cards');
    const selectedCardsContainer = document.getElementById('selected-cards-container');
    
    // 既に選択済みかチェック
    const selectedCardIds = preselectedInput.value.split(',').map(num => num.trim()); //選択済みの配列が入る
    const count = selectedCardIds.filter(value => value === selectedCardId).length;
    if (count < 2 && selectedCardIds.length < 10) {
        // カード名を取得
        const selectedCardOption = select.options[select.selectedIndex];
        const cardName = selectedCardOption.text;

        // カードを追加（preselectedInputに）
        preselectedInput.value += preselectedInput.value ? `,${selectedCardId}` : selectedCardId;

        // 表示するカードを作成（cardDivを新たに作成）
        const cardDiv = document.createElement('div');
        cardDiv.className = 'selected-card';
        cardDiv.setAttribute('data-card-id', selectedCardId);
        cardDiv.innerHTML = `
            <span>${cardName}</span>
            <button class="remove-card-button"> － 削除</button>
        `;
        selectedCardsContainer.appendChild(cardDiv);

        // 削除ボタンのイベントリスナー
        cardDiv.querySelector('.remove-card-button').addEventListener('click', () => {
            const cardId = cardDiv.getAttribute('data-card-id');
            preselectedInput.value = preselectedInput.value.split(',').filter(id => id !== cardId).join(',');
            selectedCardsContainer.removeChild(cardDiv);
        });
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

// resizeイベントをデバウンスする
window.addEventListener('resize', debounce(() => {
    adjustLayout(); // レイアウトの調整のみ行う
}, 300)); // 300ミリ秒の遅延

const modalOpenButton = document.getElementById('export-deck-button');
modalOpenButton.addEventListener('click', function() {
    adjustModalSize(); // ウィンドウの高さに合わせてモーダルの高さを調整する関数
    // モーダルを開く処理
});

// モーダルのサイズ調節用
window.addEventListener('resize', function() {
    adjustModalSize(); // ウィンドウの高さに合わせてモーダルの高さを調整する関数
  });

  function adjustModalSize(){
    const modal = document.querySelector('.modal-content');
    modal.style.maxHeight = window.innerHeight - 100 + 'px';
    modal.style.margin = window.innerHeight/6 + 'px auto';
}

document.getElementById('modal-background').addEventListener('click', function() {
    document.getElementById('deckModal').style.display = 'none'; // モーダルを閉じる
});