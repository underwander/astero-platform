# Project workflow

- Develop this project locally on Windows in `C:\Platform\astero-platform-main`.
- Use `astero-main` as the working Git branch.
- Production is deployed at `/var/www/astero-platform` and runs under PM2 with the process name `astero-platform`.

After making changes, give the user this simplified workflow:

1. Verify the changes locally first.
2. Run `git add -A`, create a commit with `git commit`, and run `git push`.
3. After the push, update production by opening Termius, changing to `/var/www/astero-platform`, and running `./deploy.sh`.
4. Do not suggest manually running `git pull`, `npm ci`, `npm run build`, or `pm2 restart`; `deploy.sh` already performs those steps.
5. If a deployment causes a problem, remind the user that they can run `./rollback.sh`.

Never run `npm audit fix --force` without the user's explicit permission.
