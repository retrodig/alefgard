# alefgard

ファミコン版『ドラゴンクエスト』の非公式攻略サイト。
コアロジックに [damdara](https://github.com/retrodig/damdara)（WASM）を使用しています。

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm test         # テスト
npm run lint     # Lint
npm run build    # 本番ビルド（dist/）
```

`main` への push で GitHub Actions から GitHub Pages にデプロイされます。

## 注意

- 「ドラゴンクエスト」に関する権利は各権利者に帰属します。
