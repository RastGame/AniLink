const User = require('../Schemas/userSchema')
let UserWarnsCache = new Map()
const CACHE_TTL = 10 * 60 * 500; // 5 хв збереження кешу

async function warning_cache_check(message) {
    try{
        let cacheEntry = UserWarnsCache.get(message.author.id);

        if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
            return cacheEntry.warns;
        }
    
        let userData = await User.findOne({ _id: message.author.id });
    
        let warns = userData ? userData.warns : 0;
        UserWarnsCache.set(message.author.id, { warns, timestamp: Date.now() });
    
        return warns;
    }catch(error) {
        console.log('warning_cache_check: ' + error)
    }
    
}

async function add_warns_to_cache(user_id) {
    try{
        let cacheEntry = UserWarnsCache.get(user_id);
        let updated_warns = cacheEntry ? cacheEntry.warns + 1 : 1;

        UserWarnsCache.set(user_id, { warns: updated_warns, timestamp: Date.now() });
        
        }catch(error) {
            console.log('add_warns_to_cache: ' + error)
        }
    
}

setInterval(() => {
    let now = Date.now();
    for (let [user_id, cacheEntry] of UserWarnsCache) {
        if ((now - cacheEntry.timestamp) >= CACHE_TTL) {
            delete_cache(user_Id)
            console.log(`Кеш видалено для користувача ${user_id}`);
        }
    }
}, CACHE_TTL);

function delete_cache(user_Id) {
    try{
        console.log('Айдішник: '+ user_Id)
        let cacheEntry = UserWarnsCache.get(user_Id);
        if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
            UserWarnsCache.delete(user_Id);
            console.log("Кеш видалено!")
        }


    
    }catch(error) {
        console.log(error)
    }
}
module.exports = {
    warning_cache_check,
    add_warns_to_cache,
    delete_cache
}