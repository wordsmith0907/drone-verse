import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'droneAccessory',
  title: 'Drone Accessories & Gear',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Accessory Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sku',
      title: 'SKU Code',
      type: 'string',
    }),
    defineField({
      name: 'price',
      title: 'Final Price (₹ Incl. GST)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'basePrice',
      title: 'Base Price (₹ Excl. GST)',
      type: 'number',
    }),
    defineField({
      name: 'oldPrice',
      title: 'Original / Strikethrough Price (₹)',
      type: 'number',
    }),
    defineField({
      name: 'gstRate',
      title: 'GST Percentage',
      type: 'number',
      initialValue: 18,
    }),
    defineField({
      name: 'stockStatus',
      title: 'Stock Status',
      type: 'string',
      options: {
        list: [
          { title: 'In Stock', value: 'In Stock' },
          { title: 'Low Stock', value: 'Low Stock' },
          { title: 'Out of Stock', value: 'Out of Stock' },
        ],
      },
      initialValue: 'In Stock',
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
    }),
    defineField({
      name: 'compatibility',
      title: 'Compatible Drones / Systems',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'imageUrl',
      title: 'Cloudinary / CDN Image URL',
      type: 'url',
    }),
    defineField({
      name: 'image',
      title: 'Direct Sanity Image Asset',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'specifications',
      title: 'Technical Specifications',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Spec Name', type: 'string' }),
            defineField({ name: 'value', title: 'Spec Value', type: 'string' }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'value',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'rating',
      title: 'Customer Rating',
      type: 'number',
      initialValue: 4.8,
    }),
    defineField({
      name: 'reviewsCount',
      title: 'Total Reviews',
      type: 'number',
      initialValue: 24,
    }),
    defineField({
      name: 'featured',
      title: 'Featured Accessory',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'price',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `₹${Number(subtitle).toLocaleString('en-IN')}` : '',
        media,
      }
    },
  },
})
