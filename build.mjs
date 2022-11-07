import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import stripJsonComments from './strip-json-comments.mjs';

execSync('rm -rf got', { stdio: 'inherit' });

execSync('git clone https://github.com/sindresorhus/got', { stdio: 'inherit' });

{
    const packageJson = JSON.parse(readFileSync('got/package.json'));

    packageJson.name = 'got-cjs';
    packageJson.repository = 'apify/got-cjs';
    packageJson.type = 'commonjs';
    packageJson.engines.node = '>=12';
    packageJson.main = packageJson.exports;

    packageJson.dependencies['p-cancelable'] = '2.1.1';
    packageJson.dependencies['@szmarczak/http-timer'] = '4.0.6';
    packageJson.dependencies['lowercase-keys'] = '2.0.0';
    packageJson.dependencies['@sindresorhus/is'] = '4.6.0';
    packageJson.dependencies['form-data-encoder'] = '1.7.2';
    packageJson.dependencies['responselike'] = '2.0.1';
    packageJson.dependencies['cacheable-lookup'] = '6.1.0';
    packageJson.dependencies['form-data-encoder'] = '1.7.2';
    packageJson.dependencies['cacheable-request'] = '8.3.1';

    packageJson.devDependencies['p-event'] = '4.2.0';
    packageJson.devDependencies['to-readable-stream'] = '2.1.0';
    packageJson.devDependencies['formdata-node'] = '4.4.1';
    packageJson.devDependencies['pify'] = '5.0.0';
    packageJson.devDependencies['tempy'] = '1.0.1';
    packageJson.devDependencies['node-fetch'] = '2.6.7';
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
			if (error.name === 'CacheError') {
				throw new CacheError(error, this);
			}
`)
.replace(`type Error = NodeJS.ErrnoException;`, `type Error = NodeJS.ErrnoException;

type StorageAdapter = any;
type CacheableRequestFunction = any;
type CacheableOptions = any;`)
.replace(`import {FormDataEncoder, isFormData as isFormDataLike} from 'form-data-encoder';`, `// @ts-ignore
import {FormDataEncoder, isFormData as isFormDataLike} from 'form-data-encoder';`)
.replace('body.destroy();', '(body as any).destroy();');

writeFileSync('got/source/core/index.ts', sourceCoreIndex);
}

const s = '\'"`';
for (const x of s) {
    const xx = [...s].find(i => i !== x);

    execSync(`find got/source -type f -exec sed -i -E ${xx}s/\\\\s+from\\\\s+${x}node:/ from ${x}/g${xx} {} +`, { stdio: 'inherit' });
}

execSync('npm install', { cwd: 'got', stdio: 'inherit' });

execSync(`node -e "require('./got')"`, { stdio: 'inherit' });
