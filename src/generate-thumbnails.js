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
  const successFiles = [];
  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    // 出力は全て PNG で統一（拡張子を .png に変更）
    const outputFileName = file.replace(/\.[^.]+$/, '.png');
    const outputPath = path.join(thumbDir, outputFileName);

    try {
      await sharp(inputPath)
        .resize(320, 320, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toFile(outputPath);

      console.log(`Generated thumbnail: ${outputFileName}`);
      successFiles.push(outputFileName);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log('Thumbnail generation complete.');

  // 生成に成功したIDの一覧を manifest.json として書き出します。
  // アプリがこのファイルを参照することで、画像が存在するカードIDだけを抽出できます。
  const generatedIds = successFiles.map(name => parseInt(name.replace(/\.png$/, ''), 10));
  const manifestPath = path.join(thumbDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(generatedIds, null, 2), 'utf8');
  console.log(`manifest.json を書き出しました: ${generatedIds.length} 件`);
})();