const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 元画像ディレクトリ
const sourceDir = path.join(__dirname, './data/img/card_list');
// サムネイル出力ディレクトリ
const thumbDir = path.join(__dirname, './data/img/thumbnails');
const mobileThumbDir = path.join(__dirname, './data/img/thumbnails_mobile');

// ディレクトリ作成
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}
if (!fs.existsSync(mobileThumbDir)) {
  fs.mkdirSync(mobileThumbDir, { recursive: true });
}

// 画像ファイルを取得
const files = fs.readdirSync(sourceDir).filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));

console.log(`Processing ${files.length} images...`);

// async/await で全画像処理が完了するまで待ちます
(async () => {
  const successFiles = [];
  const mobileSuccessFiles = [];
  for (const file of files) {
    const inputPath = path.join(sourceDir, file);
    // 出力は全て PNG で統一（拡張子を .png に変更）
    const outputFileName = file.replace(/\.[^.]+$/, '.png');
    const outputPath = path.join(thumbDir, outputFileName);
    const mobileOutputFileName = file.replace(/\.[^.]+$/, '.webp');
    const mobileOutputPath = path.join(mobileThumbDir, mobileOutputFileName);

    try {
      await sharp(inputPath)
        .resize(320, 320, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toFile(outputPath);

      // スマホ表示向け: 70%サイズ(224px) + WebP品質70で軽量化
      await sharp(inputPath)
        .resize(224, 224, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 70 })
        .toFile(mobileOutputPath);

      console.log(`Generated thumbnail: ${outputFileName}`);
      successFiles.push(outputFileName);
      mobileSuccessFiles.push(mobileOutputFileName);
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

  const mobileGeneratedIds = mobileSuccessFiles.map(name => parseInt(name.replace(/\.webp$/, ''), 10));
  const mobileManifestPath = path.join(mobileThumbDir, 'manifest.json');
  fs.writeFileSync(mobileManifestPath, JSON.stringify(mobileGeneratedIds, null, 2), 'utf8');
  console.log(`mobile manifest.json を書き出しました: ${mobileGeneratedIds.length} 件`);
})();