module.exports = {
  run: [
    {
      method: "input",
      params: {
        title: "Drivebay port",
        description:
          "Pick one port and keep it. Forward this same port on your router so phones and the internet can reach Drivebay. Example: 42013.",
        form: [
          {
            key: "port",
            title: "Static port",
            description: "1024–65535. Same number every time you Start.",
            default: "42013",
          },
        ],
      },
    },
    {
      method: "shell.run",
      params: {
        message: "node save-port.cjs",
        env: {
          DRIVEBAY_PORT: "{{input.port}}",
        },
      },
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: "npm install",
      },
    },
    {
      method: "notify",
      params: {
        html: "Drivebay installed. Click <b>Start</b>, then open it on that port. Change the port later with <b>Set port</b>.",
      },
    },
  ],
};
