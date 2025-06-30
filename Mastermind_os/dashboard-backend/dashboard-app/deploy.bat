@echo off
echo Building and deploying Mastermind Dashboard...

echo Installing dependencies...
call npm install

echo Building the application...
call npm run build

echo Deploying to Vercel...
call npx vercel --prod

echo Deployment complete!
pause
