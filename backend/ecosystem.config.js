module.exports = {
    apps: [
        {
            name: 'portal-backend',
            script: './src/server.ts',
            interpreter: 'node',
            interpreter_args: '-r tsx/register',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
        },
        {
            name: 'portal-web',
            script: 'node_modules/next/dist/bin/next',
            args: 'start',
            cwd: '../web',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
        },
    ],
};
