// app.js
// このモジュールはアプリの起動、状態管理、イベント登録、
// 画像表示の制御を担当します。

import { loadCards, getUniqueReleasePeriods } from './dataLoader.js';
import { renderReleasePeriodOptions, populateCardSelect, renderCardImages, renderSelectedCards, clearContainer, updateImageContainerColumns } from './ui.js';
import { getRandomImages } from './imagePicker.js';
import { filterCardsBySearch } from './search.js';
import { filterCardsByReleasePeriod } from './loadCards.js';

const deckSize = 10; // 1回表示するカード枚数
const state = {
  allCards: [],
  filteredCards: [],
  selectedCardIds: [],
  displayColumns: 3,
  currentEntries: [],
  prefetchedEntries: null,
  prefetchedKey: ''
};

function getDefaultDisplayColumns() {
  return window.matchMedia('(max-width: 768px)').matches ? 3 : 5;
}

function buildDeckPrefetchKey(filteredCards, selectedCardIds) {
  const filteredKey = filteredCards.map(card => card.id).join(',');
  const selectedKey = selectedCardIds.join(',');
  return `${filteredKey}|${selectedKey}`;
}

function mapImageEntriesToRenderEntries(imageEntries) {
  return imageEntries.map(item => {
    const card = state.allCards.find(card => parseInt(card.id, 10) === item.id);
    const originalUrl = `src/data/img/card_list/${item.id}.png`;
    return {
      url: item.url,
      originalUrl,
      card
    };
  });
}

function preloadDeckImages(entries) {
  entries.forEach(entry => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => {
      if (!entry.originalUrl) return;
      const fallback = new Image();
      fallback.decoding = 'async';
      fallback.src = entry.originalUrl;
    };
    img.src = entry.url;
  });
}

let prefetchTimer = null;
let prefetchRequestId = 0;

async function prefetchNextDeck() {
  const requestId = ++prefetchRequestId;
  const filteredSnapshot = [...state.filteredCards];
  const selectedSnapshot = getSelectedCardIds();
  const prefetchKey = buildDeckPrefetchKey(filteredSnapshot, selectedSnapshot);

  try {
    const imageEntries = await getRandomImages(filteredSnapshot, selectedSnapshot, deckSize);
    if (requestId !== prefetchRequestId) return;

    const entries = mapImageEntriesToRenderEntries(imageEntries);
    state.prefetchedEntries = entries;
    state.prefetchedKey = prefetchKey;

    preloadDeckImages(entries);
  } catch (_) {
    if (requestId !== prefetchRequestId) return;
    state.prefetchedEntries = null;
    state.prefetchedKey = '';
  }
}

function scheduleDeckPrefetch(delay = 80) {
  if (prefetchTimer) {
    clearTimeout(prefetchTimer);
  }
  prefetchTimer = window.setTimeout(() => {
    prefetchNextDeck();
  }, delay);
}

// アプリ起動処理
async function initApp() {
  state.displayColumns = getDefaultDisplayColumns();
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
  scheduleDeckPrefetch(0);
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

// 指定カードと同じ sameCardId を持つカードが選択済みリストに何枚あるかを数えます。
// イラスト差分カード（異なるID・同じ性能）を同一カードとして扱います。
function countSameCardSelected(cardId) {
  const card = state.allCards.find(c => c.id === cardId);
  if (!card) return 0;
  return state.selectedCardIds.filter(id => {
    const c = state.allCards.find(c => c.id === id);
    return c && c.sameCardId === card.sameCardId;
  }).length;
}

// 事前選択カードを state に登録し、UI を更新します。
function addSelectedCard(cardId) {
  if (!cardId) return;
  // sameCardId 単位で重複数をチェック（イラスト差分も同一カードとして制限）
  if (countSameCardSelected(cardId) >= 2 || state.selectedCardIds.length >= 10) return;

  state.selectedCardIds.push(cardId);
  syncSelectedCardInput();
  renderSelectedCards(getSelectedCardsForDisplay(), removeSelectedCard);
  scheduleDeckPrefetch();
}

// 事前選択カードを削除します。
function removeSelectedCard(cardId) {
  // 同一カードが複数ある場合は、1回の削除で1枚だけ減らします。
  const targetIndex = state.selectedCardIds.indexOf(cardId);
  if (targetIndex === -1) return;
  state.selectedCardIds.splice(targetIndex, 1);
  syncSelectedCardInput();
  renderSelectedCards(getSelectedCardsForDisplay(), removeSelectedCard);
  scheduleDeckPrefetch();
}

// 事前選択カードをすべて削除します。
function clearAllSelectedCards() {
  state.selectedCardIds = [];
  syncSelectedCardInput();
  renderSelectedCards([], removeSelectedCard);
  scheduleDeckPrefetch();
}

function setupEventListeners() {
  const searchInput = document.getElementById('card-search');
  const addButton = document.getElementById('add-selected-card-button');
  const clearAllButton = document.getElementById('clear-all-selected-cards-button');
  const changeButton = document.getElementById('change-images-button');
  const decreaseColumnsButton = document.getElementById('decrease-columns-button');
  const increaseColumnsButton = document.getElementById('increase-columns-button');
  const columnsValue = document.getElementById('display-columns-value');
  const releasePeriodContainer = document.getElementById('release-period-container');

  const updateColumnsLabel = () => {
    if (columnsValue) {
      columnsValue.textContent = String(state.displayColumns);
    }
  };

  const applyColumnsLayoutOnly = () => {
    updateImageContainerColumns(state.displayColumns);
  };

  updateColumnsLabel();

  if (searchInput) {
    searchInput.addEventListener('keyup', event => {
      state.filteredCards = filterCardsBySearch(state.allCards, event.target.value);
      window.filteredCards = state.filteredCards;
      populateCardSelect(state.filteredCards);
      scheduleDeckPrefetch();
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

  if (decreaseColumnsButton) {
    decreaseColumnsButton.addEventListener('click', () => {
      state.displayColumns = Math.max(2, state.displayColumns - 1);
      updateColumnsLabel();
      applyColumnsLayoutOnly();
    });
  }

  if (increaseColumnsButton) {
    increaseColumnsButton.addEventListener('click', () => {
      state.displayColumns = Math.min(5, state.displayColumns + 1);
      updateColumnsLabel();
      applyColumnsLayoutOnly();
    });
  }

  if (releasePeriodContainer) {
    releasePeriodContainer.addEventListener('change', () => {
      state.filteredCards = filterCardsByReleasePeriod(state.allCards);
      window.filteredCards = state.filteredCards;
      populateCardSelect(state.filteredCards);
      scheduleDeckPrefetch();
    });
  }
}

// 画像表示処理の入口。
async function renderImages() {
  clearContainer('image-container');
  state.selectedCardIds = getSelectedCardIds();
  const currentKey = buildDeckPrefetchKey(state.filteredCards, state.selectedCardIds);
  let entries = null;

  if (state.prefetchedEntries && state.prefetchedKey === currentKey) {
    entries = state.prefetchedEntries;
  } else {
    const imageEntries = await getRandomImages(state.filteredCards, state.selectedCardIds, deckSize);
    entries = mapImageEntriesToRenderEntries(imageEntries);
  }

  state.currentEntries = entries;
  state.prefetchedEntries = null;
  state.prefetchedKey = '';
  renderCardImages(state.currentEntries, state.displayColumns);
  scheduleDeckPrefetch(30);
}

export { initApp, state, setupEventListeners, renderImages };

window.onload = initApp;