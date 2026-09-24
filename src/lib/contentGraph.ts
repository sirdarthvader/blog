import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export type StoryPost = {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  order: number;
  role: 'hub' | 'chapter';
  href: string;
};

export type StoryLink = {
  source: string;
  target: string;
  type: 'parent' | 'depends-on' | 'related';
};

export type StoryGraph = {
  id: string;
  title: string;
  description: string;
  href: string;
  posts: StoryPost[];
  chapterCount: number;
  updatedAt?: Date;
  links: StoryLink[];
};

export type StoryNavigation = {
  story: StoryGraph;
  current: StoryPost;
  previous?: StoryPost;
  next?: StoryPost;
  parent?: StoryPost;
};

export function getAllStories(posts: BlogPost[]): StoryGraph[] {
  const storyIds = [...new Set(posts.flatMap((post) => post.data.story?.id ?? []))].sort();
  return storyIds.map((storyId) => getStoryGraph(posts, storyId));
}

export function getStoryGraph(posts: BlogPost[], storyId: string): StoryGraph {
  const storyPosts = getStoryPosts(posts, storyId);
  const byId = new Map(storyPosts.map((post) => [post.id, post]));
  const hub = storyPosts.find((post) => post.role === 'hub');
  const sourcePosts = posts.filter((post) => post.data.story?.id === storyId);

  const links: StoryLink[] = [];

  for (const post of sourcePosts) {
    const story = post.data.story;
    if (!story) continue;

    if (story.parent && byId.has(story.parent)) {
      links.push({ source: story.parent, target: post.id, type: 'parent' });
    }

    for (const dependency of story.dependsOn) {
      if (byId.has(dependency)) {
        links.push({ source: dependency, target: post.id, type: 'depends-on' });
      }
    }

    for (const related of story.related) {
      if (byId.has(related)) {
        links.push({ source: post.id, target: related, type: 'related' });
      }
    }
  }

  return {
    id: storyId,
    title: getStoryTitle(sourcePosts, storyId),
    description: getStoryDescription(sourcePosts),
    href: `/stories/${storyId}`,
    posts: storyPosts,
    chapterCount: storyPosts.filter((post) => post.role === 'chapter').length,
    updatedAt: getLatestDate(storyPosts),
    links,
  };
}

export function getStoryPosts(posts: BlogPost[], storyId: string): StoryPost[] {
  return posts
    .filter((post) => post.data.story?.id === storyId)
    .map(toStoryPost)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.role !== b.role) return a.role === 'hub' ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
}

export function getStoryNavigation(posts: BlogPost[], post: BlogPost): StoryNavigation | undefined {
  const storyId = post.data.story?.id;
  if (!storyId) return undefined;

  const story = getStoryGraph(posts, storyId);
  const current = story.posts.find((storyPost) => storyPost.id === post.id);
  if (!current) return undefined;

  const chapters = story.posts.filter((storyPost) => storyPost.role !== 'hub');
  const chapterIndex = chapters.findIndex((storyPost) => storyPost.id === post.id);
  const storyData = post.data.story;
  const parent = storyData?.parent
    ? story.posts.find((storyPost) => storyPost.id === storyData.parent)
    : story.posts.find((storyPost) => storyPost.role === 'hub');

  return {
    story,
    current,
    previous: chapterIndex > 0 ? chapters[chapterIndex - 1] : undefined,
    next: chapterIndex >= 0 ? chapters[chapterIndex + 1] : undefined,
    parent,
  };
}

function toStoryPost(post: BlogPost): StoryPost {
  return {
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    publishedAt: post.data.publishedAt,
    updatedAt: post.data.updatedAt,
    order: post.data.story?.order ?? 999,
    role: post.data.story?.role ?? 'chapter',
    href: `/blog/${post.id}`,
  };
}

function getStoryTitle(posts: BlogPost[], storyId: string): string {
  const hub = posts.find((post) => post.data.story?.role === 'hub');
  return hub?.data.story?.title ?? hub?.data.title ?? titleize(storyId);
}

function getStoryDescription(posts: BlogPost[]): string {
  const hub = posts.find((post) => post.data.story?.role === 'hub');
  return hub?.data.description ?? 'A connected reading path through a larger topic.';
}

function getLatestDate(posts: StoryPost[]): Date | undefined {
  const dates = posts.map((post) => post.updatedAt ?? post.publishedAt);
  if (dates.length === 0) return undefined;
  return new Date(Math.max(...dates.map((date) => date.valueOf())));
}

function titleize(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
