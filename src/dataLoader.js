// dataLoader.js
// このモジュールはCSVファイルからカードデータを読み込み、
// アプリで利用できる形に変換する責務を持ちます。
// ここではデータの構築と、検索用に使いやすい状態の生成を行います。

const csvFilePath = 'src/data/TRETRA_Card.csv';
const cardRelPath = 'src/data/Card_Rel.csv';
const otherTagsPath = 'src/data/db/その他タグ一覧.csv';

// 収録弾タグの許可リスト（「未」は除外）。
// 初期値はフォールバックで、起動時に その他タグ一覧.csv から上書きします。
let allowedReleasePeriods = new Set([
    '1',
    '2',
    '1プロモ',
    '2プロモ',
    '3',
    '3プロモ',
    'スターター',
    'INSTANT_TACTICS'
]);

// ダブルクォートと改行を含むCSVを安全に解析します。
function parseCsvRecords(text) {
    const records = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (ch === ',' && !inQuotes) {
            row.push(field);
            field = '';
            continue;
        }

        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && text[i + 1] === '\n') {
                i++;
            }
            row.push(field);
            records.push(row);
            row = [];
            field = '';
            continue;
        }

        field += ch;
    }

    // 末尾行を追加
    row.push(field);
    const hasAnyValue = row.some(cell => String(cell || '').trim() !== '');
    if (hasAnyValue) {
        records.push(row);
    }

    return records;
}

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
    const rows = parseCsvRecords(text).slice(1);
    const relMap = {};

    rows.forEach(cols => {
        const id = cols[0];
        const value = cols[1];
        if (!id) return;
        relMap[id.trim()] = value ? value.trim() : '';
    });

    return relMap;
}

// その他タグ一覧.csv から収録弾タグを読み込みます（ID1=(未)は除外）。
async function loadAllowedReleasePeriods() {
    try {
        const response = await fetch(otherTagsPath);
        const text = await response.text();
        const rows = parseCsvRecords(text);
        const tags = new Set();

        let headerCols = null;
        rows.forEach(cols => {
            if (headerCols) return;
            const normalized = cols.map(col => String(col || '').trim());
            if (normalized.includes('ID') && normalized.includes('タグ名')) {
                headerCols = normalized;
            }
        });

        if (!headerCols) {
            return;
        }

        const idIndex = headerCols.indexOf('ID');
        const tagNameIndex = headerCols.indexOf('タグ名');
        if (idIndex < 0 || tagNameIndex < 0) {
            return;
        }

        rows.forEach(cols => {
            const id = (cols[idIndex] || '').trim();
            const tagName = (cols[tagNameIndex] || '').trim();
            if (!id || !tagName) return;
            if (!/^\d+$/.test(id)) return;
            if (id === '1') return; // (未) は除外
            tags.add(tagName);
        });

        if (tags.size > 0) {
            allowedReleasePeriods = tags;
        }
    } catch (error) {
        // 読み込み失敗時はフォールバックのタグセットを使用します。
        console.warn('Failed to load その他タグ一覧.csv, fallback tags are used:', error);
    }
}

// TRETRA_Card.csv を読み込み、各行をカードオブジェクトに変換します。
// 読み込み後に検索用キーも追加します。
async function loadCards() {
    await loadAllowedReleasePeriods();
    const cardRelMap = await loadCardRel();
    const response = await fetch(csvFilePath);
    const text = await response.text();
    const rows = parseCsvRecords(text).slice(1);

    const cards = rows
        .filter(cols => cols.length >= 2 && cols[0] && /^\d+$/.test(String(cols[0]).trim()))
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
                illustrator: cols[9] ? cols[9].trim() : '',
                // convert-db.js によって追加される列（旧CSVには存在しない場合は空文字）
                yomi: cols[12] ? cols[12].trim() : '',
                // sameCardId: イラスト差分の同一カードを識別するID（枚数制限に使用）
                sameCardId: cols[13] ? cols[13].trim() : ''
            };

            // sameCardId が空の場合は card.name の正規化値をフォールバックとして使用
            if (!card.sameCardId) {
                card.sameCardId = card.name.replace(/[\s\u3000]/g, '');
            }

            card.searchKey = buildSearchKey(card);
            return card;
        });

    return cards;
}

// カードデータからユニークな発売時期を抽出します。
function getUniqueReleasePeriods(cards) {
    return [...new Set(
        cards
            .map(card => card.rel)
            .filter(rel => !!rel && allowedReleasePeriods.has(rel))
    )];
}

export { loadCards, loadCardRel, normalizeText, buildSearchKey, getUniqueReleasePeriods };