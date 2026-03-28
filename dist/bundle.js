(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("wanakana"));
	else if(typeof define === 'function' && define.amd)
		define(["wanakana"], factory);
	else if(typeof exports === 'object')
		exports["../wanakana"] = factory(require("wanakana"));
	else
		root["../wanakana"] = factory(root["wanakana"]);
})(self, (__WEBPACK_EXTERNAL_MODULE_wanakana__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./imageList.js":
/*!**********************!*\
  !*** ./imageList.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRandomImageUrls: () => (/* binding */ getRandomImageUrls),
/* harmony export */   imageExists: () => (/* binding */ imageExists)
/* harmony export */ });
// imageList.js

async function getRandomImageUrls(count, maxDuplicates = 2, preselected = [], filteredCardIds = []) {
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

async function imageExists(url) {
  try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok; // ステータスが200-299であればtrueを返す
  } catch (error) {
      return false; // ネットワークエラーなどが発生した場合はfalseを返す
  }
}

/***/ }),

/***/ "./loadCards.js":
/*!**********************!*\
  !*** ./loadCards.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   filterCardsByReleasePeriod: () => (/* binding */ filterCardsByReleasePeriod),
/* harmony export */   loadCards: () => (/* binding */ loadCards)
/* harmony export */ });
//loadCards.js

const csvFilePath = 'src/data/TRETRA_Card.csv';
const cardRelPath = 'src/data/Card_Rel.csv'; // Card_Rel.csvのパス

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

        // デフォルトでチェックされている状態とする
        checkbox.checked = true;


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



/***/ }),

/***/ "./pullDown.js":
/*!*********************!*\
  !*** ./pullDown.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   populateCardSelect: () => (/* binding */ populateCardSelect)
/* harmony export */ });
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



/***/ }),

/***/ "wanakana":
/*!***************************!*\
  !*** external "wanakana" ***!
  \***************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_wanakana__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _loadCards_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./loadCards.js */ "./loadCards.js");
/* harmony import */ var _imageList_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./imageList.js */ "./imageList.js");
/* harmony import */ var _pullDown_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pullDown.js */ "./pullDown.js");
/* harmony import */ var wanakana__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! wanakana */ "wanakana");
/* harmony import */ var wanakana__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(wanakana__WEBPACK_IMPORTED_MODULE_3__);
// main.js

// 40種類の画像URLを配列に格納




let deck_size = 10;

// サポートする画像形式の配列
const supportedExtensions = ['png', 'jpg', 'jpeg'];


// フィルタリングされたカードからランダム画像を取得する関数
async function getRandomImages(filteredCards) {
    const preselectedCardsInput = document.getElementById('preselected-cards').value;
    // カンマで区切られたカード番号を配列に変換
    const preselectedCards = preselectedCardsInput.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));

    try {
        const filteredCardIds = filteredCards.map(card => parseInt(card.id, deck_size));
        const imageUrls = await (0,_imageList_js__WEBPACK_IMPORTED_MODULE_1__.getRandomImageUrls)(deck_size, 2, preselectedCards, filteredCardIds);

        // カード番号で昇順にソート
        imageUrls.sort((a, b) => {
            const idA = parseInt(a.match(/(\d+)\./)[1], 10);
            const idB = parseInt(b.match(/(\d+)\./)[1], 10);
            return idA - idB;
        });

        // 画像URLとカードIDをマッピングする
        return imageUrls.map(url => {
            let cardId = null;
            for (const ext of supportedExtensions) {
                const match = url.match(new RegExp(`(\\d+)\\.${ext}$`)); // 画像URLからカードIDを抽出
                if (match) {
                    cardId = parseInt(match[1], 10);
                    break;
                }
            }
            if (cardId === null) {
                console.error(`URL does not match any supported pattern: ${url}`);
                return { url, card: null };
            }
            // すべてのカード（window.allCards）からカード情報を取得
            const card = window.allCards.find(card => parseInt(card.id, 10) === cardId);
            if (!card) {
                console.error(`Card with ID ${cardId} not found in allCards.`);
            }
            return { url, card };
        });
    } catch (error) {
        alert(error.message);
        return [];
    }
}

