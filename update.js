module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git reset --hard HEAD && git pull",
      },
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: "npm install",
      },
    },
  ],
};
