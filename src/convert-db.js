// convert-db.js
// 固有データCSVとその他タグ一覧CSVから、
// ウェブシステム用の TRETRA_Card.csv を自動生成するスクリプトです。
//
// 使い方:
//   1. src/data/db/ に次の2ファイルを配置
//      - 固有データ.csv
//      - その他タグ一覧.csv
//   2. npm run convert-db を実行
//
// 入力:
//   - src/data/db/固有データ.csv
//   - src/data/db/その他タグ一覧.csv
// 出力:
//   - src/data/TRETRA_Card.csv

const fs = require('fs');
const path = require('path');

const uniqueInputPath = path.join(__dirname, './data/db/固有データ.csv');
const tagInputPath = path.join(__dirname, './data/db/その他タグ一覧.csv');
const outputPath = path.join(__dirname, './data/TRETRA_Card.csv');

// ダブルクォート内の改行を考慮しながら CSV を行単位に分割します。
function parseCsvLines(text) {
    const lines = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
            current += ch;
        } else if (ch === '\n' && !inQuotes) {
            lines.push(current.replace(/\r$/, ''));
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) lines.push(current);
    return lines;
}

// ダブルクォート内のカンマを考慮しながら 1 行を列配列に変換します。
function parseCsvRow(line) {
    const fields = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            fields.push(field.trim());
            field = '';
        } else {
            field += ch;
        }
    }
    fields.push(field.trim());
    return fields;
}

// カード名の空白を除去して sameCardId を生成します。
// 同名のカード（イラスト差分）は同じ sameCardId になります。
function toSameCardId(name) {
    if (!name) return '';
    // 全角・半角スペースをまとめて除去して正規化
    return name.replace(/[\s\u3000]/g, '').trim();
}

