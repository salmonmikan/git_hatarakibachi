import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'カテゴリー',
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
