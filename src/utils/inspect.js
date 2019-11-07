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
        (prev, curr) => [...prev, ...curr[firstKey(curr)].split("")],
        []
      )
    )
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
    )
  ];
};

/*
Checks to see if there are duplicates, boolean response.
*/
export const uniqueKey = key => async data => {
  const newLength = [
    ...new Set(pickKey(key)(data).map(obj => obj[firstKey(obj)]))
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
