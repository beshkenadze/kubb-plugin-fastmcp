import { defineConfig } from "@kubb/core";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
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
    pluginFaker({
      output: {
        path: "./mocks/data",
        barrelType: "named",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}MockData`,
      },
      seed: [100],
    }),
    pluginMsw({
      output: {
        path: "./mocks/handlers",
        barrelType: "named",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}Handlers`,
      },
      parser: "faker",
      handlers: true,
    }),
    pluginFastMCP({
      runtime: "bun",
      output: {
        path: "./fastmcp",
        barrelType: "named",
      },
      client: {
        baseURL: "https://petstore.swagger.io/v2",
        importPath: "./test/mock-client",
        dataReturnType: "data",
      },
      group: {
        type: "tag",
        name: ({ group }) => `${group}Handlers`,
      },
    }),
  ],
});
