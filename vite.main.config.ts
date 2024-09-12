import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig, mergeConfig } from 'vite'
import vitePluginRequire from 'vite-plugin-require'
import viteTscPaths from 'vite-tsconfig-paths'
import { external, getBuildConfig, getBuildDefine, pluginHotRestart } from './vite.base.config'

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'build'>
  const { forgeConfigSelf } = forgeEnv
  const define = getBuildDefine(forgeEnv)
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry,
        fileName: () => 'main.js',
        formats: ['es'],
      },
      rollupOptions: {
        external,
      },
    },
    plugins: [pluginHotRestart('restart'), (vitePluginRequire as any).default(), viteTscPaths()],
    define,
    resolve: {
      // Load the Node.js entry.
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  }

  return mergeConfig(getBuildConfig(forgeEnv), config)
})
