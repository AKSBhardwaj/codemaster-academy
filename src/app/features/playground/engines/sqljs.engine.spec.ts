import { splitSqlStatements } from './sqljs.engine';

describe('splitSqlStatements', () => {
  it('splits on semicolons and trims', () => {
    expect(splitSqlStatements('SELECT 1;\n SELECT 2; ')).toEqual(['SELECT 1', 'SELECT 2']);
  });

  it('ignores semicolons inside quotes and comments', () => {
    expect(splitSqlStatements("INSERT INTO t VALUES ('a;b'); -- comment; here\nSELECT 1 /* ; */;")).toEqual([
      "INSERT INTO t VALUES ('a;b')",
      'SELECT 1',
    ]);
  });

  it('returns the trailing statement without a semicolon', () => {
    expect(splitSqlStatements('SELECT * FROM products')).toEqual(['SELECT * FROM products']);
  });
});
