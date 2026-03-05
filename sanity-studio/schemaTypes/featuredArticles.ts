import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'featuredArticles',
  title: '注目記事設定',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'セクションタイトル',
      type: 'string',
      initialValue: 'Featured Articles',
    }),
    defineField({
      name: 'posts',
      title: '注目の投稿',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'post'}],
        },
      ],
      validation: (Rule) => Rule.max(5).warning('注目記事は最大5件までを推奨します。'),
    }),
  ],
})
