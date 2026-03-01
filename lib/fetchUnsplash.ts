export async function fetchUnsplashImage(
  query: string,
): Promise<string | null> {
  try {
    const url = new URL("https://api.unsplash.com/photos/random");
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        "Accept-Version": "v1",
      },
      next: { revalidate: 0 }, // always fresh
    });

    if (!res.ok) {
      console.warn("Unsplash fetch failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();

    // Return the regular size URL (1080px wide — good quality, fast load)
    return data?.urls?.regular ?? null;
  } catch (err) {
    console.error("fetchUnsplashImage error:", err);
    return null;
  }
}
