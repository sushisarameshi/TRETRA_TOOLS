// app.js
// このモジュールはアプリの起動と状態管理を担当します。
// データローダー・UI・検索・画像抽出を組み合わせてアプリを初期化します。

import { loadCards, getUniqueReleasePeriods } from './dataLoader.js';
import { renderReleasePeriodOptions, populateCardSelect, renderCardImages, renderSelectedCards, clearContainer } from './ui.js';
import { getRandomImageUrls } from './imagePicker.js';
import { filterCardsBySearch } from './search.js';
import { filterCardsByReleasePeriod } from './loadCards.js';

const state = {
    allCards: [],
    filteredCards: [],
    selectedCardIds: []
};

// アプリ起動時に呼び出す初期化関数。
// カードデータを読み込み、UIを構築し、イベントリスナーを登録します。
async function initApp() {
    const cards = await loadCards();                            // カードデータを読み込みます。
    state.allCards = cards;                                     // すべてのカードデータを状態に保存します。
    state.filteredCards = [...cards];                           // 初期状態ではすべてのカードを表示対象とする
    window.allCards = cards;  // 互換性のため一時的に残す         // window.filteredCards は検索や発売時期フィルタリングの結果を保持するために使用します。
    window.filteredCards = state.filteredCards;                 // これにより、検索や発売時期のフィルタリングを行うたびに window.filteredCards を更新し、UI描画関数は常に最新のフィルタリング結果を参照できるようになります。

    // UIの初期化：発売時期のオプションを生成し、カード選択ドロップダウンを描画します。
    const periods = getUniqueReleasePeriods(cards);
    renderReleasePeriodOptions(periods);    // 発売時期のチェックボックスを描画
    populateCardSelect(cards);              // カード選択用のドロップダウンを描画
    renderImages();                         // 初期画像表示
    setupEventListeners();                  // ユーザー操作のイベントリスナー登録
}

// ユーザー操作に対応するイベントを登録します。
function setupEventListeners() {
    const searchInput = document.getElementById('card-search');
    const addButton = document.getElementById('add-selected-card-button');
    const changeButton = document.getElementById('change-images-button');
    const releasePeriodContainer = document.getElementById('release-period-container');

    if (searchInput) {
        searchInput.addEventListener('keyup', event => {
            state.filteredCards = filterCardsBySearch(state.allCards, event.target.value);
            populateCardSelect(state.filteredCards);
        });
    }

    if (addButton) {
        addButton.addEventListener('click', () => {
            // ここに選択カードを事前選択リストに追加する処理を実装します。
            // 追加後は renderSelectedCards() を呼び出してUIを更新します。
        });
    }

    if (changeButton) {
        changeButton.addEventListener('click', () => {
            renderImages();
        });
    }

    if (releasePeriodContainer) {
        releasePeriodContainer.addEventListener('change', () => {
            state.filteredCards = filterCardsByReleasePeriod(state.allCards);
            populateCardSelect(state.filteredCards);
            renderImages();
        });
    }
}

// 画像表示処理の入口。
// フィルタ済みカードのIDから画像URL候補を生成し、UI描画に渡します。
async function renderImages() {
    clearContainer('image-container');
    const filteredIds = state.filteredCards.map(card => card.id);
    console.log('filteredIds:', filteredIds);  // デバッグログ

    const imageEntries = await getRandomImageUrls(10, 2, state.selectedCardIds, filteredIds);
    console.log('imageEntries:', imageEntries);  // デバッグログ

    const entries = imageEntries.map(item => ({
        url: item.urls[0] || '',
        card: state.allCards.find(card => card.id === item.id)
    }));
    console.log('entries:', entries);  // デバッグログ

    renderCardImages(entries);
}

export { initApp, state, setupEventListeners, renderImages };

window.onload = initApp;