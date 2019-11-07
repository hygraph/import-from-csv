# The Project

To help with the process of importing CSVs to GraphCMS, we've created some simple scripts that can assist in the process. These scripts are not robust, they lack in-depth error checking, and probably lack some general code elegance, but you can view them as an import workspace to quick-start your importing needs.

To follow along you'll need to signup for an account at GraphCMS, create a new project and implement the schema as defined above. For more details about creating a project with GraphCMS, [check our getting started guide.](https://graphcms.com/docs/getting-started/)

The project structure is as follows.

```bash
data/
src/
  index.js  # for compiling with babel
  app.js
  inspectData.js
  utils/
    fetch.js
    inspect.js
    paginate.js
    pickQuery.js
    readCSV.js
  transforms/
    coffeetype.js
  queries/ # not used
  mutations/
```

### Data Inspection

The file `inspectData.js` includes a series of helpers that let us check for uniqueness of various keys across our data set, report duplicates, check for total supported character set and more.

The helpers are listed in `utils/inspect.js`, and the utilities have been abstracted to general purpose usage which should allow them to be used in any project.

```js
/*
Simple helper to pick the value off the
first key of a passed in object
*/
const firstKey = obj => Object.keys(obj)[0];

/*
Helper to reduce the data to an object
with a shape of a single key,
provided as the only parameter.
*/
export const pickKey = key => data =>
  data.map(obj => {
    const newObj = {};
    newObj[key] = obj[key];
    return newObj;
  });

/*
Returns a list of all the unique values.
*/
export const uniqueValues = async data => {
  return [...new Set(data.map(obj => obj[firstKey(obj)]))];
};

/*
Returns all the chars that need to be
supported by a field. Helpful for validating
if a string field is needed or if integer
is allowed.
*/
export const uniqueChars = async data => {
  return [
    ...new Set(
      data.reduce(
        (prev, curr) => [...prev, ...curr[firstKey(curr)].split('')],
        []
      )
    ),
  ].join();
};

/*
Checks to see if the provided keys have data.
*/
export const requiredKeys = (keys, identityKey) => async data => {
  return [
    ...new Set(
      data.reduce((prev, curr) => {
        for (let key of keys) {
          if (!curr[key].length) prev.push(curr[identityKey]);
        }
        return prev;
      }, [])
    ),
  ];
};

/*
Checks to see if there are duplicates, boolean response.
*/
export const uniqueKey = key => async data => {
  const newLength = [
    ...new Set(pickKey(key)(data).map(obj => obj[firstKey(obj)])),
  ];

  console.log(data.length);
  console.log(newLength.length);

  if (data.length !== newLength.length) return false;

  return true;
};

/*
Reports all duplicates with an optional diagnostic key
as input.
*/
export const findDuplicates = key => async (data, diagnosticKey) => {
  return data
    .sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    })
    .filter((el, index, arr) => {
      if (index === 0) return false;
      return el[key] === arr[index - 1][key];
    })
    .map(el => el[diagnosticKey || key]);
};
```

You can implement them like the following.

```js
import {
  pickKey,
  uniqueValues,
  uniqueChars,
  uniqueKey,
  requiredKeys,
  findDuplicates,
} from './utils/inspect';
import { readFile } from './utils/readCSV';

export const inspectData = async () => {
  const data = await readFile(
    './data/all_starbucks_locations_in_the_world.csv'
  );

  const collection = {};

  // Check for Brands
  const brands = pickKey('Brand');
  collection.brands = await uniqueValues(brands(data));

  // Get List of Ownership Type Enum
  const ownershipType = pickKey('Ownership Type');
  collection.ownershipEnum = await uniqueValues(ownershipType(data));

  // Get List of unique phone chars
  const phone = pickKey('Phone Number');
  collection.phoneChars = await uniqueChars(phone(data));

  // Check for missing keys
  const checkEmptyLocation = requiredKeys(['Latitude', 'Longitude'], 'Name');
  collection.missingLocationData = await checkEmptyLocation(data);

  // Check for uniqueness of names.
  const uniqueName = uniqueKey('Name');
  collection.uniqueNames = await uniqueName(data);

  // Data cleansing revealed I had duplicates, this helps find them.
  const findCommonName = findDuplicates('Name');
  const commonNames = await findCommonName(data);
  collection.commonNamesFlat = [...new Set(commonNames)];

  // Looking for Duplicate Lat/Long values
  const uniqueLatitude = uniqueKey('Latitude');
  collection.uniqueLatitudes = await uniqueLatitude(data);

  const uniqueLongitude = uniqueKey('Longitude');
  collection.uniqueLongitudes = await uniqueLongitude(data);

  console.log(collection);
};
```

### Data Cleansing and Transformation

The transformation methods are in `/transorms`, I recommend using a similar pattern. The transforms will be applied in the next section.

```js
const ownership = {
  LS: 'Licensed',
  CO: 'CompanyOwned',
  JV: 'JointVenture',
  FR: 'Franchise',
};

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
  'مركز أوتاد',
];

export const transform = arr => {
  return arr.map(obj => {
    const data = {};
    data.status = 'PUBLISHED';
    data.number = obj['Store Number'];
    data.name = duplicates.includes(obj.Name)
      ? `${obj.Name} ${obj['Store ID']}`
      : obj.Name;
    data.ownership = ownership[obj['Ownership Type']];
    data.city = obj.City;
    data.country = obj.Country;
    data.postcode = obj['Postal Code'];
    data.phoneNumber = obj['Phone Number'];
    data.location = {
      latitude: obj.Latitude / 1,
      longitude: obj.Longitude / 1,
    };
    data.storeID = obj['Store ID'] / 1;
    data.olsonTimezone = obj['Olson Timezone'];

    return data;
  });
};
```

### Import

The final step is to put the pieces together, transform the content and import the content.

You'll first need to write a mutation query and save that in the mutation folder. Mine looks like the following:

```graphql
mutation UpdateCoffeeShop(
  $brand: String
  $data: [CoffeeShopCreateWithoutBrandInput!]
) {
  updateBrand(
    where: { name: $brand }
    data: { coffeeShops: { create: $data } }
  ) {
    id
  }
}
```

I've provided some helper utilities using `Axios`, you will need to provide your own Project API ID and create a secure token for importing the data. For more information on creating a token, [check the docs on working with Permanent Auth Tokens.](https://graphcms.com/docs/guides/working-with-pats.mdx)

Fill out the following values in your `.env file.

```bash
MUTATION_ENABLED_PAT=eyJ0eXAiOOiJIUz…
PROJECT_ID=ck2lzdpl52f…
```

When you put all the parts together, you will end up with a file like this:

```js
import { uploadMutation } from './utils/fetch.js';
import { readFile } from './utils/readCSV';
import { inspectData } from './inspectData';
import { paginate } from './utils/paginate';
import { transform } from './transforms/coffetype';

import mutation from './mutations/batchImportCoffeeShop.graphql';

const run = async () => {
  const data = await readFile(
    './data/all_starbucks_locations_in_the_world.csv'
  );

  const brand = 'Coffee House Holdings';
  const filteredData = data.filter(el => el.Brand === brand);
  const transformedData = transform(filteredData);

  paginate(transformedData, uploadMutation(mutation, { brand: brand }, 'name'));
};

try {
  console.log('Get Ready!');
  // inspectData()
  run();
} catch (e) {
  console.log('Server Error!', e);
}
```

The pagination function implements a two-second delay and a default page size of 50 records. You can pass in a custom page size as a third parameter to the `paginate` function.