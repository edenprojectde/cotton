import { OrderBy, WhereOperators } from "./types.ts";
import { validWhereOperations } from "./constants.ts";

/**
 * WHERE clause informations
 */
interface WhereBinding {
  fieldName: string;
  operator: WhereOperators;
  value: any;
}

/**
 * ORDER BY clause informations
 */
interface OrderBinding {
  fieldName: string;
  order: OrderBy;
}

export class QueryBuilder {
  /**
   * Table columns that are going to be fetched
   */
  private columns: string[] = [];

  /**
   * The where constraints of the query
   */
  private wheres: WhereBinding[] = [];

  /**
   * The orderings for the query. 
   */
  private orders: OrderBinding[] = [];

  /**
   * The maximum number of records to return
   */
  private queryLimit?: number;

  /**
   * The number of records to skip
   */
  private queryOffset?: number;

  /**
   * The table which the query is targeting
   */
  private tableName: string;

  // --------------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------------

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // --------------------------------------------------------------------------------
  // PUBLIC QUERY METHODS
  // --------------------------------------------------------------------------------

  /**
   * Add basic where clause to query
   */
  public where(fieldName: string, value: any): QueryBuilder;
  public where(
    fieldName: string,
    operator: WhereOperators,
    value: any,
  ): QueryBuilder;
  public where(
    fieldName: string,
    operator: WhereOperators,
    value?: any,
  ): QueryBuilder {
    if (typeof value === "undefined") {
      this.addWhereClause(fieldName, "=", operator);
    } else {
      if (!validWhereOperations.includes(operator)) {
        throw new Error("Invalid operation!");
      } else {
        this.addWhereClause(fieldName, operator, value);
      }
    }

    return this;
  }

  public select(fieldName: string | string[]): QueryBuilder {
    // If the `fieldName` parameter is an array of string, merge the content
    // with `this.columns` without any duplicate.
    if (Array.isArray(fieldName)) {
      fieldName.forEach((item) => {
        if (!this.columns.includes(item)) {
          this.columns.push(item);
        }
      });
    }

    // If the `fieldName` is string, add field to `this.columns` if it
    // doesn't exist yet
    if (typeof fieldName === "string" && !this.columns.includes(fieldName)) {
      this.columns.push(fieldName);
    }

    return this;
  }

  /**
   * Set the "limit" value for the query.
   * 
   * @param limit maximum number of records
   */
  public limit(limit: number): QueryBuilder {
    if (limit >= 0) {
      this.queryLimit = limit;
    }

    return this;
  }

  /**
   * Set the "offset" value for the query.
   * 
   * @param offset numbers of records to skip
   */
  public offset(offset: number): QueryBuilder {
    if (offset > 0) {
      this.queryOffset = offset;
    }
    return this;
  }

  /**
   * Get the first record of the query, shortcut for `take(1)`
   */
  public first(): QueryBuilder {
    return this.limit(1);
  }

  /**
   * Generate executable SQL query string
   */
  public toSQL(): string {
    // Initial query
    let query: string[] = [`SELECT * FROM ${this.tableName}`];

    // Add where clauses if exists
    if (this.wheres.length > 0) {
      for (let index = 0; index < this.wheres.length; index++) {
        const whereClause = this.wheres[index];

        if (index === 0) { // The first where clause should have `WHERE` explicitly
          query.push(
            `WHERE ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
          );
        } else { // The rest of them use `AND`
          query.push(
            `AND ${whereClause.fieldName} ${whereClause.operator} ${whereClause.value}`,
          );
        }
      }
    }

    // Add query limit if exists
    if (this.queryLimit && this.queryLimit > 0) {
      query.push(`LIMIT ${this.queryLimit}`);
    }

    // Add query offset if exists
    if (this.queryOffset && this.queryOffset > 0) {
      query.push(`OFFSET ${this.queryOffset}`);
    }

    return query.join(" ") + ";";
  }

  // --------------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------------

  /**
   * Add new where clause to query
   */
  private addWhereClause(
    fieldName: string,
    operator: WhereOperators,
    value: any,
  ) {
    let cleanedValue: string = "";

    if (typeof value === "string") {
      // TODO: Sanitize value to prevent SQL injection
      cleanedValue = `'${value}'`;
    }

    if (typeof value === "boolean") {
      cleanedValue = value ? "1" : "0";
    }

    if (typeof value === "number") {
      cleanedValue = value.toString();
    }

    this.wheres.push({ fieldName, operator, value: cleanedValue });
  }
}