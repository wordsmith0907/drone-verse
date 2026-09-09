import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Drones & Hardware',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Title',
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
      description: 'Customer facing price in INR including GST (e.g., 189999)',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'basePrice',
      title: 'Base Price (₹ Excl. GST)',
      type: 'number',
      description: 'Pre-tax base price for Dual GST display (e.g., 161016.10)',
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
          { title: 'Pre-Order', value: 'Pre-Order' },
          { title: 'Out of Stock', value: 'Out of Stock' },
        ],
      },
      initialValue: 'In Stock',
    }),
    defineField({
      name: 'badge',
      title: 'Promo Badge',
      type: 'string',
      description: 'Badge label (e.g. SALE, BESTSELLER, 8K THERMAL, NEW, VTOL HYBRID)',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'imageUrl',
      title: 'Cloudinary / CDN Image URL',
      type: 'url',
      description: 'Cloudinary CDN URL with auto-optimization (e.g. https://res.cloudinary.com/...)',
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
      name: 'packageContents',
      title: 'In the Box / Package Contents',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'rating',
      title: 'Customer Rating',
      type: 'number',
      initialValue: 4.9,
      validation: (Rule) => Rule.min(0).max(5),
    }),
    defineField({
      name: 'reviewsCount',
      title: 'Total Reviews Count',
      type: 'number',
      initialValue: 36,
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product (Show on Homepage)',
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