// 画像を表示する
let isDisplayingImages = false;

// 入力：なし？
// 出力：
async function displayImages() {
    if (isDisplayingImages) return; // すでに実行中ならば処理を中断
    isDisplayingImages = true; // フラグを立てる

    const filteredCards = window.filteredCards || [];
    const images = await getRandomImages(filteredCards);
    const container = document.getElementById("image-container");
    container.innerHTML = '';

    // 画像初回読み込み時を切り分け(何のために切り分けたっけ？？？？？)
    if (filteredCards.length === 0) {
        const defaultFilteredCards = (0,_loadCards_js__WEBPACK_IMPORTED_MODULE_0__.filterCardsByReleasePeriod)(window.allCards);
        const defaultImages = await getRandomImages(defaultFilteredCards);

        if (defaultImages.length > 0) {
            for (const { url, card } of defaultImages) {
                const div = document.createElement("div"); // 画像とタイトルを囲む<div>を作成
                div.classList.add("card-div"); // カードごとのdivにクラスを追加
                const img = document.createElement("img");

                try {
                    const exists = await (0,_imageList_js__WEBPACK_IMPORTED_MODULE_1__.imageExists)(url);
                    img.src = exists ? url : './data/img/card_list/0.png'; // 見つからない場合は代替画像を使用
                } catch (error) {
                    console.error(`Failed to check image existence for ${url}: ${error}`);
                    img.src = './data/img/card_list/0.png';
                }
                const title = document.createElement("p"); // カードのタイトル要素を作成
                title.textContent = card ? card.name : '不明なカード'; // カードが見つからない場合の処理

                container.appendChild(div); // <div>をコンテナに追加
                div.appendChild(title); // <div>にタイトルを追加
                div.appendChild(img); // <div>に<img>を追加
            }
        } else { // 例外用
            alert('デフォルトで選択されたチェックボックスでも画像がありません。');
        }
    } else {
        for (const { url, card } of images) {
            const div = document.createElement("div"); // 画像とタイトルを囲む<div>を作成
            div.classList.add("card-div"); // カードごとのdivにクラスを追加
            const img = document.createElement("img");

            try {
                const exists = await (0,_imageList_js__WEBPACK_IMPORTED_MODULE_1__.imageExists)(url);
                img.src = exists ? url : './data/img/card_list/0.png'; // 見つからない場合は代替画像を使用
            } catch (error) {
                console.error(`Failed to check image existence for ${url}: ${error}`);
                img.src = './data/img/card_list/0.png';
            }
            const title = document.createElement("p"); // カードのタイトル要素を作成
            const cardRel = parseFloat(card.rel) ? `[${card.rel}弾] ` : ` [${card.rel}] `;
            title.textContent = card ? cardRel + card.name : '不明なカード'; // カードが見つからない場合の処理

            container.appendChild(div); // <div>をコンテナに追加
            div.appendChild(title); // <div>にタイトルを追加
            div.appendChild(img); // <div>に<img>を追加
        }
    }
    isDisplayingImages = false; // 処理が完了したらフラグをリセット
}

// ページロード時に画像を表示 呼び出しが一度だけ行われるように変更
window.onload = () => {
    (0,_loadCards_js__WEBPACK_IMPORTED_MODULE_0__.loadCards)().then(cards => {
        window.allCards = cards;
        const filteredCards = (0,_loadCards_js__WEBPACK_IMPORTED_MODULE_0__.filterCardsByReleasePeriod)(cards); // デフォルトでフィルタリング
        window.filteredCards = filteredCards;
        (0,_pullDown_js__WEBPACK_IMPORTED_MODULE_2__.populateCardSelect)(cards); // プルダウンメニューにカードを追加
        displayImages(); // 初期表示
    }).catch(error => {
        console.error('Error loading cards:', error);
    });
};

