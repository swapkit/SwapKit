import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        banner: z
          .object({ content: z.string() })
          .default({ content: "SwapKit is a powerful suite of tools for building blockchain applications." }),
      }),
    }),
  }),
};
