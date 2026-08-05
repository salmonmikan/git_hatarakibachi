---
title: 現行ソースに対するGTM設定案
status: draft
updated: 2026-08-05
source_of_truth:
  - src/utils/analytics.js
  - src/apps/web/WebApp.jsx
  - index.html
---

# 現行ソースに対するGTM設定案

## 結論

現在の公開Webアプリは、次の3経路で計測データを渡します。

1. SPAのページビューは `window.dataLayer.push()` で `page_view_custom` を送る。
2. P0〜P2の重要導線は、ソース側のCustom EventをData Layerへ送る。
3. その他のクリック系はDOM要素の `data-gtm-*` 属性をGTMのクリックトリガーで拾う。

したがって、GTMでは「ページビュー用のCustom Eventトリガー」「P0〜P2用のData Layer Custom Eventトリガー」「残りのDOMクリック用トリガー」を分けて設定する。DOMクリック属性はData Layer Variableではなく、クリックされた要素またはその祖先要素の属性として取得する。

このリポジトリでは `index.html` が公開Webと管理画面の共通エントリーポイントであり、GTMスニペットも共通で読み込まれる。公開Web用タグには、管理画面ホストを除外する条件を必ず付ける。

## 0. GTMでの作業開始位置

対象コンテナを開いた後の基本的な移動先は次の通り。

| 作るもの | GTM画面の場所 |
| --- | --- |
| 組み込み変数 | **Workspace** → **Variables** → **Configure** |
| Data Layer Variable | **Workspace** → **Variables** → **User-Defined Variables** → **New** |
| Custom JavaScript Variable | **Workspace** → **Variables** → **User-Defined Variables** → **New** |
| トリガー | **Workspace** → **Triggers** → **New** |
| タグ | **Workspace** → **Tags** → **New** |
| Preview | 画面右上 **Preview** |

作成時は、まず設定画面上部の変数名・トリガー名・タグ名を入力し、次にタイプを選択する。設定を入力しただけではコンテナに反映されないため、各画面で **Save** を押す。

この文書の名前例は、GTMの表示名であり、コードに書かれたキー名とは別物である。例えば表示名を `DLV - page_path`、データレイヤーの変数名を `page_path` とする。

## 1. ソース側の計測契約

### 1.1 SPAページビュー

`src/utils/analytics.js` が次のデータを `page_view_custom` としてPushする。

| Data Layer key | 内容 | 例 |
| --- | --- | --- |
| `event` | Custom Event名 | `page_view_custom` |
| `page_path` | React Routerのパス | `/performance/example` |
| `page_title` | `document.title` または指定タイトル | `劇団 はたらきばち` |
| `page_type` | 固定分類 | `home`, `post_detail`, `performance_detail`, `news_detail` など |

`WebApp.jsx` は `location.pathname` の変更時にこの関数を呼ぶ。通常のブラウザ遷移だけでなく、React RouterによるSPA遷移も対象になる。

### 1.2 クリック属性

クリック対象には、次の属性が付く。

| DOM属性 | 用途 |
| --- | --- |
| `data-gtm-category` | 大分類。`navigation`, `content`, `engagement`, `social` など |
| `data-gtm-action` | 操作。`click`, `open`, `navigate`, `select`, `toggle` など |
| `data-gtm-label` | 操作対象の固定名 |
| `data-gtm-location` | 画面・配置場所 |
| `data-gtm-type` | UI種別 |
| `data-gtm-value` | 対象値。後述の個人情報・URL対策が必要 |

P0〜P2の重要導線はソース側でクリック時の `dataLayer.push()` を行い、その他のクリックはGTMのクリックトリガーがDOM属性を読み、GA4イベントタグへ渡す。両方式を同じ導線に重ねて送信しない。

## 2. 先に有効化する組み込み変数

GTMの「組み込み変数」で、少なくとも次を有効化する。

- `Event`
- `Click Element`
- `Click Classes`
- `Click URL`
- `Click Text`
- `Page Hostname`
- `Page Path`
- `Page URL`
- `Referrer`

Scroll DepthをGTMで扱う場合だけ、`Scroll Depth Threshold` と `Scroll Depth Units` も有効化する。

## 3. Data Layer Variable

