import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    story: z.object({
      id: z.string(),
      title: z.string().optional(),
      role: z.enum(['hub', 'chapter']).default('chapter'),
      order: z.number().default(999),
      parent: z.string().optional(),
      dependsOn: z.array(z.string()).default([]),
      related: z.array(z.string()).default([]),
    }).optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    order: z.number().default(999),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

export const collections = { blog, notes, projects };
