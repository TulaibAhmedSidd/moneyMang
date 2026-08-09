Expo Autolinking module resolution enabled
Starting Metro Bundler
Android Bundling failed 9599ms node_modules/expo-router/entry.js (1300 modules)
Error: While trying to resolve module `@money/shared` from file `/home/expo/workingdir/build/apps/mobile/app/(app)/add-transaction.tsx`, the package `/home/expo/workingdir/build/node_modules/@money/shared/package.json` was successfully found. However, this package itself specifies a `main` module field that could not be resolved (`/home/expo/workingdir/build/node_modules/@money/shared/dist/index.js`. Indeed, none of these files exist:

  * /home/expo/workingdir/build/node_modules/@money/shared/dist/index.js(.android.ts|.native.ts|.ts|.android.tsx|.native.tsx|.tsx|.android.mjs|.native.mjs|.mjs|.android.js|.native.js|.js|.android.jsx|.native.jsx|.jsx|.android.json|.native.json|.json|.android.cjs|.native.cjs|.cjs|.android.scss|.native.scss|.scss|.android.sass|.native.sass|.sass|.android.css|.native.css|.css)
  * /home/expo/workingdir/build/node_modules/@money/shared/dist/index.js/index(.android.ts|.native.ts|.ts|.android.tsx|.native.tsx|.tsx|.android.mjs|.native.mjs|.mjs|.android.js|.native.js|.js|.android.jsx|.native.jsx|.jsx|.android.json|.native.json|.json|.android.cjs|.native.cjs|.cjs|.android.scss|.native.scss|.scss|.android.sass|.native.sass|.sass|.android.css|.native.css|.css)
Error: While trying to resolve module `@money/shared` from file `/home/expo/workingdir/build/apps/mobile/app/(app)/add-transaction.tsx`, the package `/home/expo/workingdir/build/node_modules/@money/shared/package.json` was successfully found. However, this package itself specifies a `main` module field that could not be resolved (`/home/expo/workingdir/build/node_modules/@money/shared/dist/index.js`. Indeed, none of these files exist:

  * /home/expo/workingdir/build/node_modules/@money/shared/dist/index.js(.android.ts|.native.ts|.ts|.android.tsx|.native.tsx|.tsx|.android.mjs|.native.mjs|.mjs|.android.js|.native.js|.js|.android.jsx|.native.jsx|.jsx|.android.json|.native.json|.json|.android.cjs|.native.cjs|.cjs|.android.scss|.native.scss|.scss|.android.sass|.native.sass|.sass|.android.css|.native.css|.css)
  * /home/expo/workingdir/build/node_modules/@money/shared/dist/index.js/index(.android.ts|.native.ts|.ts|.android.tsx|.native.tsx|.tsx|.android.mjs|.native.mjs|.mjs|.android.js|.native.js|.js|.android.jsx|.native.jsx|.jsx|.android.json|.native.json|.json|.android.cjs|.native.cjs|.cjs|.android.scss|.native.scss|.scss|.android.sass|.native.sass|.sass|.android.css|.native.css|.css)
    at DependencyGraph.resolveDependency (/home/expo/workingdir/build/node_modules/metro/src/node-haste/DependencyGraph.js:278:17)
    at /home/expo/workingdir/build/node_modules/metro/src/lib/transformHelpers.js:165:21
    at resolveDependencies (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:43:25)
    at visit (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:81:30)
    at async Promise.all (index 1)
    at async visit (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:90:5)
    at async Promise.all (index 0)
    at async visit (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:90:5)
    at async Promise.all (index 1)
    at async visit (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:90:5)
    at async Promise.all (index 1)
    at async visit (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:90:5)
    at async Promise.all (index 0)
    at async visit (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:90:5)
    at async Promise.all (index 0)
    at async buildSubgraph (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/buildSubgraph.js:105:3)
    at async Graph._buildDelta (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/Graph.js:163:22)
    at async Graph.initialTraverseDependencies (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/Graph.js:146:19)
    at async DeltaCalculator._getChangedDependencies (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/DeltaCalculator.js:164:25)
    at async DeltaCalculator.getDelta (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/DeltaCalculator.js:74:16)
    at async DeltaBundler.buildGraph (/home/expo/workingdir/build/node_modules/metro/src/DeltaBundler.js:42:5)
    at async IncrementalBundler.buildGraphForEntries (/home/expo/workingdir/build/node_modules/metro/src/IncrementalBundler.js:94:19)
    at async IncrementalBundler.buildGraph (/home/expo/workingdir/build/node_modules/metro/src/IncrementalBundler.js:178:19)
    at async /home/expo/workingdir/build/node_modules/metro/src/IncrementalBundler.js:216:34
    at async IncrementalBundler.initializeGraph (/home/expo/workingdir/build/node_modules/metro/src/IncrementalBundler.js:233:24)
    at async MetroBundlerDevServer._bundleDirectAsync (/home/expo/workingdir/build/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js:1578:35)
    at async MetroBundlerDevServer.metroLoadModuleContents (/home/expo/workingdir/build/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js:656:25)
    at async MetroBundlerDevServer.legacySinglePageExportBundleAsync (/home/expo/workingdir/build/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js:843:24)
    at async exportEmbedBundleAndAssetsAsync (/home/expo/workingdir/build/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js:302:25)
    at async exportEmbedInternalAsync (/home/expo/workingdir/build/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js:254:39)
    at async exportEmbedAsync (/home/expo/workingdir/build/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js:235:5)
npx expo export:embed --eager --platform android --dev false exited with non-zero code: 1