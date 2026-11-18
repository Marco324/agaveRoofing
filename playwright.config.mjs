import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/ui',workers:1,timeout:30000,
  use:{baseURL:'http://localhost:3110',viewport:{width:1440,height:1000},screenshot:'only-on-failure'},
  webServer:{command:'node --experimental-strip-types --experimental-sqlite scripts/test-ui-server.mjs',url:'http://localhost:3110',reuseExistingServer:false,timeout:30000},
});
