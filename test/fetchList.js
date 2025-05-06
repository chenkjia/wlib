import { fetchList } from '../server/fetchers/listFetcher.js';
import MongoDB from '../server/database/mongo.js';

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