/**
 * Inject a `<script type="application/ld+json">` block into a page so
 * Google / Bing / DuckDuckGo can read the structured data. Used to
 * surface speakers as `Product`, the catalogue as `ItemList`, the
 * brand identity as `Organization`/`WebSite`, etc.
 *
 * Pass any JSON-serialisable value as `data`. We stringify with no
 * pretty-printing (smaller payload) and emit a stable `key` per call
 * site so React's reconciliation doesn't churn it across renders.
 *
 * Keep this server-only — it just renders a `<script>` tag and never
 * needs client interactivity. Putting JSON-LD inside the body is
 * explicitly supported by Google; `<head>` is not required.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      // The payload is server-generated from typed data — there is no
      // user input on this path, so dangerouslySetInnerHTML is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
