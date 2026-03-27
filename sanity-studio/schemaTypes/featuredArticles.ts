import {defineField, defineType} from 'sanity'

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
  {name: 'image', title: '画像', type: 'image', hidden: ({parent}: any) => parent?.mediaType !== 'image'},
  {name: 'video', title: '動画ファイル', type: 'file', hidden: ({parent}: any) => parent?.mediaType !== 'video'},
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
      title: 'サイドコンテンツ（左）',
      type: 'object',
      fields: createSideContentFields()
    }),
    defineField({
      name: 'sideContentRight',
      title: 'サイドコンテンツ（右）',
      type: 'object',
      fields: createSideContentFields()
    }),
  ],
})
