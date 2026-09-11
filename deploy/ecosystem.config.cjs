module.exports = {
  apps: [
    {
      name: "tabsync",
      cwd: "/opt/tabsync/current/backend",
      script: "src/index.ts",
      interpreter: "/usr/local/bin/bun",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        DATABASE_PATH: "/var/lib/tabsync/tabsync.sqlite",
      },
    },
  ],
};
