// Runs the n8n Creator Portal community-node scan against the LOCAL source so a
// rule violation fails CI before publishing instead of after the portal rejects
// the release. The scanner's toolchain conflicts with this project's devDeps, so
// CI installs it in a throwaway dir and points here via N8N_SCANNER_PATH.
const scannerPath =
  process.env.N8N_SCANNER_PATH ?? '@n8n/scan-community-package/scanner/scanner.mjs';
const { analyzePackage, SOURCE_FILE_PATTERNS } = await import(scannerPath);

const target = process.argv[2] ?? process.cwd();
const result = await analyzePackage(target, SOURCE_FILE_PATTERNS);

if (!result.passed) {
  console.error('n8n community-node scan failed\n');
  console.error(result.details ?? result.message ?? 'unknown error');
  process.exit(1);
}

console.log('n8n community-node scan passed');
