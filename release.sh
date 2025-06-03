mkdir -p release
rm -rf release
mkdir -p release
cp package.json release/package.json
tsc
cp -r dist/* release/
cp README.md release/README.md