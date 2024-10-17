// getFileNames.js
// 画像ファイル名を取得し、リストに格納するスクリプト。
// 画像データは動的に取得し、ソフトウェアの変更なしに画像の増減に対応するために実装

console.log('getFileNames.js is loaded');

//ファイルシステム(fs)モジュールを使用して画像ファイル名を取得する
const fs = require('fs');
const path = require('path');

// 画像フォルダのパス
// __dirname にTRETRA_TOOLSまでのフルパスが入ってて、そこからimgディレクトリを指定してる。
img_path = 'img/card_list';
const directoryPath = path.join(__dirname, img_path);

// フォルダ内のファイル名を取得
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    
    // 画像ファイル名のリストを作成
    // 
    // test：指定した文字列が正規表現(.jpgや.png)か判定
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    // 数値でソートするために、ファイル名から数値部分を抽出
    imageFiles.sort((a, b) => {
        // 数値を抽出する正規表現
        const getNumber = filename => {
            const match = filename.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        };

        return getNumber(a) - getNumber(b);
    });

    // JavaScriptの配列形式に変換
    const imageList = `const imageUrls = ${JSON.stringify(imageFiles.map(file => `images/${file}`), null, 2)};`;

    // 結果をJavaScriptファイルに保存
    fs.writeFileSync('imageList.js', imageList, 'utf8');

    console.log('File list generated and saved to imageList.js');
});
