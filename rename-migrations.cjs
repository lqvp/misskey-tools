const fs = require('fs');
const path = require('path');

const migrationDir = path.join(__dirname, 'built/migration');

// ディレクトリが存在することを確認
if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
}

fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.js'))
    .forEach(file => {
        const oldPath = path.join(migrationDir, file);
        const newPath = path.join(migrationDir, file.replace('.js', '.cjs'));
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${file} -> ${file.replace('.js', '.cjs')}`);
    });