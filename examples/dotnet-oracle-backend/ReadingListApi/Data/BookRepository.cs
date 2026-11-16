using System.Data;
using Microsoft.Extensions.Options;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
using ReadingListApi.Models;

namespace ReadingListApi.Data;

public sealed class BookRepository(IOptions<OracleOptions> options)
{
  private readonly string _connectionString = options.Value.ConnectionString;

  public async Task<IReadOnlyList<Book>> ListAsync(CancellationToken cancellationToken)
  {
    // Each operation opens and disposes its own connection. ODP.NET can pool connections.
    await using var connection = new OracleConnection(_connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = connection.CreateCommand();
    command.BindByName = true;
    command.CommandText = "SELECT id, title, is_read FROM reading_list_books ORDER BY id";
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    var books = new List<Book>();
    while (await reader.ReadAsync(cancellationToken))
    {
      books.Add(new Book(reader.GetInt64(0), reader.GetString(1), reader.GetInt32(2) == 1));
    }
    return books;
  }

  public async Task<Book?> FindAsync(long id, CancellationToken cancellationToken)
  {
    await using var connection = new OracleConnection(_connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var command = connection.CreateCommand();
    command.BindByName = true;
    command.CommandText = "SELECT id, title, is_read FROM reading_list_books WHERE id = :id";
    command.Parameters.Add("id", OracleDbType.Int64).Value = id;
    await using var reader = await command.ExecuteReaderAsync(cancellationToken);
    if (!await reader.ReadAsync(cancellationToken)) return null;
    return new Book(reader.GetInt64(0), reader.GetString(1), reader.GetInt32(2) == 1);
  }

  public async Task<Book> CreateAsync(SaveBookRequest request, CancellationToken cancellationToken)
  {
    await using var connection = new OracleConnection(_connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
    await using var command = connection.CreateCommand();
    command.Transaction = (OracleTransaction)transaction;
    command.BindByName = true;
    command.CommandText = """
            INSERT INTO reading_list_books (title, is_read)
            VALUES (:title, :is_read)
            RETURNING id INTO :new_id
            """;
    var title = request.Title.Trim();
    command.Parameters.Add("title", OracleDbType.Varchar2, 120).Value = title;
    command.Parameters.Add("is_read", OracleDbType.Int32).Value = request.IsRead ? 1 : 0;
    var newId = command.Parameters.Add("new_id", OracleDbType.Int64);
    newId.Direction = ParameterDirection.Output;
    await command.ExecuteNonQueryAsync(cancellationToken);
    // Oracle returns a NUMBER as OracleDecimal. The table limits it to ten digits.
    var id = ((OracleDecimal)newId.Value).ToInt64();
    await transaction.CommitAsync(cancellationToken);
    return new Book(id, title, request.IsRead);
    // If an operation throws before commit, disposing the uncommitted transaction rolls it back.
  }

  public async Task<bool> UpdateAsync(long id, SaveBookRequest request,
      CancellationToken cancellationToken)
  {
    await using var connection = new OracleConnection(_connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
    await using var command = connection.CreateCommand();
    command.Transaction = (OracleTransaction)transaction;
    command.BindByName = true;
    command.CommandText = """
            UPDATE reading_list_books
            SET title = :title, is_read = :is_read
            WHERE id = :id
            """;
    command.Parameters.Add("title", OracleDbType.Varchar2, 120).Value = request.Title.Trim();
    command.Parameters.Add("is_read", OracleDbType.Int32).Value = request.IsRead ? 1 : 0;
    command.Parameters.Add("id", OracleDbType.Int64).Value = id;
    var changed = await command.ExecuteNonQueryAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
    return changed == 1;
  }

  public async Task<bool> DeleteAsync(long id, CancellationToken cancellationToken)
  {
    await using var connection = new OracleConnection(_connectionString);
    await connection.OpenAsync(cancellationToken);
    await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
    await using var command = connection.CreateCommand();
    command.Transaction = (OracleTransaction)transaction;
    command.BindByName = true;
    command.CommandText = "DELETE FROM reading_list_books WHERE id = :id";
    command.Parameters.Add("id", OracleDbType.Int64).Value = id;
    var changed = await command.ExecuteNonQueryAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
    return changed == 1;
  }
}

