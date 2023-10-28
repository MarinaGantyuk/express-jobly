const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //jsTosql represents how sql colums look like. {firstname:"first_name"}
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  // we need to prepare sql syntax form list of values what we are going to set.
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  //if no key in jsToSql then we asume the key from data is our column name.
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "), //'"first_name"=$1, "age"=$2'
    values: Object.values(dataToUpdate), //["Aliya", 32]
  };
}

module.exports = { sqlForPartialUpdate };
