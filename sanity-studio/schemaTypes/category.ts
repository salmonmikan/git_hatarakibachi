import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'カテゴリー（未使用）',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'カテゴリー名',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: '説明',
      type: 'text',
    }),
  ],
})
