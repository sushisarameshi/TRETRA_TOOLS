// カードのプルダウンメニューを生成する関数
function populateCardSelect(cards) {
    const select = document.getElementById('card-select');
    select.innerHTML = ''; // 既存のオプションをクリア

    cards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;

        const paddedName = card.name

        const releaseInfo = parseFloat(card.rel) ? `[${card.rel}弾]` : ` [${card.rel}]`; // 弾とその他を1文で分岐
        option.textContent = releaseInfo + ' ' + paddedName;

        select.appendChild(option); // メモ：appendChildでhtmlに新しい要素を追加できる
    });
}

export { populateCardSelect };