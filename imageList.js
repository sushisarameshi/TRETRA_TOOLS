// imageList.js

export function getRandomImageUrls(count, maxDuplicates = 2, preselected = [], filteredCardIds = []) {
  const basePath = './data/img/card_list/'; // 画像が保存されているパス
  const totalImages = filteredCardIds.length;// 画像の総数を計算

  // maxDuplicates 許可される最大の重複回数

  // 選択範囲が小さすぎる場合はエラーをスローする
  if (totalImages * maxDuplicates < count) {
    throw new Error("指定した範囲では十分な数のカードを選択できません。カードの範囲を見直してください。");
  }

  const randomImageUrls = []; // 最初に選択されたカードを追加
  const imageCounts = {}; // 画像ごとのカウントを追跡するオブジェクト

  // 事前選択されたカードのカウントを初期化
  preselected.forEach(num => {
    const imageUrl = `${basePath}${num}.png`;
    if (!imageCounts[imageUrl]) {
      imageCounts[imageUrl] = 0;
    }

    // 事前選択されたカードが重複上限に達していない場合のみ追加
    if (imageCounts[imageUrl] < maxDuplicates) {
      randomImageUrls.push(imageUrl);
      imageCounts[imageUrl]++;
    }
  });

  // ランダムな画像URLを生成
  while (randomImageUrls.length < count) {
    const randomIndex = Math.floor(Math.random() * filteredCardIds.length);
    const imageUrl = `${basePath}${filteredCardIds[randomIndex]}.png`;

      // 画像が存在しない場合にエラー表示を回避する
    if (!imageCounts[imageUrl]) {
      imageCounts[imageUrl] = 0;
    }

      // 画像の重複が許可される最大回数を超えていないかチェック
    if (imageCounts[imageUrl] < maxDuplicates) {
      randomImageUrls.push(imageUrl);
      imageCounts[imageUrl]++;
    }
  }
  return randomImageUrls;
}
