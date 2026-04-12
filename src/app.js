// app.js
// このモジュールはアプリの起動、状態管理、イベント登録、
// 画像表示の制御を担当します。

import { loadCards, getUniqueReleasePeriods } from './dataLoader.js';
import { renderReleasePeriodOptions, populateCardSelect, renderCardImages, renderSelectedCards, clearContainer } from './ui.js';
import { getRandomImages } from './imagePicker.js';
import { filterCardsBySearch } from './search.js';
import { filterCardsByReleasePeriod } from './loadCards.js';

const deckSize = 10; // 1回表示するカード枚数
const state = {
  allCards: [],
  filteredCards: [],
  selectedCardIds: []
};

// アプリ起動処理
async function initApp() {
  const cards = await loadCards();

  state.allCards = cards;
  state.filteredCards = [...cards];
  state.selectedCardIds = [];

  window.allCards = cards;
  window.filteredCards = state.filteredCards;

  const periods = getUniqueReleasePeriods(cards);
  renderReleasePeriodOptions(periods);
  populateCardSelect(cards);
  renderSelectedCards([]);
  setupEventListeners();
  await renderImages();
}

// preselected-cards の値を state に変換します。
function getSelectedCardIds() {
  const input = document.getElementById('preselected-cards');
  if (!input || !input.value) return [];
  return input.value
    .split(',')
    .map(id => id.trim())
    .filter(id => id !== '');
}

// state.selectedCardIds の値を hidden input に反映します。
function syncSelectedCardInput() {
  const input = document.getElementById('preselected-cards');
  if (!input) return;
  input.value = state.selectedCardIds.join(',');
}

// 選択IDの並びを保ったまま、表示用カード配列を作成します（重複を保持）。
function getSelectedCardsForDisplay() {
  return state.selectedCardIds
    .map(id => state.allCards.find(card => card.id === id))
    .filter(card => !!card);
}

// 事前選択カードを state に登録し、UI を更新します。
function addSelectedCard(cardId) {
  if (!cardId) return;
  const duplicateCount = state.selectedCardIds.filter(id => id === cardId).length;
  if (duplicateCount >= 2 || state.selectedCardIds.length >= 10) return;

  state.selectedCardIds.push(cardId);
  syncSelectedCardInput();
  renderSelectedCards(getSelectedCardsForDisplay(), removeSelectedCard);
}

// 事前選択カードを削除します。
function removeSelectedCard(cardId) {
  // 同一カードが複数ある場合は、1回の削除で1枚だけ減らします。
  const targetIndex = state.selectedCardIds.indexOf(cardId);
  if (targetIndex === -1) return;
  state.selectedCardIds.splice(targetIndex, 1);
  syncSelectedCardInput();
  renderSelectedCards(getSelectedCardsForDisplay(), removeSelectedCard);
}

// 事前選択カードをすべて削除します。
function clearAllSelectedCards() {
  state.selectedCardIds = [];
  syncSelectedCardInput();
  renderSelectedCards([], removeSelectedCard);
}

function setupEventListeners() {
  const searchInput = document.getElementById('card-search');
  const addButton = document.getElementById('add-selected-card-button');
  const clearAllButton = document.getElementById('clear-all-selected-cards-button');
  const changeButton = document.getElementById('change-images-button');
  const releasePeriodContainer = document.getElementById('release-period-container');

  if (searchInput) {
    searchInput.addEventListener('keyup', event => {
      state.filteredCards = filterCardsBySearch(state.allCards, event.target.value);
      window.filteredCards = state.filteredCards;
      populateCardSelect(state.filteredCards);
    });
  }

  if (addButton) {
    addButton.addEventListener('click', () => {
      const select = document.getElementById('card-select');
      const selectedCardId = select ? select.value : '';
      addSelectedCard(selectedCardId);
    });
  }

  // 一括解除ボタンのイベントリスナー追加
  if (clearAllButton) {
    clearAllButton.addEventListener('click', () => {
      clearAllSelectedCards();
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
      window.filteredCards = state.filteredCards;
      populateCardSelect(state.filteredCards);
      renderImages();
    });
  }
}

// 画像表示処理の入口。
async function renderImages() {
  clearContainer('image-container');
  state.selectedCardIds = getSelectedCardIds();

  const imageEntries = await getRandomImages(state.filteredCards, state.selectedCardIds, deckSize);
  const entries = imageEntries.map(item => {
    const card = state.allCards.find(card => parseInt(card.id, 10) === item.id);
    // 元の高品質画像のパスを構築（サムネイルではなく元画像を使う）
    const originalUrl = `src/data/img/card_list/${item.id}.png`;
    return {
      url: item.url,
      originalUrl: originalUrl,
      card: card
    };
  });

  renderCardImages(entries);
}

export { initApp, state, setupEventListeners, renderImages };

window.onload = initApp;