// imagePicker.js
// このモジュールはカードIDから画像URL候補を生成し、
// ならびにランダム抽出のロジックを提供します。

const basePath = 'src/data/img/card_list/';
const supportedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

// 1つのカードIDに対応する全ての画像形式の候補URLを生成します。
function buildImageUrlsFromId(cardId) {
    return supportedFormats.map(extension => `${basePath}${cardId}.${extension}`);
}

// 画像数を満たすまで、フィルタ済みカードIDからランダムにIDを選びます。
// preselected は先に選ばれているカードIDリストです。
// maxDuplicates は同じカードIDを許容する上限です。
function pickRandomIds(filteredCardIds, count, maxDuplicates = 2, preselected = []) {
    const imageCounts = {};
    const result = [];

    preselected.forEach(id => {
        const key = `${id}`;
        imageCounts[key] = (imageCounts[key] || 0) + 1;
        if (imageCounts[key] <= maxDuplicates) {
            result.push(id);
        }
    });

    while (result.length < count && filteredCardIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredCardIds.length);
        const id = filteredCardIds[randomIndex];
        const key = `${id}`;
        imageCounts[key] = imageCounts[key] || 0;

        if (imageCounts[key] < maxDuplicates) {
            imageCounts[key] += 1;
            result.push(id);
        }
    }

    return result.slice(0, count);
}

// ランダム抽出したカードIDごとに画像URL候補を返します。
// 実際に存在する画像形式の判定は、このモジュールの外で行う想定です。
async function getRandomImageUrls(count, maxDuplicates = 2, preselected = [], filteredCardIds = []) {
    const selectedIds = pickRandomIds(filteredCardIds, count, maxDuplicates, preselected);
    const urls = [];

    selectedIds.forEach(id => {
        const possibleUrls = buildImageUrlsFromId(id);
        urls.push({ id, urls: possibleUrls });
    });

    return urls;
}

export { buildImageUrlsFromId, pickRandomIds, getRandomImageUrls };