import { fetchList } from '../server/fetchers/listFetcher.js';
import MongoDB from '../server/database/mongo.js';
import config from '../server/config/default.js';

async function main() {
    try {
        await MongoDB.connect();
        // const result = await fetchList();
        const result = await fetchList(config.stocks);
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();