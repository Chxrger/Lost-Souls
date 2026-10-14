module.exports = {
  apps: [
    {
      name: 'soulbot',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 20,
      kill_timeout: 10000,
      time: true,
      merge_logs: true,
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
