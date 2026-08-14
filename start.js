module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        path: "app",
        env: {
          VITE_AUTH_ENABLED: "true",
          DRIVEBAY_PINOKIO: "true",
        },
        message: "npm run dev -- --host 0.0.0.0 --port {{port}}",
        on: [
          {
            event: "/(http:\\/\\/[0-9.:]+)/",
            done: true,
          },
        ],
      },
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}",
      },
    },
  ],
};
