/** PM2 process file for preinspection.digital-dekho.in */
module.exports = {
  apps: [
    {
      name: "digitalauto-next",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3020 -H 0.0.0.0",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3020",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
