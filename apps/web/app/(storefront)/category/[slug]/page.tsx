import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductBrowser, type BrowseParams } from '@/features/products/product-browser';
import { ApiError } from '@/lib/api-client';
import { catalog } from '@/lib/api-client/endpoints';

export const revalidate = 300;

async function findCategory(slug: string) {
  const tree = await catalog.categories();
  for (const parent of tree) {
    if (parent.slug === slug) return { node: parent, parent: null };
    const child = parent.children.find((candidate) => candidate.slug === slug);
    if (child) return { node: child, parent };
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const found = await findCategory(params.slug).catch(() => null);
  return { title: found ? found.node.name : 'Turkum' };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: BrowseParams;
}) {
  const found = await findCategory(params.slug).catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!found) notFound();

  const { node, parent } = found;

  return (
    <div className="space-y-6">
      <nav aria-label="Navigatsiya zanjiri" className="text-sm text-accent/50">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary-ink">
              Bosh sahifa
            </Link>
          </li>
          {parent ? (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/category/${parent.slug}`} className="hover:text-primary-ink">
                  {parent.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden>/</li>
          <li className="font-medium text-accent">{node.name}</li>
        </ol>
      </nav>

      <ProductBrowser
        basePath={`/category/${params.slug}`}
        category={params.slug}
        params={searchParams}
        title={node.name}
      >
        {node.children.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {node.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/category/${child.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-base px-3.5 py-1.5 text-sm hover:bg-accent/10"
                >
                  {child.name}
                  <span className="text-xs text-accent/40">{child.product_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </ProductBrowser>
    </div>
  );
}
