import {defineField, defineType} from 'sanity'
import {validateAssetMaxSize} from './assetValidation'

export default defineType({
  name: 'post',
  title: '記事投稿（未使用）',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'タイトル',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'URLスラッグ',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'author',
      title: '著者',
      type: 'reference',
      to: {type: 'author'},
    }),
    defineField({
      name: 'mainImage',
      title: 'メイン画像',
      description: '5MB以下の画像を設定してください。',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, 'メイン画像')),
    }),
    defineField({
      name: 'categories',
      title: 'カテゴリー',
      type: 'array',
      of: [{type: 'reference', to: {type: 'category'}}],
    }),
    defineField({
      name: 'publishedAt',
      title: '公開日',
      type: 'datetime',
    }),
    defineField({
      name: 'body',
      title: '本文',
      type: 'blockContent',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `著者: ${author}`}
    },
  },
})
