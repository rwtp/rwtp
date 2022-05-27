cd ./examples;
mkdir $1;
cd $1;

touch package.json;
echo "{ \"name\": \"$1\", \"scripts\": { \"start\": \"ts-node index.ts\"} }" >> package.json;
yarn add typescript ethers rwtp; 
yarn add -D ts-node tslib @types/node;

cp ../../scripts/example-template/index.ts ./index.ts;
cp ../../scripts/example-template/tsconfig.json .;

touch README.md;
echo "# $1 example" >> README.md;
echo "" >> README.md;
echo "## How to use" >> README.md;
echo "" >> README.md;
echo "\`\`\`" >> README.md;
echo "git clone git@github.com:rwtp/rwtp.git" >> README.md;
echo "cd rwtp" >> README.md;
echo "yarn" >> README.md;
echo "yarn start" >> README.md;
echo "\`\`\`" >> README.md;

