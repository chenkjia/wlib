const { fetchList } = require('../src/fetchers/listFetcher');
const MongoDB = require('../src/database/mongo');

async function main() {
    try {
        await MongoDB.connect();
        const result = await fetchList();
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();