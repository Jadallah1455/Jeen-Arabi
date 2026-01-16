const fs = require('fs').promises;
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

async function cleanupDuplicates() {
    console.log('🔍 Scanning for duplicate files...\n');
    console.log(`📁 Directory: ${UPLOADS_DIR}\n`);

    try {
        const files = await fs.readdir(UPLOADS_DIR);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));

        console.log(`📊 Total PDF files: ${pdfFiles.length}\n`);

        // Group files by base name (everything before first dash and timestamp)
        const fileGroups = {};
        
        pdfFiles.forEach(file => {
            // Extract story name: ali_baba-1768321087375-845694204.pdf -> ali_baba
            // Pattern: name-timestamp-random.pdf
            const match = file.match(/^(.+?)-\d+-\d+\.pdf$/);
            if (match) {
                const storyName = match[1];
                if (!fileGroups[storyName]) {
                    fileGroups[storyName] = [];
                }
                fileGroups[storyName].push(file);
            } else {
                // File doesn't match pattern, keep it
                console.log(`⚠️  Skipping (doesn't match pattern): ${file}`);
            }
        });

        let totalDeleted = 0;
        let spaceFreed = 0;

        // Find and remove duplicates
        for (const [storyName, files] of Object.entries(fileGroups)) {
            if (files.length > 1) {
                console.log(`\n📦 Found ${files.length} copies of: "${storyName}"`);
                
                // Get file stats to keep the most recent one
                const fileStats = await Promise.all(
                    files.map(async (file) => {
                        const filePath = path.join(UPLOADS_DIR, file);
                        const stats = await fs.stat(filePath);
                        return { 
                            file, 
                            mtime: stats.mtime, 
                            size: stats.size,
                            path: filePath 
                        };
                    })
                );

                // Sort by modification time (newest first)
                fileStats.sort((a, b) => b.mtime - a.mtime);

                // Keep the newest, delete the rest
                const toKeep = fileStats[0];
                const toDelete = fileStats.slice(1);

                console.log(`   ✅ Keeping: ${toKeep.file}`);
                console.log(`      Size: ${(toKeep.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`      Modified: ${toKeep.mtime.toLocaleString()}`);

                for (const { file, size, path } of toDelete) {
                    await fs.unlink(path);
                    totalDeleted++;
                    spaceFreed += size;
                    console.log(`   🗑️  Deleted: ${file} (${(size / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
        });

        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Cleanup Complete!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📊 Files deleted: ${totalDeleted}`);
        console.log(`💾 Space freed: ${(spaceFreed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        console.error('\n💡 Make sure you run this from the server directory:');
        console.error('   cd server');
        console.error('   node cleanupDuplicates.js\n');
    }
}

cleanupDuplicates();
