// dataLoader.js
// このモジュールはCSVファイルからカードデータを読み込み、
// アプリで利用できる形に変換する責務を持ちます。
// ここではデータの構築と、検索用に使いやすい状態の生成を行います。

const csvFilePath = 'src/data/TRETRA_Card.csv';
const cardRelPath = 'src/data/Card_Rel.csv';

// テキストを正規化して、小文字・余分な空白を削除します。
function normalizeText(text) {
    if (!text) return '';
    return text
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

// カード検索用のキーを作成します。
// カード名と発売情報を結合し、検索時に参照しやすくします。
function buildSearchKey(card) {
    const name = normalizeText(card.name);
    const rel = normalizeText(card.rel);
    return `${name} ${rel}`;
}

// Card_Rel.csv を読み込み、IDからリリース情報を取得するマップを生成します。
async function loadCardRel() {
    const response = await fetch(cardRelPath);
    const text = await response.text();
    const rows = text.split('\n').slice(1);
    const relMap = {};

    rows.forEach(row => {
        const [id, value] = row.split(',');
        if (!id) return;
        relMap[id.trim()] = value ? value.trim() : '';
    });

    return relMap;
}

// TRETRA_Card.csv を読み込み、各行をカードオブジェクトに変換します。
// 読み込み後に検索用キーも追加します。
async function loadCards() {
    const cardRelMap = await loadCardRel();
    const response = await fetch(csvFilePath);
    const text = await response.text();
    const rows = text.split('\n').slice(1);

    const cards = rows
        .map(row => row.split(','))
        .filter(cols => cols.length >= 2 && cols[0])
        .map(cols => {
            const relValue = cardRelMap[cols[2]] || cols[2] || '';
            const card = {
                id: cols[0].trim(),
                name: cols[1].trim(),
                rel: relValue,
                streng: cols[3] ? cols[3].trim() : '',
                strengAdd: cols[4] ? cols[4].trim() : '',
                tres: cols[5] ? cols[5].trim() : '',
                order: cols[6] ? cols[6].trim() : '',
                mainTxt: cols[7] ? cols[7].trim() : '',
                frebTxt: cols[8] ? cols[8].trim() : '',
                illustrator: cols[9] ? cols[9].trim() : ''
            };

            card.searchKey = buildSearchKey(card);
            return card;
        });

    return cards;
}

// カードデータからユニークな発売時期を抽出します。
function getUniqueReleasePeriods(cards) {
    return [...new Set(cards.map(card => card.rel).filter(Boolean))];
}

export { loadCards, loadCardRel, normalizeText, buildSearchKey, getUniqueReleasePeriods };