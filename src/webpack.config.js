const path = require('path');


module.exports = {
  entry: './main.js', // エントリーポイント
  devtool: 'source-map', // または 'inline-source-map'
  output: {
    path: path.resolve(__dirname, 'dist'), // 出力先
    filename: '../../dist/bundle.js', // 出力ファイル名
    library: '../wanakana', // これで`wanakana`をグローバルにエクスポート
    libraryTarget: 'umd', // ユニバーサルモジュール定義
  },
  mode: 'development', // 開発モードs
  externals: {
    'wanakana': 'wanakana' // 外部モジュールとしてwanakanaを指定
  },
};