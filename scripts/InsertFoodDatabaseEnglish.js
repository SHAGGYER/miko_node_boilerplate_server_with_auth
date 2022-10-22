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
    path.join(__dirname, "..", "data/Frida20190802env3.xlsx")
  );
  var sheet_name_list = workbook.SheetNames;
  var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]);

  /* await Food.insertMany(
    
  );
 */

  const transformedFoodsEnglish = xlDataEnglish
    .filter((x, i) => i > 0)
    .map((x) => {
      return {
        name: x.__EMPTY_2,
        group: x.__EMPTY_1,
        kcal: x["Energy, kcal"] === "nv" ? undefined : x["Energy, kcal"],
        protein:
          x["Protein, videnskabelig"] === "nv"
            ? undefined
            : x["Protein, videnskabelig"],
        carbs:
          x["Carbohydrate, declaration"] === "nv"
            ? undefined
            : x["Carbohydrate, declaration"],
        sugars: x["Added sugar"] === "nv" ? undefined : x["Added sugar"],
        fibers: x["Dietary fiber"] === "nv" ? undefined : x["Dietary fiber"],
        fats: x["Fat, total"] === "nv" ? undefined : x["Fat, total"],
      };
    });

  await Food.insertMany(transformedFoodsEnglish);
  console.log(`Inserted ${xlData.length} foods`);
  process.exit(0);
};

run();
