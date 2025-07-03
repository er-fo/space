// Basic test to ensure test framework is working
describe('Space Desktop App', () => {
  test('basic test passes', () => {
    expect(1 + 1).toBe(2);
  });

  test('package.json has correct name', () => {
    const packageJson = require('../package.json');
    expect(packageJson.name).toBe('space-desktop');
  });

  test('version is defined', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBeDefined();
  });
}); 