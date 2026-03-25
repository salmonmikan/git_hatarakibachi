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
      initialValue: 'Featured Articles',
    }),
    defineField({
      name: 'featuredPerformance',
      title: '表示する公演情報',
      description: 'ホーム画面の特設セクションに表示する内容を選択します。',
      type: 'reference',
      to: [{type: 'performance'}],
    }),
  ],
})
