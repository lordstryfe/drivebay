module.exports = {
  run: [
    {
      method: "fs.rm",
      params: {
        path: "app/node_modules",
      },
    },
    {
      method: "notify",
      params: {
        html: "Drivebay reset. Click Install, then Start.",
      },
    },
  ],
};
