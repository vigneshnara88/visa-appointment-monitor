import { loadConfig } from './config.js';
import { MockPortal } from './mock-portal.js';
import { monitor } from './monitor.js';

try {
  if (process.argv.length > 3) throw new Error('Usage: node src/index.js [config.json]');
  const config = await loadConfig(process.argv[2] ?? 'config.example.json');
  const portal = await MockPortal.fromFile(config.fixture);
  const report = monitor(portal, config);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Monitor stopped: ${error.message}\n`);
  process.exitCode = 1;
}
