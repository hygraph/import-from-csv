import {
  pickKey,
  uniqueValues,
  uniqueChars,
  uniqueKey,
  requiredKeys,
  findDuplicates
} from "./utils/inspect";
import { readFile } from "./utils/readCSV";

export const inspectData = async () => {
  const data = await readFile(
    "./data/all_starbucks_locations_in_the_world.csv"
  );

  const collection = {};

  // Check for Brands
  const brands = pickKey("Brand");
  collection.brands = await uniqueValues(brands(data));

  // Get List of Ownership Type Enum
  const ownershipType = pickKey("Ownership Type");
  collection.ownershipEnum = await uniqueValues(ownershipType(data));

  // Get List of unique phone chars
  const phone = pickKey("Phone Number");
  collection.phoneChars = await uniqueChars(phone(data));

  // Check for missing keys
  const checkEmptyLocation = requiredKeys(["Latitude", "Longitude"], "Name");
  collection.missingLocationData = await checkEmptyLocation(data);

  // Check for uniqueness of names.
  const uniqueName = uniqueKey("Name");
  collection.uniqueNames = await uniqueName(data);

  // Data cleansing revealed I had duplicates, this helps find them.
  const findCommonName = findDuplicates("Name");
  const commonNames = await findCommonName(data);
  collection.commonNamesFlat = [...new Set(commonNames)];

  // Looking for Duplicate Lat/Long values
  const uniqueLatitude = uniqueKey("Latitude");
  collection.uniqueLatitudes = await uniqueLatitude(data);

  const uniqueLongitude = uniqueKey("Longitude");
  collection.uniqueLongitudes = await uniqueLongitude(data);

  console.log(collection);
};
