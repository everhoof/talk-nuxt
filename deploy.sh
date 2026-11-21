export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh

find . -maxdepth 1 ! -name node_modules ! -name artifacts.tgz ! -name . ! -name .. -exec rm -rf {} \;
tar -xvf artifacts.tgz
rm artifacts.tgz

nvm install
nvm use
npm install -g pm2
NODE_ENV=production pm2 stop ecosystem.config.cjs
NODE_ENV=production pm2 start ecosystem.config.cjs
pm2 save
