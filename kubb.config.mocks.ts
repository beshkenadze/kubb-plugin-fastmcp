import { defineConfig } from "@kubb/core";
import { pluginFaker } from "@kubb/plugin-faker";
import { pluginMsw } from "@kubb/plugin-msw";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

export default defineConfig({
  input: {
    path: "./petstore.yaml",
  },
  output: {
    path: "./test/mocks-generated",
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
  ],
});