module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        env: {
          VITE_AUTH_ENABLED: "true",
          DRIVEBAY_PINOKIO: "true",
        },
        message: "node run-dev.cjs",
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