次の3つを「Data Layer Variable」として作成する。Data Layer Versionは `Version 2` とする。

| GTM変数名 | Data Layer Variable Name |
| --- | --- |
| `DLV - page_path` | `page_path` |
| `DLV - page_title` | `page_title` |
| `DLV - page_type` | `page_type` |

`event` は組み込みの `{{Event}}` で確認できるため、別のData Layer Variableは必須ではない。

### 3.1 画面操作手順

1. 左メニュー **Variables** を開く。
2. **User-Defined Variables** の **New** を押す。
3. **Variable Configuration** を押し、**Data Layer Variable** を選ぶ。
4. **Data Layer Variable Name** に `page_path` と入力する。
5. **Data Layer Version** は **Version 2** を選ぶ。
6. 画面上部の変数名を `DLV - page_path` として **Save** を押す。
7. 同じ手順を `page_title`、`page_type` でも繰り返す。

ここで入力する `page_path` は、ソースの `window.dataLayer.push({ page_path: ... })` のキーと完全一致させる。`DLV - page_path` のような表示名をデータレイヤーの変数名欄へ入力しない。

## 4. クリック属性を取得する変数

属性はDOM上にあるため、クリックされた要素から最も近い `[data-gtm-category]` 要素を探すCustom JavaScript Variableを作る。画像やアイコンの内側をクリックした場合でも、親のリンク／ボタンから値を取得できるようにするためである。

### 4.1 変数テンプレート

`data-gtm-category` の部分だけを各属性名に置き換えて、次の6変数を作成する。

```javascript
function () {
  var element = {{Click Element}};
  if (!element || !element.closest) return undefined;

  var target = element.closest('[data-gtm-category]');
  return target ? target.getAttribute('data-gtm-category') : undefined;
}
```

| GTM変数名 | 読み取る属性 |
| --- | --- |
| `JS - data-gtm-category` | `data-gtm-category` |
| `JS - data-gtm-action` | `data-gtm-action` |
| `JS - data-gtm-label` | `data-gtm-label` |
| `JS - data-gtm-location` | `data-gtm-location` |
| `JS - data-gtm-type` | `data-gtm-type` |
| `JS - data-gtm-value-safe` | 下記の安全化版 |

### 4.2 画面操作手順

1. **Variables** → **User-Defined Variables** → **New** を押す。
2. **Variable Configuration** → **Custom JavaScript** を選ぶ。
3. 下記テンプレートを貼り付ける。
4. `data-gtm-category` の部分を作成対象の属性へ置き換える。
5. 画面上部の表示名を `JS - data-gtm-category` のように入力して **Save** を押す。
6. `action`、`label`、`location`、`type` についても同様に作成する。

Custom JavaScript内の `{{Click Element}}` は文字列として書き換えず、GTMの変数選択ボタンから挿入する。入力後に青い変数チップとして表示されていれば正しい。

### 4.3 `data-gtm-value` はそのまま送らない

現在のソースでは、`data-gtm-value` にメールリンクの宛先やメンバー名が入る箇所がある。GA4へ個人情報になり得る値を送らないため、raw値をそのままイベントパラメータへ渡さない。

推奨方針は次の通り。

- `mailto_link` は値を送らず、必要なら固定値 `email` に置き換える。
- `member_card` はメンバー名を送らず、値を送らない。個別分析が必要なら、ソース側で非個人の固定IDを別途用意する。
- URLはクエリ文字列を含むraw URLを送らず、必要ならホスト名または固定ラベルだけを送る。
- slugや画面種別は、公開情報かつ個人情報を含まないことを確認した上で送る。

安全化変数の例:

```javascript
function () {
  var element = {{Click Element}};
  if (!element || !element.closest) return undefined;

  var target = element.closest('[data-gtm-category]');
  if (!target) return undefined;

  var type = target.getAttribute('data-gtm-type') || '';
  var value = target.getAttribute('data-gtm-value') || '';

  if (type === 'mailto_link' || type === 'member_card') return undefined;

  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).hostname;
    } catch (error) {
      return undefined;
    }
  }

  return value || undefined;
}
```

## 5. Google tag

### タグ

タグ名例: `G - Google tag - public web`

