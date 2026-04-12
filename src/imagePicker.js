// imagePicker.js
// このモジュールは、フィルタ済みカードIDと事前選択IDを受け取り、
// 画像URLを選択して順序を整えて返す役割だけを持ちます。

import { getRandomThumbnailUrls } from './imageList.js';

// フィルタ済みカードデータからカードIDだけを抽出します。
function toCardIds(filteredCards) {
  return filteredCards
    .map(card => parseInt(card.id, 10))
    .filter(id => !Number.isNaN(id));
}

// 画像URLからカードIDを抽出します。
function getCardIdFromUrl(url) {
  const match = url.match(/(\d+)\.(?:png|jpg|jpeg|gif|webp)$/);
  return match ? parseInt(match[1], 10) : NaN;
}

// フィルタ済みカードから、事前選択と重複制限を考慮して画像を取得します。
export async function getRandomImages(filteredCards, preselectedCardIds = [], deckSize = 10) {
  const filteredCardIds = toCardIds(filteredCards);
  const imageUrls = await getRandomThumbnailUrls(deckSize, 2, preselectedCardIds, filteredCardIds);

  const sortedEntries = imageUrls
    .map(url => ({ url, id: getCardIdFromUrl(url) }))
    .filter(entry => !Number.isNaN(entry.id))
    .sort((a, b) => a.id - b.id);

  return sortedEntries;
}

export { getRandomThumbnailUrls } from './imageList.js';

