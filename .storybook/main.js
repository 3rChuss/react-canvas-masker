/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../src/*.stories.tsx"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    {
      name: "storybook-preset-less",
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Removed deprecated core.builder for Storybook 9 compatibility
  // If you need custom webpack config, migrate to Vite or use framework options
};
export default config;
