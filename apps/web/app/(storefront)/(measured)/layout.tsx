/**
 * The reading measure for the storefront.
 *
 * The cap lives here rather than on the shell's `<main>` so one route can opt
 * out of it: the product page runs edge to edge, and a child cannot escape a
 * parent's `max-width`. A route group changes nothing about the URL.
 */
export default function MeasuredLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-content px-4">{children}</div>;
}
