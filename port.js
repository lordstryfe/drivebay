module.exports = {
  run: [
    {
      method: "input",
      params: {
        title: "Change Drivebay port",
        description:
          "Stop Drivebay first if it is running. Then pick the port you will forward on your router.",
        form: [
          {
            key: "port",
            title: "Static port",
            description: "1024–65535",
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
      method: "notify",
      params: {
        html: "Port saved. Click <b>Start</b> again.",
      },
    },
  ],
};