// CSV 出力用に値をエスケープします（カンマ・改行・引用符を含む場合はクォート）。
function escapeCsv(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// 「その他タグ一覧.csv」から有効な収録弾タグを抽出します（(未) を除外）。
function loadAllowedReleaseTags() {
    if (!fs.existsSync(tagInputPath)) {
        console.error(`\n[エラー] 入力ファイルが見つかりません:\n  ${tagInputPath}`);
        process.exit(1);
    }

    const text = fs.readFileSync(tagInputPath, 'utf8');
    const lines = parseCsvLines(text);
    const tags = new Set();

    let headerCols = null;
    for (const line of lines) {
        if (line.includes('ID') && line.includes('タグ名')) {
            headerCols = parseCsvRow(line).map(c => c.trim());
            break;
        }
    }

    if (!headerCols) {
        console.error('[エラー] その他タグ一覧.csv のヘッダー行(ID, タグ名)が見つかりません。');
        process.exit(1);
    }

    const idIndex = headerCols.indexOf('ID');
    const tagNameIndex = headerCols.indexOf('タグ名');
    if (idIndex < 0 || tagNameIndex < 0) {
        console.error('[エラー] その他タグ一覧.csv の列構造が不正です。');
        process.exit(1);
    }

    for (const line of lines) {
        if (!line.trim()) continue;
        const cols = parseCsvRow(line);
        const id = (cols[idIndex] || '').trim();
        const tagName = (cols[tagNameIndex] || '').trim();
        if (!id || !tagName) continue;
        if (!/^\d+$/.test(id)) continue;
        if (id === '1') continue; // ID1=(未) は除外
        tags.add(tagName);
    }

    return tags;
}

// メインの変換処理
function convert() {
    if (!fs.existsSync(uniqueInputPath)) {
        console.error(`\n[エラー] 入力ファイルが見つかりません:\n  ${uniqueInputPath}`);
        console.error('\n手順:');
        console.error('  1. 固有データ.csv と その他タグ一覧.csv を src/data/db/ に配置する');
        console.error('  2. npm run convert-db を実行する');
        process.exit(1);
    }

    const allowedReleaseTags = loadAllowedReleaseTags();

    const text     = fs.readFileSync(uniqueInputPath, 'utf8');
    const allLines = parseCsvLines(text);

    // ヘッダー行（固有番号 が含まれる行）を探してデータ開始位置を特定します
    let dataStartIndex = -1;
    let headerCols = null;
    for (let i = 0; i < allLines.length; i++) {
        if (allLines[i].includes('固有番号')) {
            headerCols = parseCsvRow(allLines[i]).map(c => c.trim());
            dataStartIndex = i + 1;
            break;
        }
    }

    if (dataStartIndex === -1 || !headerCols) {
        console.error('[エラー] ヘッダー行が見つかりませんでした。CSVの形式を確認してください。');
        process.exit(1);
    }

    const idIndex = headerCols.indexOf('固有番号');
    const nameIndex = headerCols.indexOf('カード名');
    const yomiIndex = headerCols.indexOf('カタカナ表記');
    const relIndex = headerCols.indexOf('収録弾');
    if (idIndex < 0 || nameIndex < 0 || yomiIndex < 0 || relIndex < 0) {
        console.error('[エラー] 固有データ.csv の列構造が不正です。');
        process.exit(1);
    }

    // 出力CSVのヘッダー
    // 旧フォーマットと互換性を保ちつつ、Card_Yomi と Card_SameId を末尾に追加します。
    const outputHeader = [
        'Card_ID',          // 0: ユニークID
        'Card_Name',        // 1: カード名
        'Card_Rel',         // 2: 収録弾
        'Card_Power',       // 3: 元の強さ
        'Card_Power_Add_Self',   // 4: 強さ変化方向（+1 / -1 / 0）
        'Card_Power_Add_Other',  // 5: 相手への加算（新DBに存在しないため 0 固定）
        'Card_Tres',        // 6: 元の宝
        'Card_Order',       // 7: 発動タイミング（B/C/R/A）
        'Card_MainTxt',     // 8: 効果テキスト
        'Card_FrebTxt',     // 9: フレーバーテキスト（新DBに存在しないため空）
        'Card_Illsutrator', // 10: イラストレーター
        'Card_ID_Str',      // 11: カード番号（例: 1/36）
        'Card_Yomi',        // 12: カタカナ読み（ひらがな検索用）
        'Card_SameId'       // 13: 同一カード識別ID（イラスト差分の重複制限に使用）
    ].join(',');

    const outputRows = [outputHeader];
    let convertedCount = 0;
    let skippedCount = 0;

    for (let i = dataStartIndex; i < allLines.length; i++) {
        const line = allLines[i];
        if (!line.trim()) continue;

        const cols = parseCsvRow(line);

        const cardId = cols[idIndex] ? cols[idIndex].trim() : '';
        if (!cardId || isNaN(parseInt(cardId, 10))) {
            skippedCount++;
            continue;
        }

        const cardName = (cols[nameIndex] || '').trim();
        const yomi = (cols[yomiIndex] || '').replace(/\r?\n/g, ' ').trim();
        const rel = (cols[relIndex] || '').trim();

        // 「その他タグ一覧.csv」に存在しない収録弾タグは除外
        if (!allowedReleaseTags.has(rel)) {
            skippedCount++;
            continue;
        }

        const sameCardId  = toSameCardId(cardName);

        const row = [
            cardId,
            escapeCsv(cardName),
            rel,
            '',   // Card_Power
            '0',  // Card_Power_Add_Self
            '0',  // Card_Power_Add_Other
            '',   // Card_Tres
            '',   // Card_Order
            '',   // Card_MainTxt
            '',   // Card_FrebTxt（新DBに項目なし）
            '',   // Card_Illsutrator
            cardId,
            escapeCsv(yomi),
            escapeCsv(sameCardId)
        ].join(',');

        outputRows.push(row);
        convertedCount++;
    }

    // 出力ディレクトリが存在しない場合は作成します
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, outputRows.join('\n'), 'utf8');

    console.log(`\n変換完了！`);
    console.log(`  変換件数 : ${convertedCount} 件`);
    console.log(`  スキップ : ${skippedCount} 行`);
    console.log(`  収録弾タグ数 : ${allowedReleaseTags.size} 件`);
    console.log(`  出力先   : ${outputPath}`);
}

convert();
