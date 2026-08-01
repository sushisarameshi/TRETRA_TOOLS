// search.js
// このモジュールは検索クエリとカードテキストを正規化し、
// ひらがな検索や部分一致検索をサポートします。

// import * as wanakana from 'wanakana';

// 検索文字列を小文字化・空白正規化します。
function normalizeQuery(query) {
    if (!query) return '';
    return query
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

// カード名や発売情報をひらがなに変換し、検索しやすい形にします。
function normalizeCardText(text) {
    if (!text) return '';
    const normalized = normalizeQuery(text);
    return window.wanakana.toHiragana(normalized);  // wanakana をグローバルに登録している前提
}

// カードが検索文字列にマッチするかを判定します。
// カード名・読み（yomi）・収録弾を検索対象にします。
function matchesCard(card, query) {
    const normalizedQuery = normalizeCardText(query);
    const candidates = [
        normalizeCardText(card.name),
        normalizeCardText(card.rel),
        // yomi（カタカナ読み）をひらがなに変換して検索対象に追加
        // 例: 「ルロウノカクトウカ」→「るろうのかくとうか」で検索可能
        card.yomi ? normalizeCardText(card.yomi) : '',
        card.searchKey || ''
    ].join(' ');
    return candidates.includes(normalizedQuery);
}

// カード配列を検索文字列で絞り込みます。
function filterCardsBySearch(cards, query) {
    if (!query) return cards;
    return cards.filter(card => matchesCard(card, query));
}

export { normalizeQuery, normalizeCardText, matchesCard, filterCardsBySearch };