- タグタイプ: `Google tag`
- Tag ID: 対象GA4 WebデータストリームのGoogle tag ID
- 発火: 公開Webの全ページ
- 管理画面ホストでは発火させない

### 5.1 画面操作手順

1. **Tags** → **New** を押す。
2. タグ名に `G - Google tag - public web` と入力する。
3. **Tag Configuration** → **Google tag** を選ぶ。
4. GA4のWebデータストリームから確認したTag IDを入力する。
5. **Triggering** で公開Web用のAll Pagesトリガーを選ぶ。
6. そのトリガーに管理画面ホスト除外条件を追加する。
7. **Save** を押す。

Measurement IDしか手元にない場合は、GA4の **Admin** → **Data streams** → 対象Webストリーム → **Google tag** からTag IDを確認する。GTMのGoogle tag設定とGA4 EventタグのMeasurement IDは、画面上で別の入力欄になる。

### ページビューの重複防止

このソースは `page_view_custom` を使ってSPAのページビューを送るため、Google tag側の「設定読み込み時にページビューを送信」はオフにする。

Google tagの自動ページビューをオンにしたまま、後述の `page_view_custom` からGA4の `page_view` を送ると、初回表示が二重計測になる可能性がある。

Google tagの設定画面に「設定読み込み時にページビューを送信」または同等の項目が表示される場合はオフにする。既存のGoogle tagがある場合は、新規作成前にその設定を開き、同じTag IDを複数のタグで初期化しない。

## 6. SPAページビュータグ

### トリガー

トリガー名例: `TR - Custom Event - page_view_custom`

- タイプ: `Custom Event`
- Event name: `page_view_custom`
- 発火条件: 公開Webホストのみ

#### 画面操作手順

1. **Triggers** → **New** を押す。
2. トリガー名に `TR - Custom Event - page_view_custom` と入力する。
3. **Trigger Configuration** → **Custom Event** を選ぶ。
4. **Event name** に `page_view_custom` と入力する。
5. **This trigger fires on** は、公開Webホストだけに限定する。
6. **Save** を押す。

### GA4イベントタグ

タグ名例: `GA4 - page_view - SPA`

- タグタイプ: `Google Analytics: GA4 Event`
- Event Name: `page_view`
- Measurement ID: 対象WebデータストリームのID
- トリガー: `TR - Custom Event - page_view_custom`

イベントパラメータは次のように設定する。

| Parameter Name | 値 |
| --- | --- |
| `page_location` | 組み込み変数 `{{Page URL}}` |
| `page_path` | `{{DLV - page_path}}` |
| `page_title` | `{{DLV - page_title}}` |
| `page_type` | `{{DLV - page_type}}` |

`page_type` をGA4のレポートや探索で使う場合は、GA4側でイベントスコープのカスタムディメンションとして登録する。

#### 画面操作手順

1. **Tags** → **New** を押す。
2. タグ名に `GA4 - page_view - SPA` と入力する。
3. **Tag Configuration** → **Google Analytics: GA4 Event** を選ぶ。
4. 対象WebストリームのMeasurement IDを入力する。
5. **Event Name** に `page_view` と入力する。
6. **Event Parameters** で行を追加し、上表のパラメータ名と変数を1行ずつ設定する。
7. **Triggering** で `TR - Custom Event - page_view_custom` を選ぶ。
8. **Save** を押す。

Event Parametersの値は直接文字列で入力せず、右側の変数選択ボタンから `{{Page URL}}`、`{{DLV - page_path}}` などを選ぶ。タグ名が保存できたら、まだSubmitせずPreviewで先に確認する。

## 7. クリックイベントタグ

### トリガー

トリガー名例: `TR - Click - data-gtm`

- タイプ: `All Elements`
- 発火条件: `{{JS - data-gtm-category}}` が空でない
- 追加条件: 公開Webホストのみ
- 管理画面ホストを除外する

このトリガーでは、`Click Element` が直接属性を持たない場合も、Custom JavaScript Variableが親要素をたどって値を取得する。

#### 画面操作手順

1. **Triggers** → **New** を押す。
2. トリガー名に `TR - Click - data-gtm` と入力する。
3. **Trigger Configuration** → **All Elements** を選ぶ。
4. **Some Clicks** を選ぶ。
5. 条件に `JS - data-gtm-category`、`does not equal`、空欄ではない値を設定する。
6. 公開Webホストの条件を追加し、管理画面ホストを除外する。
7. **Save** を押す。

