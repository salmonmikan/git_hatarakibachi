import {defineField, defineType} from 'sanity'

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
      description: 'ホーム画面の特設セクションに表示する内容を選択します。',
      type: 'reference',
      to: [{type: 'performance'}],
    }),
    defineField({
      name: 'sideContentLeft',
      title: 'サイドコンテンツ（左）',
      type: 'object',
      fields: [
        {name: 'mediaType', title: 'メディアタイプ', type: 'string', options: {list: ['image', 'video']}, initialValue: 'image'},
        {name: 'image', title: '画像', type: 'image', hidden: ({parent}) => parent?.mediaType !== 'image'},
        {name: 'video', title: '動画ファイル', type: 'file', hidden: ({parent}) => parent?.mediaType !== 'video'},
        {name: 'link', title: 'リンク先URL', type: 'url'},
      ]
    }),
    defineField({
      name: 'sideContentRight',
      title: 'サイドコンテンツ（右）',
      type: 'object',
      fields: [
        {name: 'mediaType', title: 'メディアタイプ', type: 'string', options: {list: ['image', 'video']}, initialValue: 'image'},
        {name: 'image', title: '画像', type: 'image', hidden: ({parent}) => parent?.mediaType !== 'image'},
        {name: 'video', title: '動画ファイル', type: 'file', hidden: ({parent}) => parent?.mediaType !== 'video'},
        {name: 'link', title: 'リンク先URL', type: 'url'},
      ]
    }),
  ],
})
