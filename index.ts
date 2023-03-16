import { hono, imagescript, ky, serve } from "./deps.ts";

const app = new hono.Hono();

const size = 70;

app.get(
  "/",
  async (c) => {
    const videoId = c.req.query("videoId");
    if (!videoId) {
      return c.redirect(
        "https://github.com/sevenc-nanashi/kiitecafe-thumbnail",
      );
    } else if (
      !videoId.match(
        /sm[0-9]+/,
      )
    ) {
      return c.json({ error: "invalid thumbnail" }, 400);
    }
    const nicoPlayer = await ky.get(
      `https://embed.nicovideo.jp/watch/${videoId}`,
    ).text();
    const props = nicoPlayer.match(/data-props="(.+?)"/);
    if (!props) {
      return c.json({ error: "invalid video id" }, 400);
    }
    const baseImageUrl =
      JSON.parse(props[1].replaceAll("&quot;", '"')).thumbnailUrl;
    const baseImage = await ky.get(baseImageUrl).arrayBuffer();
    const image = await imagescript.Image.decode(baseImage);
    const cropped = image.crop(
      (image.width - size) / 2,
      (image.height - size) / 2,
      size,
      size,
    );
    c.header("Content-Type", "image/png");
    return c.body(await cropped.encode());
  },
);

serve(app.fetch, {
  port: 3000,
});
