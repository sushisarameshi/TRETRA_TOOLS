// imageList.js

export async function getRandomImageUrls(count, maxDuplicates = 2, preselected = [], filteredCardIds = []) {
  const basePath = 'src/data/img/card_list/'; // 画像が保存されているパス
  const totalImages = filteredCardIds.length; // 画像の総数を計算

  // maxDuplicates 許可される最大の重複回数

  // 選択範囲が小さすぎる場合はエラーをスローする
  if (totalImages * maxDuplicates < count) {
    throw new Error("指定した範囲では十分な数のカードを選択できません。カードの範囲を見直してください。");
  }

  const randomImageUrls = []; // 最初に選択されたカードを追加
  const imageCounts = {}; // 画像ごとのカウントを追跡するオブジェクト
  // 対応する画像形式の配列
  const supportedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
  let p_select_idx = 0;
  // 事前選択されたカードのカウントを初期化
  for (const num of preselected) {
    
    let imageUrl = `${basePath}${num}.png`;
    // 画像形式を検索
    for (const format of supportedFormats) {
      const possibleImageUrl = `${basePath}${preselected[p_select_idx]}.${format}`;
      // 画像の存在確認 (非同期処理を同期的に待つ)
      if (await imageExists(possibleImageUrl)) {
        imageUrl = possibleImageUrl;
        break;
      }
    }
    if (!imageCounts[imageUrl]) {
      imageCounts[imageUrl] = 0;
    }

    // 事前選択されたカードが重複上限に達していない場合のみ追加
    if (imageCounts[imageUrl] < maxDuplicates) {
      randomImageUrls.push(imageUrl);
      imageCounts[imageUrl]++;
    }
    p_select_idx++;
  }



  // ランダムな画像URLを生成
  while (randomImageUrls.length < count) {
    const randomIndex = Math.floor(Math.random() * filteredCardIds.length);
    let imageUrl = null;

    // 画像形式ごとに存在確認を行う
    for (const format of supportedFormats) {
      const possibleImageUrl = `${basePath}${filteredCardIds[randomIndex]}.${format}`;

      // 画像の存在確認 (非同期処理を同期的に待つ)
      if (await imageExists(possibleImageUrl)) {
        imageUrl = possibleImageUrl;
        break;
      }
    }

    // 画像が見つからない場合は次のループへ
    if (!imageUrl) {
      continue;
    }

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

export async function imageExists(url) {
  try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok; // ステータスが200-299であればtrueを返す
  } catch (error) {
      return false; // ネットワークエラーなどが発生した場合はfalseを返す
  }
}