import {defineField, defineType} from 'sanity'
import {validateAssetMaxSize} from './assetValidation'

export default defineType({
  name: 'author',
  title: '著者・メンバー（未使用）',
  type: 'document',
  description:'aaa',
  fields: [
    defineField({
      name: 'name',
      title: '氏名',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'URLスラッグ',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'image',
      title: '画像',
      description: '5MB以下の画像を設定してください。',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, '画像')),
    }),
    defineField({
      name: 'bio',
      title: 'プロフィール・略歴',
      type: 'array',
      of: [
        {
          title: 'ブロック',
          type: 'block',
          styles: [{title: '標準', value: 'normal'}],
          lists: [],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
})