// ボタンがクリックされたときに画像を変更
document.getElementById('change-images-button').addEventListener('click', () => {
    if (window.allCards) {
        const filteredCards = (0,_loadCards_js__WEBPACK_IMPORTED_MODULE_0__.filterCardsByReleasePeriod)(window.allCards);
        window.filteredCards = filteredCards;
        displayImages();
    }
});

// 検索ボックスの入力に基づいてプルダウンをフィルタリングする関数
document.getElementById('card-search').addEventListener('keyup', function() {
    const query = wanakana__WEBPACK_IMPORTED_MODULE_3__.toHiragana(this.value);// 入力をひらがなに変換
    const filteredCards = window.allCards.filter(card => wanakana__WEBPACK_IMPORTED_MODULE_3__.toHiragana(card.name).includes(query)); // カード名もひらがなに変換して検索
    (0,_pullDown_js__WEBPACK_IMPORTED_MODULE_2__.populateCardSelect)(filteredCards); // フィルタリングされたカードでプルダウンを更新
});

// ボタンがクリックされたときに選択されたカードを追加
document.getElementById('add-selected-card-button').addEventListener('click', () => {
    const select = document.getElementById('card-select');
    const selectedCardId = select.value;
    const preselectedInput = document.getElementById('preselected-cards');
    const selectedCardsContainer = document.getElementById('selected-cards-container');
    
    // 既に選択済みかチェック
    const selectedCardIds = preselectedInput.value.split(',').map(num => num.trim()); //選択済みの配列が入る
    const count = selectedCardIds.filter(value => value === selectedCardId).length;
    if (count < 2 && selectedCardIds.length < 10) {
        // カード名を取得
        const selectedCardOption = select.options[select.selectedIndex];
        const cardName = selectedCardOption.text;

        // カードを追加（preselectedInputに）
        preselectedInput.value += preselectedInput.value ? `,${selectedCardId}` : selectedCardId;

        // 表示するカードを作成（cardDivを新たに作成）
        const cardDiv = document.createElement('div');
        cardDiv.className = 'selected-card';
        cardDiv.setAttribute('data-card-id', selectedCardId);
        cardDiv.innerHTML = `
            <span>${cardName}</span>
            <button class="remove-card-button"> － 削除</button>
        `;
        selectedCardsContainer.appendChild(cardDiv);

        // 削除ボタンのイベントリスナー
        cardDiv.querySelector('.remove-card-button').addEventListener('click', () => {
            const cardId = cardDiv.getAttribute('data-card-id');
            preselectedInput.value = preselectedInput.value.split(',').filter(id => id !== cardId).join(',');
            selectedCardsContainer.removeChild(cardDiv);
        });
    }
});

// デバウンス関数の例
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// resizeイベントをデバウンスする
window.addEventListener('resize', debounce(() => {
    adjustLayout(); // レイアウトの調整のみ行う
}, 300)); // 300ミリ秒の遅延

const modalOpenButton = document.getElementById('export-deck-button');
modalOpenButton.addEventListener('click', function() {
    adjustModalSize(); // ウィンドウの高さに合わせてモーダルの高さを調整する関数
    // モーダルを開く処理
});

// モーダルのサイズ調節用
window.addEventListener('resize', function() {
    adjustModalSize(); // ウィンドウの高さに合わせてモーダルの高さを調整する関数
  });

  function adjustModalSize(){
    const modal = document.querySelector('.modal-content');
    modal.style.maxHeight = window.innerHeight - 100 + 'px';
    modal.style.margin = window.innerHeight/6 + 'px auto';
}

document.getElementById('modal-background').addEventListener('click', function() {
    document.getElementById('deckModal').style.display = 'none'; // モーダルを閉じる
});
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=bundle.js.map