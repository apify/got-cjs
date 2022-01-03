import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import stripJsonComments from './strip-json-comments.mjs';

execSync('rm -rf got', { stdio: 'inherit' });

execSync('git clone https://github.com/sindresorhus/got', { stdio: 'inherit' });

{
    const packageJson = JSON.parse(readFileSync('got/package.json'));

    packageJson.name = 'got-cjs';
    packageJson.respository = 'apify/got-cjs';
    packageJson.type = 'commonjs';
    packageJson.engines.node = '>=12';
    packageJson.main = packageJson.exports;

    packageJson.dependencies['p-cancelable'] = '2.1.1';
    packageJson.dependencies['@szmarczak/http-timer'] = '4.0.6';
    packageJson.dependencies['lowercase-keys'] = '2.0.0';

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
    tsconfigJson.compilerOptions.target = 'es2018';
    tsconfigJson.compilerOptions.esModuleInterop = true;
    tsconfigJson.compilerOptions.lib = ['es2018'];

    console.log('tsconfig.json', tsconfigJson);

    writeFileSync('got/tsconfig.json', JSON.stringify(tsconfigJson, undefined, '\t'));
}

const s = '\'"`';
for (const x of s) {
    const xx = [...s].find(i => i !== x);

    execSync(`find got/source -type f -exec sed -i -E ${xx}s/\\\\s+from\\\\s+${x}node:/ from ${x}/g${xx} {} +`, { stdio: 'inherit' });
}

execSync('npm install', { cwd: 'got', stdio: 'inherit' });

execSync(`node -e "require('./got')"`, { stdio: 'inherit' });
