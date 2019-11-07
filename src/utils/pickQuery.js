/*
Picks the actual query out of the imported
graphql query/mutation.
*/

export const pickQuery = node => {
    if (!node || !node.loc || !node.loc.source) {
        console.log('Malformed Query')
    } else {
        return node.loc.source.body
    }
}