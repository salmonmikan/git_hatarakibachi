---
title: Data Layer移行候補
status: source-implemented-gtm-cutover-pending
updated: 2026-08-05
source_of_truth:
  - src/utils/analytics.js
  - src/apps/web/WebApp.jsx
  - src/apps/web/pages/Contact.jsx
  - src/apps/web/pages/Stage.jsx
  - src/components/FloatingLinks.jsx
  - src/components/FeaturedArticles.jsx
  - src/components/NewsList.jsx
  - src/components/MemberCard.jsx
  - src/apps/web/pages/PerformanceDetail.jsx
---

# Data Layer移行候補

## 1. 結論

現行ソースは、ページビューだけがアプリ側のData Layer方式で、クリック計測はDOM属性方式である。

- Data Layer: `src/utils/analytics.js` の `page_view_custom` が1つのアプリ側イベント送信箇所。`WebApp.jsx` で `location.pathname` の変更時に発火する。
- DOM: `data-gtm-category` の計測対象が12ファイル・23箇所あり、6種類の `data-gtm-*` 属性が合計約130箇所に定義されている。
- GTM自動イベント: `gtm.click`、`gtm.linkClick`、Scroll DepthなどはGTMが生成する技術イベントであり、アプリ側の業務イベントではない。

移行は全クリックを一度に置き換えず、成果に近い導線から段階的に行う。DOM方式とData Layer方式で同じ操作を同時送信しない。

P0〜P2のData Layerイベントpushはソース側へ実装済みである。GTM側のCustom Eventタグ公開と既存DOMタグの例外設定が完了するまでは、DOM属性を互換用に残す。

## 2. 移行候補一覧

| 優先度 | 候補イベント | 現在の実装 | Data Layer payload候補 | 移行理由 |
| --- | --- | --- | --- | --- |
| P0 | `contact_email_click` | `Contact.jsx` のMail、`FloatingLinks.jsx` のmail | `contact_channel=email`、`source_location=contact` または `floating_links`、`page_path`、`page_type` | 問い合わせ成果に近い。メールアドレスを送らずに意味を固定できる |
| P0 | `stage_external_click` | `Stage.jsx` の `external_stage` | `stage_id`、`source_location=stage`、`destination_type=external_stage`、`page_path` | 外部予約・公演導線の成果候補。raw URLやタイトルを送らず識別できる |
| P1 | `content_select` | `FeaturedArticles.jsx`、`NewsList.jsx` | `content_type=post/performance/news`、`content_id`、`placement=home` | 公演・記事・ニュースのコンテンツ評価に使える。slugまたは公開IDだけを送る |
| P1 | `social_link_click` | `FloatingLinks.jsx` のX、Instagram、YouTube | `network=x/instagram/youtube`、`placement=floating_links`、`destination_type=external_link` | SNS導線の比較ができる。raw URLは送らない |
| P1 | `member_detail_open` | `MemberCard.jsx` のモーダル開閉 | `member_id`、`placement=member` | メンバー名を送らず、IDで閲覧傾向を分析できる。現状は `MemberCard` にIDを渡す実装変更が必要 |
| P2 | `performance_image_open` | `PerformanceDetail.jsx` のメイン画像・ギャラリー | `performance_id`、`image_scope=main/gallery`、`image_index` | コンテンツ閲覧の深さを測れるが、成果イベントより優先度は低い |
| P3 | `navigation_click` | `WebApp.jsx` のグローバルナビ | `navigation_label`、`destination_path`、`location=global_nav` | ページビューで遷移結果は把握できるため、ナビCTRが必要な場合だけ移行 |
| P3 | `carousel_control`、`utility_click`、`detail_back_home` | カルーセル、BackToTop、詳細ページ戻る導線 | 固定された操作種別と配置 | 補助UIであり、最初の移行対象にはしない |

## 3. P0候補のpayload案

### 3.1 Contactメール

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "contact_email_click",
  contact_channel: "email",
  source_location: "contact",
  page_path: window.location.pathname,
  page_type: "contact",
});
```

`hatarakibachi88act@gmail.com`、`mailto:` URL、`Click URL` は送信しない。FloatingLinks側は `source_location: "floating_links"` にする。

### 3.2 公演外部リンク

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "stage_external_click",
  stage_id: String(stage.id),
  source_location: "stage",
  destination_type: "external_stage",
  page_path: window.location.pathname,
  page_type: "stage",
});
```

`stage.url`、クエリ文字列、必要性のない公演タイトルは送信しない。現在の `archive_urls` には `stage.id` があるため、固定IDでの分析を候補とする。

## 4. 段階移行の順序

### Phase 1: 成果に近い導線

1. `contact_email_click`
2. `stage_external_click`

ソース側でData Layerイベントを追加し、GTMでCustom EventトリガーとGA4イベントタグを作る。Previewで発火確認後、該当するDOMクリックタグの対象から除外する。

### Phase 2: コンテンツ・SNS導線

1. `content_select`
2. `social_link_click`
3. `member_detail_open`

同じイベント名に対象ごとの意味を詰め込まず、`content_type`、`network`、`member_id`などの固定パラメータで分類する。

### Phase 3: 補助UI

画像拡大、カルーセル、BackToTop、詳細ページの戻る導線は、分析要件が確定したものだけ移行する。

## 5. 実装時の注意

- Data Layerイベントと既存DOMクリックタグを同じ操作に対して同時に発火させない。
- 外部リンクでは、Data LayerへのPush後にブラウザ遷移でタグが中断されないよう、GTMのリンクトリガーの待機設定または遷移完了制御を検討する。
- イベント名は英小文字とアンダースコアで固定し、GTM・GA4・ドキュメントで同じ命名を使う。
- メールアドレス、メンバー名、raw URL、クエリ文字列はData Layer payloadに入れない。
- `page_view_custom` は既存のData Layer方式を維持し、ページビュータグとクリックイベントを混在させない。
- 公開Webと管理画面で同じGTMコンテナを使うため、Data Layerイベントにも公開Webホスト条件を付ける。

## 6. 採用判断

当面はP0の2イベントをData Layerへ移行し、P1以降は分析要件があるものだけ移行する。既存の全DOM属性を一括削除するのではなく、Data LayerイベントのPreview・GA4 DebugView確認が完了した導線からDOMタグの対象外にする。
