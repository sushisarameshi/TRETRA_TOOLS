//loadCards.js

const csvFilePath = './data/TRETRA_Card.csv';
const cardRelPath = './data/Card_Rel.csv'; // Card_Rel.csvのパス

// Card_Rel.csvを読み込み、IDと値のマッピングを作成する関数
async function loadCardRel() {
    try {
        const response = await fetch(cardRelPath);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // ヘッダーを除外
        const relMap = {};
        rows.forEach(row => {
            const [id, value] = row.split(',');
            relMap[id] = value.trim(); // IDと対応する値をマッピング
        });
        return relMap;
    } catch (error) {
        console.error('Error loading CSV (Card_Rel.csv):', error);
        return {};
    }
}

// CSVを読み込んでカードリストを生成する関数
async function loadCards() {
    try {
        const cardRelMap = await loadCardRel(); // relマッピングを読み込み
        const response = await fetch(csvFilePath);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // ヘッダー行を除外
        const cards = rows.map(row => {
            const cols = row.split(',');
            const relValue = cardRelMap[cols[2]] || cols[2]; // rel IDを値に置き換え
            return {
                id: cols[0],
                name: cols[1],
                rel: relValue,
                streng: cols[3],
                strengAdd: cols[4],
                tres: cols[5],
                order: cols[6],
                mainTxt: cols[7],
                frebTxt: cols[8],
                illustrator: cols[9]
            };
        });

        // 発売時期の選択肢を生成
        populateReleasePeriodOptions(cards);

        return cards;
    } catch (error) {
        console.error('Error loading CSV (DataBase):', error);
    }
}

// 発売時期の選択肢を生成する関数
function populateReleasePeriodOptions(cards) {
    const releasePeriodContainer = document.getElementById('release-period-container');
    const uniquePeriods = [...new Set(cards.map(card => card.rel))];

    uniquePeriods.forEach(period => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = period;
        checkbox.id = `release-period-${period}`;

        // デフォルトで選択されている場合、checked 属性を追加
        if (period === '1') {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        if (parseFloat(period)){
            label.textContent = ' 第' + period + '弾';
        }else{
            label.textContent = ' ' + period;
        }
        releasePeriodContainer.appendChild(checkbox);
        releasePeriodContainer.appendChild(label);
        releasePeriodContainer.appendChild(document.createElement('br'));
    });
}

// 選択された発売時期に基づいてカードをフィルタリングする関数
function filterCardsByReleasePeriod(cards) {
    const checkboxes = document.querySelectorAll('#release-period-container input[type="checkbox"]:checked');
    const selectedPeriods = Array.from(checkboxes).map(checkbox => checkbox.value);
    return cards.filter(card => selectedPeriods.includes(card.rel));
}

export { loadCards, filterCardsByReleasePeriod };