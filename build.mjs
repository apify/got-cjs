import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import stripJsonComments from './strip-json-comments.mjs';

execSync('rm -rf got', { stdio: 'inherit' });

execSync('git clone https://github.com/sindresorhus/got', { stdio: 'inherit' });

{
    const packageJson = JSON.parse(readFileSync('got/package.json'));

    packageJson.name = 'got-cjs2';
    packageJson.repository = 'apify/got-cjs';
    packageJson.type = 'commonjs';
    packageJson.engines.node = '>=16';
    packageJson.main = packageJson.exports;

    packageJson.dependencies['p-cancelable'] = '^3.0.0';
    packageJson.dependencies['@szmarczak/http-timer'] = '^5.0.1';
    packageJson.dependencies['lowercase-keys'] = '^3.0.0';
    packageJson.dependencies['@sindresorhus/is'] = '^5.2.0';
    packageJson.dependencies['form-data-encoder'] = '^2.1.2';
    packageJson.dependencies['responselike'] = '^3.0.0';
    packageJson.dependencies['cacheable-lookup'] = '^7.0.0';
    packageJson.dependencies['form-data-encoder'] = '^2.1.2';
    packageJson.dependencies['cacheable-request'] = '^10.2.8';
    packageJson.dependencies['@types/responselike'] = '^3.0.0';

    packageJson.devDependencies['p-event'] = '^5.0.1';
    packageJson.devDependencies['to-readable-stream'] = '2.1.0';
    packageJson.devDependencies['formdata-node'] = '^5.0.0';
    packageJson.devDependencies['pify'] = '^6.0.0';
    packageJson.devDependencies['tempy'] = '^3.0.0';
    packageJson.devDependencies['node-fetch'] = '^3.2.3';
    packageJson.devDependencies['@types/node-fetch'] = '2.6.2';

    delete packageJson.exports;

    console.log('package.json', packageJson);

    writeFileSync('got/package.json', JSON.stringify(packageJson, undefined, '\t'));
}

{
    const tsconfigJson = JSON.parse(
        stripJsonComments(
            readFileSync('got/tsconfig.json', 'utf-8')
        )
    );

    tsconfigJson.compilerOptions.module = 'commonjs';
    tsconfigJson.compilerOptions.target = 'es2020';
    tsconfigJson.compilerOptions.esModuleInterop = true;
    tsconfigJson.compilerOptions.lib = ['es2020'];
    tsconfigJson.include = ['source', 'benchmark', /* 'test' */];

    console.log('tsconfig.json', tsconfigJson);

    writeFileSync('got/tsconfig.json', JSON.stringify(tsconfigJson, undefined, '\t'));
}

{
const sourceCoreIndex = readFileSync('got/source/core/index.ts', 'utf-8')
.replace(`import CacheableRequest, {
	CacheError as CacheableCacheError,
	type StorageAdapter,
	type CacheableRequestFunction,
	type CacheableOptions,
} from 'cacheable-request';
`, `import CacheableRequest from 'cacheable-request';`)
.replace(`
			if (error instanceof CacheableCacheError) {
				throw new CacheError(error, this);
			}
`, `
			if ((error as any).name === 'CacheError') {
				throw new CacheError(error as any, this);
			}
`)
.replace(`type Error = NodeJS.ErrnoException;`, `type Error = NodeJS.ErrnoException;

type StorageAdapter = any;
type CacheableRequestFunction = any;
type CacheableOptions = any;`)
.replace(`import {FormDataEncoder, isFormData as isFormDataLike} from 'form-data-encoder';`, `// @ts-ignore
import {FormDataEncoder, isFormData as isFormDataLike} from 'form-data-encoder';`)
.replace('body.destroy();', '(body as any).destroy();')
.replace('const cacheableRequest = new CacheableRequest(', 'cacheableStore.set(cache, new CacheableRequest(')
.replace(`			);
			cacheableStore.set(cache, cacheableRequest.request());`, '			));');

writeFileSync('got/source/core/index.ts', sourceCoreIndex);
}

{
const sourceCoreOptions = readFileSync('got/source/core/options.ts', 'utf-8')
.replace(`import {isFormData} from 'form-data-encoder';
import type {FormDataLike} from 'form-data-encoder';`, `// @ts-expect-error fails to find types
import {isFormData} from 'form-data-encoder';
// @ts-expect-error fails to find types
import type {FormDataLike} from 'form-data-encoder';`)
.replace(`import type {StorageAdapter} from 'cacheable-request';
`, '')
.replaceAll('string | StorageAdapter | boolean | undefined', 'any')
.replace('assert.truthy(value.readable);', 'assert.truthy((value as any).readable);');

writeFileSync('got/source/core/options.ts', sourceCoreOptions);
}

const s = '\'"`';
for (const x of s) {
    const xx = [...s].find(i => i !== x);

    execSync(`find got/source -type f -exec sed -i -E ${xx}s/\\\\s+from\\\\s+${x}node:/ from ${x}/g${xx} {} +`, { stdio: 'inherit' });
}

execSync('npm install', { cwd: 'got', stdio: 'inherit' });

execSync(`node -e "require('./got')"`, { stdio: 'inherit' });
