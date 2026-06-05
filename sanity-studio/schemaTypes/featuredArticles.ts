import {defineField, defineType} from 'sanity'
import {validateAssetMaxSize} from './assetValidation'

// サイドコンテンツ用の共通フィールド定義を生成する関数
const createSideContentFields = () => [
  {
    name: 'mediaType', 
    title: 'メディアタイプ', 
    type: 'string', 
    options: {
      list: [
        {title: '画像アップロード', value: 'image'},
        {title: '動画アップロード', value: 'video'},
        {title: '外部URL（YouTube等）', value: 'link'}
      ]
    }, 
    initialValue: 'image'
  },
  defineField({
    name: 'image',
    title: '画像',
    description: '5MB以下の画像を設定してください。',
    type: 'image',
    hidden: ({parent}: any) => parent?.mediaType !== 'image',
    validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, '画像')),
  }),
  defineField({
    name: 'video',
    title: '動画ファイル',
    description: '5MB以下の動画ファイルを設定してください。',
    type: 'file',
    hidden: ({parent}: any) => parent?.mediaType !== 'video',
    validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, '動画ファイル')),
  }),
  {
    name: 'externalUrl', 
    title: '外部メディアURL', 
    type: 'url', 
    description: 'YouTubeのURL、または外部画像のURLを入力してください。',
    hidden: ({parent}: any) => parent?.mediaType !== 'link'
  },
]

export default defineType({
  name: 'featuredArticles',
  title: 'トップページ情報',
  type: 'document',
  // description:'サイトトップに表示する情報群を管理する場所です。注目情報や左右の広報画像など。',
  fields: [
    defineField({
      name: 'title',
      title: 'セクションタイトル',
      description: 'セクションのタイトルを設定します。',
      type: 'string',
      initialValue: 'Topics',
    }),
    defineField({
      name: 'featuredPerformance',
      title: '表示する公演情報',
      description: 'ホーム画面の特設セクションに表示する内容を選択します（最大3つ）。',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'performance'}]}],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'performanceDisplayMode',
      title: '公演情報の表示形式',
      type: 'string',
      options: {
        list: [
          {title: 'グリッド（横並び）', value: 'grid'},
          {title: 'カルーセル（スライド切替）', value: 'carousel'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'sideContentLeft',
      title: 'トップページサイドコンテンツ（左）',
      description: 'スマホなどの縦長の画像・動画を推奨します。PC等で横画面が広い場合にのみ表示されます。',
      type: 'object',
      fields: createSideContentFields()
    }),
    defineField({
      name: 'sideContentRight',
      title: 'トップページサイドコンテンツ（右）',
      description: 'スマホなどの縦長の画像・動画を推奨しますPC等で横画面が広い場合にのみ表示されます。',
      type: 'object',
      fields: createSideContentFields()
    }),
  ],
})