### 共通イベントタグ

タグ名例: `GA4 - site_interaction`

- タグタイプ: `Google Analytics: GA4 Event`
- Event Name: `site_interaction`
- トリガー: `TR - Click - data-gtm`

パラメータは次のように設定する。

| Parameter Name | 値 |
| --- | --- |
| `interaction_category` | `{{JS - data-gtm-category}}` |
| `interaction_action` | `{{JS - data-gtm-action}}` |
| `interaction_label` | `{{JS - data-gtm-label}}` |
| `interaction_location` | `{{JS - data-gtm-location}}` |
| `interaction_type` | `{{JS - data-gtm-type}}` |
| `interaction_value` | `{{JS - data-gtm-value-safe}}` |

`interaction_value` は安全化変数が空の場合、送信しない。6つのパラメータをGA4の探索で使う場合は、必要なものだけイベントスコープのカスタムディメンションとして登録する。

#### 画面操作手順

1. **Tags** → **New** を押す。
2. タグ名に `GA4 - site_interaction` と入力する。
3. **Tag Configuration** → **Google Analytics: GA4 Event** を選ぶ。
4. Measurement IDを入力する。
5. **Event Name** に `site_interaction` と入力する。
6. **Event Parameters** で、上表の6パラメータを追加する。
7. 各値は右側の変数選択ボタンから対応する `JS - data-gtm-*` 変数を選ぶ。
8. **Triggering** で `TR - Click - data-gtm` を選ぶ。
9. **Save** を押す。

このタグのEvent Nameは固定でよい。`data-gtm-label` ごとにタグを複製せず、分類値はイベントパラメータで分析する。

## 8. 重要導線の専用イベント

共通の `site_interaction` だけをキーイベントにすると、ナビゲーションや画像拡大まで成果扱いになる。そのため、成果とみなす導線だけ専用タグを作る。

### Contactメールクリック

トリガー名例: `TR - Click - contact email`

- ベース: `TR - Click - data-gtm`
- `JS - data-gtm-location` equals `contact`
- `JS - data-gtm-type` equals `mailto_link`

タグ名例: `GA4 - contact_email_click`

- Event Name: `contact_email_click`
- `interaction_location`: `{{JS - data-gtm-location}}`
- `interaction_type`: `{{JS - data-gtm-type}}`
- 宛先アドレスは送信しない

このイベントをGA4側でKey eventにするかは、問い合わせ導線を成果指標として扱うか決めた上で設定する。

#### 画面操作手順

1. **Triggers** → **New** を押す。
2. トリガー名に `TR - Click - contact email` と入力する。
3. **Trigger Configuration** → **All Elements** を選ぶ。
4. **Some Clicks** を選び、次の条件を追加する。
   - `JS - data-gtm-category` equals `social`
   - `JS - data-gtm-location` equals `contact`
   - `JS - data-gtm-type` equals `mailto_link`
5. `Page Hostname` による公開Web限定条件を追加する。
6. **Save** を押す。
7. **Tags** → **New** を押し、タグ名を `GA4 - contact_email_click` とする。
8. **Google Analytics: GA4 Event** を選び、Measurement IDを入力する。
9. **Event Name** に `contact_email_click` と入力する。
10. `interaction_location` と `interaction_type` を追加し、それぞれ対応するCustom JavaScript Variableを選ぶ。
11. **Triggering** で `TR - Click - contact email` を選び、**Save** を押す。

GA4側でKey eventにする場合は、GTMではなくGA4の **Admin** → **Data display** → **Events** でイベント受信を確認した後、対象イベントの **Mark as key event** を設定する。

### 公演外部リンク

チケット購入や予約ページへの導線であることが確定した場合だけ、`data-gtm-type = external_stage` かつ `data-gtm-location = stage` を条件に、`stage_external_click` などの専用イベントを作る。単なる公演情報リンクなら、共通の `site_interaction` のままにする。

#### 画面操作手順

