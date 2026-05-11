import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create default RSS feeds
  const rssFeeds = [
    { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'news' },
    { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'news' },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'tech' },
    { name: 'The Atlantic', url: 'https://www.theatlantic.com/feed/all/', category: 'culture' },
    { name: 'Scientific American', url: 'https://www.scientificamerican.com/feed/', category: 'science' },
    { name: 'Aeon Essays', url: 'https://aeon.co/feed.xml', category: 'philosophy' },
  ];

  for (const feed of rssFeeds) {
    await prisma.rssFeed.upsert({
      where: { url: feed.url },
      create: feed,
      update: {},
    });
  }
  console.log(`  ✓ Created ${rssFeeds.length} RSS feeds`);

  // 2. Seed articles from existing sentenceLibrary
  const sentences = [
    {
      title: 'The Secret of Getting Ahead',
      text: 'The secret of getting ahead is getting started.',
      chineseTranslation: '成功的秘诀在于开始。',
      source: 'Think and Grow Rich',
      author: 'Napoleon Hill',
      category: 'life',
      difficulty: 'easy',
      grammaticalAnalysis: 'This is a parallel structure. "The secret of X is Y" emphasizes the connection between cause and effect.',
      expressionTips: '这句话体现了英文写作中的对称美。注意 getting ahead 和 getting started 的平行结构。',
    },
    {
      title: 'The Best of Times',
      text: 'It was the best of times, it was the worst of times.',
      chineseTranslation: '这是最好的时代，也是最坏的时代。',
      source: 'A Tale of Two Cities',
      author: 'Charles Dickens',
      category: 'literature',
      difficulty: 'medium',
      grammaticalAnalysis: 'Perfect parallel structure using repetition. The inversion of "was...was..." creates rhythm and contrast.',
      expressionTips: '这是英文文学中最著名的开篇之一。并行结构突出了时代的矛盾性。',
    },
    {
      title: 'The Only Way to Do Great Work',
      text: 'The only way to do great work is to love what you do.',
      chineseTranslation: '做伟大工作的唯一方式就是热爱你所做的事。',
      source: 'Stanford Commencement Address',
      author: 'Steve Jobs',
      category: 'life',
      difficulty: 'easy',
      grammaticalAnalysis: 'Simple declarative sentence with strong emphasis. The structure "the only way to do X is to Y" presents a definitive assertion.',
      expressionTips: '这是一句经典的人生哲理。注意 "the only way to do" 的表达方式，显得绝对和有说服力。',
    },
    {
      title: 'All Happy Families',
      text: 'All happy families are alike; each unhappy family is unhappy in its own way.',
      chineseTranslation: '所有幸福的家庭都是相似的，而每个不幸的家庭各有各的不幸。',
      source: 'Anna Karenina',
      author: 'Leo Tolstoy',
      category: 'literature',
      difficulty: 'hard',
      grammaticalAnalysis: 'Antithetical structure with contrast between "happy" and "unhappy". Uses universal statements with different conclusions.',
      expressionTips: '俄国文学的经典开篇。通过对比幸福与不幸的特点，提出了深刻的人生哲学。',
    },
    {
      title: 'To Be or Not to Be',
      text: 'To be, or not to be, that is the question.',
      chineseTranslation: '生存还是毁灭，这是个问题。',
      source: 'Hamlet',
      author: 'William Shakespeare',
      category: 'literature',
      difficulty: 'hard',
      grammaticalAnalysis: 'Rhetorical question using binary opposition. The infinitive "to be" is elevated to philosophical status.',
      expressionTips: '莎士比亚最著名的独白。用最简单的词汇表达最深刻的哲学问题。',
    },
    {
      title: 'The Early Bird',
      text: 'The early bird catches the worm, but the second mouse gets the cheese.',
      chineseTranslation: '早起的鸟儿有虫吃，但第二只老鼠得到奶酪。',
      source: 'Popular Saying (adapted)',
      author: '',
      category: 'life',
      difficulty: 'medium',
      grammaticalAnalysis: 'Paradoxical proverb that subverts traditional wisdom through parallel structure.',
      expressionTips: '这是对传统谚语的创意改写。通过第二只鼠的例子制造幽默，表达了"大胆尝试"的哲学。',
    },
  ];

  for (const s of sentences) {
    const article = await prisma.article.create({
      data: {
        title: s.title,
        content: s.text,
        source: s.source,
        author: s.author || null,
        category: s.category,
        difficulty: s.difficulty,
        tags: '[]',
        status: 'published',
        publishedAt: new Date(),
      },
    });

    await prisma.paragraph.create({
      data: {
        articleId: article.id,
        index: 0,
        originalText: s.text,
        chineseTranslation: s.chineseTranslation,
        grammaticalAnalysis: s.grammaticalAnalysis,
        expressionTips: s.expressionTips,
      },
    });
  }
  console.log(`  ✓ Created ${sentences.length} seed articles`);

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
