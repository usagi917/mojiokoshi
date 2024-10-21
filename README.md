# Mojiokoshi

Mojiokoshiは、日本語の音声ファイルを文字起こしするためのツールです。本ツールはTypeScriptで開発されており、音声ファイルをテキストに変換する機能を提供します。

## 特徴
- 日本語音声の自動文字起こし
- 使いやすいインターフェース
- オープンソースでのカスタマイズ可能な設計

## インストール

```bash
git clone https://github.com/usagi917/mojiokoshi.git
cd mojiokoshi
npm install
```

## 使い方

音声ファイルを文字起こしするには、以下のコマンドを使用してください。

```bash
npm start <音声ファイルへのパス>
```

例:

```bash
npm start ./sample_audio.wav
```

文字起こし結果は、標準出力または指定した出力ファイルに保存されます。

## 必要条件
- Node.js（バージョン14以上）
- npm

## ライセンス
このプロジェクトはMITライセンスの下で公開されています。