1. **Triggers** → **New** → **All Elements** → **Some Clicks** を選ぶ。
2. トリガー名を `TR - Click - stage external` とする。
3. `JS - data-gtm-location` equals `stage`、`JS - data-gtm-type` equals `external_stage` を条件にする。
4. 公開Webホスト条件を追加して **Save** を押す。
5. **Tags** → **New** → **Google Analytics: GA4 Event** を選ぶ。
6. タグ名を `GA4 - stage_external_click`、Event Nameを `stage_external_click` とする。
7. 必要な場合だけ `interaction_location`、`interaction_type`、安全化済みの `interaction_value` を追加する。
8. **Triggering** で `TR - Click - stage external` を選び、**Save** を押す。

公演ページ内の一般的なカード遷移と、チケット購入など外部成果導線を同じ条件にしない。まずPreviewで実際の `data-gtm-type` と `data-gtm-location` を確認してから専用イベントを作る。

## 9. Scroll Depthと自動収集イベント

- GA4 Enhanced MeasurementのScrollやOutbound clicksが有効か先に確認する。
- 有効な機能と同じ意味のGTMタグを追加して二重計測しない。
- スクロール到達率を独自の業務指標として使う場合だけ、GTMのScroll Depth Triggerで50%／90%などを設定する。
- アウトバウンドクリックは、共通の `site_interaction` とGA4自動収集の `click` を役割分担させ、別の `outbound_click` タグを重ねない。

### 9.1 Scroll Depthを追加する場合の画面操作

1. 先にGA4 **Admin** → **Data streams** → 対象Webストリーム → **Enhanced measurement** を開き、Scrollが有効か確認する。
2. GTMで **Triggers** → **New** → **Scroll Depth** を選ぶ。
3. **Vertical Scroll Depths** に `50,90` を入力し、必要なら **Some Pages** で対象の `Page Path` を限定する。
4. トリガー名を `TR - Scroll - 50-90` として **Save** を押す。
5. **Tags** → **New** → **Google Analytics: GA4 Event** を選び、タグ名を `GA4 - scroll_depth_custom` とする。
6. Event Nameを `scroll_depth_custom` とし、`percent_scrolled` に組み込み変数 `{{Scroll Depth Threshold}}` を設定する。
7. **Triggering** で作成したScroll Depthトリガーを選び、**Save** を押す。

Enhanced MeasurementのScrollをそのまま利用する場合は、この手順のカスタムタグを作成しない。作る場合も、GA4の標準 `scroll` と独自イベントを別の分析目的として明確に分ける。

## 10. ホスト条件

`index.html` のGTMスニペットは公開Webと管理画面で共通である。公開Web用のGoogle tag、ページビュータグ、クリックタグには、次のいずれかを必ず設定する。

- 公開Webホストのallowlistを設定する。
- または `Page Hostname` が管理画面ホスト（`admin` で始まるホスト）に一致しない条件を設定する。

管理画面の `BackToTop` など共通コンポーネントにも `data-gtm-*` 属性が存在するため、ホスト条件なしのクリックタグは管理画面操作をGA4へ送る可能性がある。

### 10.1 ホスト条件の設定場所

公開Web用タグの発火条件を作成・編集するときは、対象のトリガー画面で **This trigger fires on** → **Some Events** を選び、条件行に `Page Hostname` を追加する。

- 公開Webのホストが固定できる場合: `Page Hostname` **equals** `www.example.com` のようなallowlistを使う。
- ホストが複数ある場合: `Page Hostname` **matches RegEx** で公開Webホストだけを列挙する。
- 管理画面が `admin` で始まる構成の場合: `Page Hostname` **does not match RegEx** `^admin(?:\\.|$)` を追加する。

Google tag、SPAページビュー、共通クリック、専用成果イベントの各トリガーに同じホスト条件を付ける。1つのタグだけに付けると、別タグから管理画面のイベントが送られる余地が残る。実際の公開ホスト名が確定したら、否定条件よりallowlistを優先する。

## 11. 検証手順

### GTM Preview / Tag Assistant

#### Previewを開始する

1. GTMワークスペース右上の **Preview** を押す。
2. Tag Assistantの接続画面で、確認対象の公開Web URL（まずはトップ `/`）を入力する。
3. **Connect** を押し、別タブでサイトが開いたことを確認する。
4. GTM側のTag Assistant画面に戻り、左側のイベント一覧と、各イベントの **Tags**・**Variables**・**Data Layer** タブを確認する。

