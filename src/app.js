import { uploadMutation } from "./utils/fetch.js";
import { readFile } from "./utils/readCSV";
import { inspectData } from "./inspectData";
import { paginate } from "./utils/paginate";
import { transform } from "./transforms/coffeetype";

import mutation from "./mutations/batchImportCoffeeShop.graphql";

const run = async () => {
  const data = await readFile(
    "./data/all_starbucks_locations_in_the_world.csv"
  );

  const brand = "Coffee House Holdings";
  const filteredData = data.filter(el => el.Brand === brand);
  const transformedData = transform(filteredData);

  paginate(transformedData, uploadMutation(mutation, { brand: brand }, "name"));
};

try {
  console.log("Get Ready!");
  // inspectData()
  run();
} catch (e) {
  console.log("Server Error!", e);
}
