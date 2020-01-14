module.exports = {
    endConnectionHandler: (error) => {
        if(error) {
            console.log('[!] Fatal error while closing database connection');
            console.error(error);
            process.exit(1);
        }
    },
}