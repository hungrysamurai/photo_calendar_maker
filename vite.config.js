export default {
  // Served by nginx at /projects/photo_calendar_maker/ (see wrapper repo nginx/locations.conf)
  base: '/projects/photo_calendar_maker/',
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
    },
  },
};
