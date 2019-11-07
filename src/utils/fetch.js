require("dotenv").config();
import axios from "axios";
import { pickQuery } from "./pickQuery";

const API = (stage = "master") =>
  `https://api-euwest.graphcms.com/v1/${process.env.PROJECT_ID}/${stage}`;
const PROJECT_API = API("master");

// Builds generic AXIOS utils.
const axiosCreate = (url, key) =>
  axios.create({
    baseURL: url,
    headers: {
      Authorization: `Bearer ${process.env[key]}`,
      "Content-Type": "application/json"
    }
  });

// Builds the data importer we need for mutating content into GraphCMS.
const importAxios = axiosCreate(PROJECT_API, "MUTATION_ENABLED_PAT");

// A method to assist paginating our data with a rate-limiting assist.
const uploadMutation = (query, variables, diagnosticKey) => async data => {
  await new Promise(resolve => {
    setTimeout(resolve, 2000);
  });

  const response = await importAxios({
    method: "POST",
    url: "",
    data: {
      query: pickQuery(query),
      variables: { ...variables, ...{ data: data } }
    }
  });

  if (response.data.errors) {
    console.log("Error with ", response.data.errors);
    if (diagnosticKey)
      console.log("Error Entries ", data.map(obj => obj[diagnosticKey]));
  } else {
    console.log("Upserted ", response.data);
  }
};

export { importAxios, uploadMutation };
