const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 元画像ディレクトリ
const sourceDir = path.join(__dirname, './data/img/card_list');
// サムネイル出力ディレクトリ
const thumbDir = path.join(__dirname, './data/img/thumbnails');

// ディレクトリ作成
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}

// 画像ファイルを取得
const files = fs.readdirSync(sourceDir).filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));

console.log(`Processing ${files.length} images...`);

// async/await で全画像処理が完了するまで待ちます
(async () => {
  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    // 出力は全て PNG で統一（拡張子を .png に変更）
    const outputFileName = file.replace(/\.[^.]+$/, '.png');
    const outputPath = path.join(thumbDir, outputFileName);

    try {
      await sharp(inputPath)
        .resize(275, 275, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toFile(outputPath);

      console.log(`Generated thumbnail: ${outputFileName}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log('Thumbnail generation complete.');
})();