Previewは現在のGTMワークスペースの未公開変更も確認できる。実ユーザーへ反映するには、確認後にGTM右上の **Submit** → バージョン名・変更内容入力 → **Publish** が必要である。

#### 初回表示を確認する

1. `/` を開いた直後のイベント一覧で、コンテナ読込後に `page_view_custom` が1回だけ出ることを確認する。
2. `page_view_custom` を選び、**Variables** タブで次を確認する。
   - `DLV - page_path` が `/` になっている。
   - `DLV - page_title` が空でない。
   - `DLV - page_type` が `home` になっている。
3. **Tags Fired** に `GA4 - page_view - SPA` が1回だけ表示されることを確認する。
4. Google tagの自動ページビューを無効にした設定なら、同じ初回表示で別の `page_view` タグが発火していないことを確認する。

#### SPAのページ遷移を確認する

ブラウザをリロードせず、次の順にサイト内リンクをクリックする。各クリック後に、Tag Assistantのイベント一覧で新しい `page_view_custom` を選択する。

1. `/` → **About**: `page_path=/about`、`page_type=about`
2. `/about` → **Member**: `page_path=/member`、`page_type=member`
3. `/member` → **Stage**: `page_path=/stage`、`page_type=stage`
4. `/stage` → **Scenario**: `page_path=/scenario`、`page_type=scenario`
5. `/scenario` → **Contact**: `page_path=/contact`、`page_type=contact`
6. `/` または一覧ページ → 公演・記事・ニュースのカード: URLがそれぞれ `/performance/...`、`/post/...`、`/news/...` になり、`page_type` はそれぞれ `performance_detail`、`post_detail`、`news_detail` になる。
7. 詳細ページ → サイトロゴまたはホーム導線: `page_path=/`、`page_type=home` に戻る。

各遷移で `GA4 - page_view - SPA` が1回だけ発火すること、ブラウザのフルリロードが発生していなくても `page_view_custom` が発生することを確認する。前のページの `page_path` が残ったままになっている場合は、Data Layerのイベント選択位置を確認し、別イベントの変数値を見ていないか切り分ける。

#### クリックイベントを確認する

1. グローバルナビ、コンテンツカード、MemberCard、メール、SNS、カルーセル、画像拡大を順番にクリックする。
2. 各クリックで `TR - Click - data-gtm` が発火し、`GA4 - site_interaction` が1回だけ発火することを確認する。
3. **Variables** タブで `JS - data-gtm-category`、`action`、`label`、`location`、`type` がクリックされた要素の親リンク／ボタンから取得できていることを確認する。
4. Contactメールでは `interaction_value` にメールアドレスが入っていないことを確認する。
5. MemberCardでは `interaction_value` にメンバー名が入っていないことを確認する。
6. `contact_email_click` や `stage_external_click` を作成した場合は、共通イベントに加えて専用タグが意図した導線だけで発火することを確認する。

#### 管理画面の除外を確認する

1. Tag Assistantの接続URLを管理画面ホストに変更して接続する。
2. 管理画面を開き、初回表示・`BackToTop`・各種ボタンを操作する。
3. 公開Web用のGoogle tag、`GA4 - page_view - SPA`、`GA4 - site_interaction`、専用成果タグが **Tags Not Fired** になっていることを確認する。
4. 公開Webと管理画面でホストの書式が異なる場合は、`Page Hostname` の実値を確認してallowlist／除外条件を修正する。

### GA4 DebugView / Realtime

- `page_view` が初回表示とSPA遷移で期待どおりに入る。
- `site_interaction` と専用の成果イベントが意図したイベント名で入る。
- `page_type`、`interaction_type`、`interaction_location` が空になっていない。
- 同じクリックで同一イベントが二重発火していない。

## 12. 設定しない方がよいもの

- Google tagの自動 `page_view` と、`page_view_custom` 起点の `page_view` の併用
- `data-gtm-label` ごとにGA4イベント名を増やす設計
- rawの `data-gtm-value` を無条件で送る設定
- 管理画面ホストを除外しない全要素クリックタグ
- GA4 Enhanced MeasurementのScroll／Outbound clickと同じ意味のGTMタグの重複

