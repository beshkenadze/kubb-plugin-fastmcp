import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginFastMCP } from "./src/index";

export default defineConfig({
  input: {
    path: "./petstore.yaml",
  },
  output: {
    path: "./test/generated",
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginZod(),
    pluginFastMCP({
      runtime: "bun",
      output: {
        path: "./fastmcp",
        barrelType: "named",
      },
      client: {
        baseURL: "https://petstore.swagger.io/v2",
        importPath: "@kubb/plugin-client/clients/axios",
        dataReturnType: "data",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}Handlers`,
      },
    }),
  ],
});
