const ownership = {
    LS: 'Licensed', 
    CO: 'CompanyOwned',
    JV: 'JointVenture',
    FR: 'Franchise'
}

const duplicates = [
'CentrO Ground Floor',
'Division del Norte',
'Gouda Station',
'Lemessos Enaerios',
'Mabohai Shopping Mall',
'Magnolia',
'Plaza America',
'SPA',
'Starbucks',
'مركز أوتاد']

export const transform = (arr) => {
    return arr.map(obj => {
        const data = {}
        data.status = 'PUBLISHED'
        data.number = obj['Store Number']
        data.name = duplicates.includes(obj.Name) ? `${obj.Name} ${obj['Store ID']}` : obj.Name
        data.ownership = ownership[obj['Ownership Type']]
        data.city = obj.City
        data.country = obj.Country
        data.postcode = obj['Postal Code']
        data.phoneNumber = obj['Phone Number']
        data.location = {latitude: obj.Latitude / 1, longitude: obj.Longitude / 1}
        data.storeID = obj['Store ID'] / 1
        data.olsonTimezone = obj['Olson Timezone']

        return data
    })
}