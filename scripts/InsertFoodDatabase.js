const XLSX = require("xlsx");
const path = require("path");
const mongoose = require("mongoose");
const { config } = require("dotenv");
const Food = require("../models/Food");

config({
  path: path.join(__dirname, "..", ".env"),
});

const run = async () => {
  mongoose.connect(process.env.MONGODB_URI, () =>
    console.log("Connected to MongoDB")
  );

  const workbook = XLSX.readFile(
    path.join(__dirname, "..", "data/Frida20190802dav3.xlsx")
  );
  var sheet_name_list = workbook.SheetNames;
  var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]);

  /* await Food.insertMany(
    
  );
 */

  const transformedFoods = xlData
    .filter((x, i) => i > 0)
    .map((x) => {
      return {
        name: x.__EMPTY_2,
        group: x.__EMPTY_1,
        kcal: x["Energi, kcal"] === "iv" ? undefined : x["Energi, kcal"],
        protein:
          x["Protein, videnskabelig"] === "iv"
            ? undefined
            : x["Protein, videnskabelig"],
        carbs:
          x["Kulhydrat, deklaration"] === "iv"
            ? undefined
            : x["Kulhydrat, deklaration"],
        sugars: x["Tilsat sukker"] === "iv" ? undefined : x["Tilsat sukker"],
        fibers: x["Kostfibre"] === "iv" ? undefined : x["Kostfibre"],
        fats: x["Fedt, total"] === "iv" ? undefined : x["Fedt, total"],
      };
    });

  await Food.insertMany(transformedFoods);
  console.log(`Inserted ${xlData.length} foods`);
  process.exit(0);
};

run();
