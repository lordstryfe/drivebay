module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        path: "app",
        env: {
          VITE_AUTH_ENABLED: "true",
        },
        message: "npm run dev -- --host 127.0.0.1 --port {{port}}",
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
