"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(query = {}) {
    let suportedquerys = ["minEmployees", "maxEmployees", "name"];
    let queryskeys = Object.keys(query || {});
    let amountofpassedquerys = queryskeys.length;
    let valuesbind = []; //here we are storing values for injection
    let whereCases = []; // storing possible wherecases
    let queryStringtoInject = ""; // storing generated query string
    //this function will be invoked for every query key
    function generateWhereCondition(key) {
      if (key == "minEmployees") {
        whereCases.push(`num_employees >= $${valuesbind.length}`);
      }

      if (key == "maxEmployees") {
        whereCases.push(`num_employees <= $${valuesbind.length}`);
      }

      if (key == "name") {
        //if key is name we need to add like syntax
        let name = valuesbind.pop();
        valuesbind.push(`%${name}%`);
        whereCases.push(`name LIKE $${valuesbind.length}`);
      }

      if (whereCases.length > 0) {
        //agrivate all values in one string
        queryStringtoInject = " WHERE " + whereCases.join(" AND ");
      }
    }
    queryskeys.forEach((key) => {
      if (suportedquerys.includes(key)) {
        amountofpassedquerys--; //if key matches its decrimented to this value
        // if we have correct key, it means we will have a whereCase and we need to construct it
        if (!whereCases) {
          whereCases = "WHERE ";
        }
        valuesbind.push(query[key]);
        generateWhereCondition(key);
      }
    });
    //if we still have keys in query it means they are not supported
    if (amountofpassedquerys > 0) {
      throw new BadRequestError("not suported query");
    }
    if (query.minEmployees > query.maxEmployees) {
      throw new BadRequestError("Min employees cannot be greater than max");
    }

    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies 
           ${queryStringtoInject}
           ORDER BY name`,
      valuesbind
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
