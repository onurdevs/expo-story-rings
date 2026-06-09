const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const exampleRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(exampleRoot, '..');
const vendorDir = path.join(exampleRoot, 'vendor');

fs.mkdirSync(vendorDir, { recursive: true });

execSync('npm run build', { cwd: repoRoot, stdio: 'inherit', env: process.env });

const packDestination = path.relative(repoRoot, vendorDir);

const packOutput = execSync(`npm pack --pack-destination ${packDestination}`, {
  cwd: repoRoot,
  encoding: 'utf8',
  env: process.env,
}).trim();

const tarballName = path.basename(packOutput);
const tarballPath = path.join(vendorDir, tarballName);

if (!fs.existsSync(tarballPath)) {
  throw new Error(`Expected packed tarball at ${tarballPath}`);
}

execSync(`npm install --no-save ./vendor/${tarballName}`, {
  cwd: exampleRoot,
  stdio: 'inherit',
});

console.log(`Installed expo-story-rings from ${tarballName}`);
