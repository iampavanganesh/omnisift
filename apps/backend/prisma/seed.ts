import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.provider.upsert({
    where: { slug: 'serpapi' },
    update: {},
    create: { name: 'SerpAPI', slug: 'serpapi' },
  });

  const sellers = [
    { name: 'Amazon.in', slug: 'amazon-in', domain: 'amazon.in' },
    { name: 'Flipkart', slug: 'flipkart', domain: 'flipkart.com' },
    { name: 'AJIO', slug: 'ajio', domain: 'ajio.com' },
    { name: 'Meesho', slug: 'meesho', domain: 'meesho.com' },
  ];
  for (const s of sellers) {
    await prisma.seller.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  // eslint-disable-next-line no-console
  console.log('Seed complete: 1 provider, 4 sellers.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
