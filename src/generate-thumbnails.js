const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 元画像ディレクトリ
const sourceDir = path.join(__dirname, '../data/img/card_list');
// サムネイル出力ディレクトリ
const thumbDir = path.join(__dirname, '../data/img/thumbnails');

// ディレクトリ作成
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}

// 画像ファイルを取得
const files = fs.readdirSync(sourceDir).filter(file => /\.(png|jpg|jpeg)$/i.test(file));

console.log(`Processing ${files.length} images...`);

files.forEach(async (file) => {
  const inputPath = path.join(sourceDir, file);
  const outputPath = path.join(thumbDir, file);

  try {
    await sharp(inputPath)
      .resize(200, 200, { // サムネイルサイズ（必要に応じて調整）
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // 品質調整
      .toFile(outputPath);

    console.log(`Generated thumbnail: ${file}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log('Thumbnail generation complete.');