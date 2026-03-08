import {defineType, defineArrayMember} from 'sanity'

/**
 * This is the schema definition for the rich text fields used for
 * for this blog studio. When you import it in schemas.js it can be
 * reused in other parts of the studio with:
 *  {
 *    name: 'someName',
 *    title: 'Some title',
 *    type: 'blockContent'
 *  }
 */
export default defineType({
  title: '本文コンテンツ',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'ブロック',
      type: 'block',
      // Styles let you set what your user can mark up blocks with. These
      // correspond with HTML tags, but you can set any title or value
      // you want and decide how you want to deal with it where you want to
      // use your content.
      styles: [
        {title: '標準', value: 'normal'},
        {title: '見出し1', value: 'h1'},
        {title: '見出し2', value: 'h2'},
        {title: '見出し3', value: 'h3'},
        {title: '見出し4', value: 'h4'},
        {title: '引用', value: 'blockquote'},
      ],
      lists: [{title: '箇条書き', value: 'bullet'}],
      // Marks let you mark up inline text in the block editor.
      marks: {
        // Decorators usually describe a single property – e.g. a typographic
        // preference or highlighting by editors.
        decorators: [
          {title: '太字', value: 'strong'},
          {title: '強調', value: 'em'},
        ],
        // Annotations can be any object structure – e.g. a link or a footnote.
        annotations: [
          {
            title: 'URLリンク',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    // You can add additional types here. Note that you can't use
    // primitive types such as 'string' and 'number' in the same array
    // as a block type.
    defineArrayMember({
      title: '画像',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})
