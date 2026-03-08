import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'author',
  title: '著者・メンバー',
  type: 'document',
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
      type: 'image',
      options: {
        hotspot: true,
      },
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