## 13. P0〜P2 Data Layer移行後のGTM設定

ソース側では、次の6つの業務イベントを `window.dataLayer.push()` するようにしている。既存の `data-gtm-*` 属性は移行切替まで残しているため、Data Layerタグを有効にした後は、同じ対象を既存のDOMクリックタグから除外する。

| Data Layer event | 主なpayload | 対象 |
| --- | --- | --- |
| `contact_email_click` | `contact_channel`、`source_location`、`page_path`、`page_type` | Contact本文、FloatingLinksのメール |
| `stage_external_click` | `stage_id`、`source_location`、`destination_type`、`page_path`、`page_type` | 公演外部リンク |
| `content_select` | `content_type`、`content_id`、`placement`、`page_path`、`page_type` | 公演・記事・ニュースカード |
| `social_link_click` | `network`、`placement`、`destination_type`、`page_path`、`page_type` | X、Instagram、YouTube |
| `member_detail_open` | `member_id`、`placement`、`page_path`、`page_type` | メンバーモーダル |
| `performance_image_open` | `performance_id`、`image_scope`、`image_index`、`page_path`、`page_type` | 公演詳細の画像拡大 |

### 13.1 Data Layer Variableを作成する

既存の `DLV - page_path`、`DLV - page_type` に加え、必要なpayloadごとにData Layer Variableを作成する。

| GTM表示名 | Data Layer Variable Name |
| --- | --- |
| `DLV - contact_channel` | `contact_channel` |
| `DLV - source_location` | `source_location` |
| `DLV - stage_id` | `stage_id` |
| `DLV - destination_type` | `destination_type` |
| `DLV - content_type` | `content_type` |
| `DLV - content_id` | `content_id` |
| `DLV - placement` | `placement` |
| `DLV - network` | `network` |
| `DLV - member_id` | `member_id` |
| `DLV - performance_id` | `performance_id` |
| `DLV - image_scope` | `image_scope` |
| `DLV - image_index` | `image_index` |

作成場所は **Variables** → **User-Defined Variables** → **New** → **Data Layer Variable** である。Data Layer Versionは **Version 2** とし、表示名ではなく右列のキー名を入力する。値が存在しないイベントの変数はGTM側で空になるため、必要に応じてイベント別タグへ分ける。

### 13.2 Custom Eventトリガーを作成する

6イベントを1つのタグで受ける場合は、次のCustom Eventトリガーを作る。

1. **Triggers** → **New** を押す。
2. トリガー名を `TR - Custom Event - data_layer_interaction` とする。
3. **Trigger Configuration** → **Custom Event** を選ぶ。
4. **Use regex matching** を有効にする。
5. **Event name** に次を入力する。

   ```text
   ^(contact_email_click|stage_external_click|content_select|social_link_click|member_detail_open|performance_image_open)$
   ```

6. 公開Webホストだけに限定する条件を追加する。
7. **Save** を押す。

個別に成果タグを管理したい場合は、`contact_email_click` と `stage_external_click` だけCustom Eventトリガーを分けてもよい。

### 13.3 GA4イベントタグを作成する

#### 共通タグで送る場合

1. **Tags** → **New** を押す。
2. タグ名を `GA4 - data_layer_interaction` とする。
3. **Google Analytics: GA4 Event** を選ぶ。
4. Measurement IDを入力する。
5. **Event Name** は組み込み変数 `{{Event}}` を選ぶ。
6. イベントパラメータに次を追加する。

| Parameter Name | 値 |
| --- | --- |
| `page_path` | `{{DLV - page_path}}` |
| `page_type` | `{{DLV - page_type}}` |
| `contact_channel` | `{{DLV - contact_channel}}` |
| `source_location` | `{{DLV - source_location}}` |
| `stage_id` | `{{DLV - stage_id}}` |
| `destination_type` | `{{DLV - destination_type}}` |
| `content_type` | `{{DLV - content_type}}` |
| `content_id` | `{{DLV - content_id}}` |
| `placement` | `{{DLV - placement}}` |
| `network` | `{{DLV - network}}` |
| `member_id` | `{{DLV - member_id}}` |
| `performance_id` | `{{DLV - performance_id}}` |
| `image_scope` | `{{DLV - image_scope}}` |
| `image_index` | `{{DLV - image_index}}` |

