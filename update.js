module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "git fetch origin && git reset --hard origin/main",
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