7. **Triggering** で `TR - Custom Event - data_layer_interaction` を選ぶ。
8. **Save** を押す。

`{{Event}}` は `contact_email_click`、`stage_external_click`など、現在発生しているCustom Event名に置き換わる。タグをイベント別に分ける場合は、Event Nameを固定値にし、各Custom Eventトリガーを割り当てる。

### 13.4 既存DOMタグの二重発火を止める

Data LayerタグをPreviewで確認した後、既存の `GA4 - site_interaction` に移行対象の例外トリガーを追加する。

1. **Triggers** → **New** → **All Elements** を選ぶ。
2. トリガー名を `TR - Exception - data_layer_migrated` とする。
3. **Some Clicks** を選ぶ。
4. `JS - data-gtm-type` **matches RegEx** に次を入力する。

   ```text
   ^(mailto_link|external_stage|post_card|performance_card|news_card|external_link|member_card|performance_main_image|performance_gallery_image)$
   ```

5. 公開Webホスト条件を追加して **Save** を押す。
6. `GA4 - site_interaction` タグを開き、**Exceptions** に `TR - Exception - data_layer_migrated` を追加する。
7. **Save** を押す。

この例外は、P0〜P2に対応する `data-gtm-type` をDOMタグから外し、P3の補助UIだけをDOM方式で残す。Custom JavaScript Variableがクリックされた子要素から親の属性を取得できる設定になっていることが前提である。

### 13.5 PreviewとGA4で確認する

1. GTM **Preview** で公開Webを接続する。
2. ContactのMailをクリックし、`contact_email_click` がData Layerイベント一覧に出ることを確認する。
3. Stageの外部リンク、公演・記事・ニュースカード、X／Instagram／YouTube、MemberCard、公演詳細のメイン画像・ギャラリーを順に操作する。
4. 各イベントで `GA4 - data_layer_interaction` が1回だけ発火することを確認する。
5. Data Layerタブでメールアドレス、メンバー名、raw URL、クエリ文字列が含まれていないことを確認する。
6. GA4 **Admin** → **Data display** → **Events** でイベント受信を確認する。
7. `contact_email_click` と `stage_external_click` を成果扱いする場合だけ、GA4側で **Mark as key event** を設定する。

### 13.6 GA4カスタムディメンションを登録する

イベントパラメータをGA4のレポートや探索で使う場合は、GA4側でイベントスコープのカスタムディメンションを作成する。受信確認前でも作成できるが、パラメータ名はData LayerとGTMのキーに完全一致させる。

1. GA4 **Admin** → **Data display** → **Custom definitions** を開く。
2. **Create custom dimensions** を押す。
3. **Dimension name** にレポート上の表示名を入力する。
4. **Scope** は **Event** を選ぶ。
5. **Event parameter** にData Layerのキー名を入力する。
6. **Create** を押す。

優先して登録する候補は次の通り。

| 表示名例 | Event parameter |
| --- | --- |
| Contact channel | `contact_channel` |
| Source location | `source_location` |
| Destination type | `destination_type` |
| Content type | `content_type` |
| Content ID | `content_id` |
| Placement | `placement` |
| Social network | `network` |
| Member ID | `member_id` |
| Performance ID | `performance_id` |
| Image scope | `image_scope` |

カスタムディメンションは必要な分析項目だけ登録する。メールアドレス、メンバー名、raw URLをパラメータとして登録しない。

GTMのPreview確認が完了するまで既存DOMタグを停止しない。Data Layerタグを公開した後、同じ操作でDOMタグとData Layerタグが同時に発火していないことを再確認する。

## 参考資料

- [Google Tag Manager: Custom event trigger](https://support.google.com/tagmanager/answer/7679219)
- [Google Tag Manager: Data layer](https://support.google.com/tagmanager/answer/13352957)
- [Google Tag Manager: Set up Google Analytics events](https://support.google.com/tagmanager/answer/13034206)
- [Google Analytics: Event parameters](https://support.google.com/analytics/answer/13675006)
- [Google Tag and Tag Manager](https://support.google.com/tagmanager/answer/13543899)
