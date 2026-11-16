# Reading List API: C#, .NET and Oracle

Build a small list of books. Add a title, find it, mark it as read, and remove it.

This download is a **separate local backend project**. The learning website stays frontend-only. It does not run this API, connect to Oracle, or collect your database password. There is no login in this sample.

An API is a program that answers requests. This one uses C# and ASP.NET Core. Oracle stores the book rows. The optional browser page sends HTTP requests to the API. Only the API knows the Oracle connection string.

## What you need

- A **64-bit .NET 10 SDK**. An SDK includes the tools that build code. .NET 10 is an LTS release, which means it has a longer support period. Check with `dotnet --list-sdks`. A runtime alone cannot build a project.
- A local Oracle database you are allowed to use. **Oracle AI Database 26ai Free** uses the application database service `FREEPDB1`. Existing Oracle Database 19c or later can also work; ask its administrator for the correct service and permissions. Older 21c XE normally uses `XEPDB1`, so do not copy `FREEPDB1` blindly.
- Oracle SQL*Plus or SQLcl to run the setup scripts. The examples below use `sqlplus`. SQLcl users can use its `sql` command instead.
- A code editor and a terminal. Ask an adult or teacher for help with database installation and administrator steps.

The project targets `net10.0` and pins `Oracle.ManagedDataAccess.Core` to **23.26.400**. The project also pins `System.Security.Cryptography.Pkcs` to `10.0.15` to replace an older vulnerable transitive dependency. This ODP.NET package supports .NET 10 and connects to Oracle Database 19c or later. It does not require a separate Oracle Client install for the API. SQL*Plus/SQLcl are separate tools used for setup.

We do not install or start a database automatically. Oracle is much larger than this little API. Use a suitable existing local installation and follow Oracle's supported operating-system instructions.

## Files to read

```text
ReadingListApi/
  ReadingListApi.csproj        target framework and Oracle package
  Program.cs                  services, error handling, routes and optional CORS
  Models/Book.cs              the book returned to callers
  Models/SaveBookRequest.cs   rules for a new or updated book
  Data/OracleOptions.cs       connection setting held on the server
  Data/BookRepository.cs      parameterized SQL and per-operation connections
  Controllers/BooksController.cs  HTTP endpoints and responses
database/                    one-time local setup scripts
browser-client/              optional static HTML, CSS and JavaScript page
scripts/test-api.ps1         a check that creates and removes its own test book
  set-database-secret.ps1    prompt for a password without putting it in shell history
```

## 1. Create the local practice schema

A schema is a user's collection of database objects. Use a new schema named `reading_app` for this sample. Do not run these scripts against an important shared database.

Open a terminal in the unzipped `dotnet-oracle-backend` folder. Connect to the **application PDB**, not the root database:

```text
sqlplus system@localhost:1521/FREEPDB1
```

SQL*Plus asks for the existing administrator password. Do not put it in a command or a source file. At the `SQL>` prompt, run:

```sql
SHOW CON_NAME;
@database/01-create-user.sql
EXIT;
```

`SHOW CON_NAME` must show `FREEPDB1` for this Oracle Free setup. Stop and reconnect if it shows another database. The script asks for a **new password that you choose** for `reading_app`. Use a password with 12-30 characters containing letters, numbers, `!` or `_` for this exercise. The script's SQL*Plus substitution is not designed for quotation marks or `&` in a password.

The script creates the user, gives a small 10 MB table quota, and grants `CREATE SESSION` and `CREATE TABLE`. It stops on an SQL error. If the user already exists, investigate; do not drop another user's work to make the script pass.

Now connect as the new user. SQL*Plus asks for the new password:

```text
sqlplus reading_app@localhost:1521/FREEPDB1
```

Create the table and two fictional books:

```sql
@database/02-create-table.sql
EXIT;
```

The table is:

```sql
CREATE TABLE reading_list_books (
    id NUMBER(10) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR2(120 CHAR) NOT NULL,
    is_read NUMBER(1) DEFAULT 0 NOT NULL,
    CONSTRAINT reading_books_read_flag CHECK (is_read IN (0, 1))
);
```

- `id` is a whole-number key made by Oracle. Do not send it in an insert. IDs can have gaps; they are not a row count.
- `title` stores up to 120 characters and cannot be empty.
- `is_read` stores `0` for not read and `1` for read. The check constraint rejects other values.
- The seed inserts use `COMMIT` to save their rows. Oracle DDL, such as `CREATE TABLE`, has its own implicit commits; do not treat schema setup as a rollback practice task.

Finally, reconnect as the administrator and remove the setup-only table-creation permission:

```text
sqlplus system@localhost:1521/FREEPDB1
```

```sql
@database/03-remove-setup-permission.sql
EXIT;
```

`reading_app` can still use its table. As its owner, it can also change or drop that existing table. This is a local-learning shortcut. A real deployed service should use a separate runtime user with only the required table permissions.

## 2. Configure the API without putting secrets in code

In a terminal, move into the project:

```text
cd ReadingListApi
dotnet restore
dotnet build
```

The project already has a `UserSecretsId`. From the sample's top folder, run this PowerShell helper:

```powershell
.\scripts\set-database-secret.ps1
```

It asks for the `reading_app` password without showing it on screen. Enter the same 12-30 character password used in the database setup. The helper validates the allowed characters and passes the connection setting to `dotnet user-secrets` through standard input. It does not put the password in command arguments, a source file or typed command history. It finds the project by its own location, so it works regardless of your current folder.

The resulting setting is `ConnectionStrings:Oracle`. It uses `reading_app` and `localhost:1521/FREEPDB1`. If your database uses another service, use the environment-variable option below with the service supplied by its administrator.

User-secrets keep development settings outside the project folder. They are **not encrypted**. The password also exists briefly in process memory. Do not share the secrets file. Never paste a real password into the HTML, JavaScript, README or a Git commit.

Environment variables are another option. For PowerShell, the following example prompts for the whole connection string without echoing it on screen. The process still needs the plain value in memory to connect:

```powershell
$connection = Read-Host 'Oracle connection string' -AsSecureString
$env:ConnectionStrings__Oracle = [System.Net.NetworkCredential]::new('', $connection).Password
dotnet run --launch-profile ReadingListApi
# After stopping the API with Ctrl+C:
Remove-Item Env:ConnectionStrings__Oracle
```

For Bash, read the value without echoing it, then export it:

```bash
read -r -s -p 'Oracle connection string: ' oracle_connection
printf '\n'
export ConnectionStrings__Oracle="$oracle_connection"
unset oracle_connection
dotnet run --launch-profile ReadingListApi
# After stopping the API with Ctrl+C:
unset ConnectionStrings__Oracle
```

The double underscore in `ConnectionStrings__Oracle` means the same setting as the colon in `ConnectionStrings:Oracle`. Environment variables override app settings and user-secrets. Do not accidentally leave an old connection string in your terminal.

## 3. Start the API

If you used user-secrets, run this from `ReadingListApi`:

```text
dotnet run --launch-profile ReadingListApi
```

Keep that terminal open. The launch profile sets `Development` and listens on **http://localhost:5080**. It does not open a browser or start Oracle. If the setting is missing, startup stops with a message asking for `ConnectionStrings:Oracle`.

In a second terminal:

```text
curl http://localhost:5080/health
```

In Windows PowerShell, use `curl.exe` for the real curl program, or:

```powershell
Invoke-RestMethod http://localhost:5080/health
```

The response is:

```json
{ "status": "API is running", "database": "Not checked" }
```

This checks that the API is alive. It **does not check Oracle**. Request `GET /api/books` next to test the database connection and table.

## 4. Understand the endpoints

A book sent back by the API has this shape:

```json
{ "id": 3, "title": "A Trip to the Moon", "isRead": false }
```

Your generated `id` may differ. C# uses a `long` for it. JSON uses a number. The create and update body contains only `title` and `isRead`:

```json
{ "title": "A Trip to the Moon", "isRead": false }
```

| Request                  | Successful response                          | Other expected result             |
| ------------------------ | -------------------------------------------- | --------------------------------- |
| `GET /health`            | `200`, API-only liveness information         | Does not use Oracle               |
| `GET /api/books`         | `200`, an array ordered by ID; `[]` if empty | `500` if database work fails      |
| `GET /api/books/{id}`    | `200`, one book                              | `404` if the ID is absent         |
| `POST /api/books`        | `201`, saved book and `Location` header      | `400` for an invalid body         |
| `PUT /api/books/{id}`    | `204`, no response body                      | `404` if absent; `400` if invalid |
| `DELETE /api/books/{id}` | `204`, no response body                      | `404` if absent                   |

Use a positive whole-number ID. Zero and negative IDs get `400`. A path that is not a `long` number, such as `/api/books/abc`, does not match the route and gets `404`. A book title must contain 1–120 characters and cannot be only spaces. Valid titles are trimmed before storage. `isRead` must be a JSON boolean if supplied; leaving it out means `false`.

`[ApiController]` turns validation and JSON binding errors into HTTP `400` responses. `SaveBookRequest` uses `[Required]` and `[StringLength]`. These rules run on the API even when a caller skips the browser page. HTTP `204` has no JSON body, so do not try to parse one.

## 5. Try all operations with PowerShell

Run these commands in a second PowerShell terminal while the API and Oracle are running. This sequence only edits and deletes the book it creates:

```powershell
$api = 'http://localhost:5080/api/books'
Invoke-RestMethod $api

$body = @{ title = 'A Trip to the Moon'; isRead = $false } | ConvertTo-Json
$book = Invoke-RestMethod $api -Method Post -ContentType 'application/json' -Body $body
$book
Invoke-RestMethod "$api/$($book.id)"

$update = @{ title = 'A Trip to the Moon'; isRead = $true } | ConvertTo-Json
Invoke-RestMethod "$api/$($book.id)" -Method Put -ContentType 'application/json' -Body $update
Invoke-RestMethod "$api/$($book.id)"

Invoke-RestMethod "$api/$($book.id)" -Method Delete
Invoke-RestMethod $api
```

To see a validation failure, post `{ "title": "", "isRead": false }`. PowerShell reports an HTTP error because `400` is not a successful status. This is expected; fix the input and try again.

For a repeatable status-code check, use the included script from the sample's top folder:

```powershell
.\scripts\test-api.ps1
```

Read the script first. It creates a uniquely named fictional book, checks list/read/update/delete and invalid input, and removes only the ID it created. It requires a working Oracle connection. If a network problem interrupts a write, inspect the list before repeating the write; a request can commit even if its response is lost.

## 6. Try the same operations with curl in Bash

These commands use Bash quoting. Windows PowerShell users should use the PowerShell section above.

```bash
curl -i http://localhost:5080/api/books

curl -i -X POST http://localhost:5080/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"A Trip to the Moon","isRead":false}'
```

Read the `id` in the POST response, then enter **that new ID** at this prompt:

```bash
read -r -p 'ID returned by your POST: ' book_id
curl -i "http://localhost:5080/api/books/$book_id"

curl -i -X PUT "http://localhost:5080/api/books/$book_id" \
  -H 'Content-Type: application/json' \
  -d '{"title":"A Trip to the Moon","isRead":true}'
curl -i "http://localhost:5080/api/books/$book_id"

curl -i -X DELETE "http://localhost:5080/api/books/$book_id"
curl -i "http://localhost:5080/api/books/$book_id"
# The last request should be 404 because your test book was removed.
```

Check invalid data without changing a book:

```bash
curl -i -X POST http://localhost:5080/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"","isRead":false}'
# Expected: HTTP 400.
```

## 7. Open the optional browser page

The browser page lists and adds books. The API also supports update and delete, which the terminal examples exercise. This little page does not try to be a complete library management app.

In the `ReadingListApi` folder, enable the local development origin:

```text
dotnet user-secrets set "Development:CorsEnabled" "true"
```

Restart the API. This CORS setting works **only in Development**. It permits the exact origin `http://localhost:5500` and does not permit arbitrary websites. CORS is a browser rule; it is not authentication and cannot protect a public API from other kinds of clients.

From the sample's top folder, use a local static server. If Python 3 is already installed:

```text
python -m http.server 5500 --bind 127.0.0.1 --directory browser-client
```

On some systems the command is `python3`. You can instead use an editor's static preview server configured for the same port. Open **http://localhost:5500**. Opening the file with `file://`, using port 5501, or visiting `http://127.0.0.1:5500` gives a different origin and will not match this CORS policy.

The page uses `fetch`, sends JSON, checks HTTP status, and writes titles with `textContent`. It never sees a database password. Do not add a connection string to `app.js`. Stop the static server and API with Ctrl+C when finished.

## What keeps the SQL separate from the data

`BookRepository` uses fixed SQL with named placeholders such as `:title` and `:id`. It sets `BindByName = true` and supplies typed parameters. A title containing an apostrophe stays data; it does not become part of the SQL command.

Each operation opens its own `OracleConnection` and disposes it with `await using`. Commands and readers are disposed too. The provider may reuse an underlying connection from its connection pool. We do not share one open connection between requests.

Create, update and delete start an explicit transaction. A transaction groups database work until a final decision. `CommitAsync` saves the change. If an exception happens before commit, disposing the uncommitted transaction rolls it back. No table creation or automatic reset runs when the API starts.

The controller receives a `CancellationToken` for the HTTP request and passes it into database operations. Cancelling a request asks the operation to stop; it cannot undo a transaction that has already committed. Use the list/read endpoint to inspect the result if a write response was lost. Identity IDs can be skipped after rollbacks.

## Troubleshooting

| What you see                                   | What to check                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Startup says to set `ConnectionStrings:Oracle` | Run `scripts/set-database-secret.ps1`, use the Development launch profile, and check for an overriding environment variable.   |
| `/health` works but `/api/books` fails         | Health does not test Oracle. Check the database listener, service, user, password and table. Read the API terminal error.      |
| `ORA-12514` or a connection refusal            | Verify Oracle is running and the application service is correct. `FREEPDB1` and `XEPDB1` are not interchangeable names.        |
| `ORA-01017`                                    | Recheck the practice user and password. Do not paste the password into an issue or screenshot.                                 |
| `ORA-00942`                                    | Connect as `reading_app` to the same PDB and check that `reading_list_books` exists.                                           |
| POST gives `400`                               | Check `title`, its length, and the JSON boolean `isRead`.                                                                      |
| POST or PUT gives `415`                        | Send `Content-Type: application/json`.                                                                                         |
| The browser says `Failed to fetch`             | Check API/database errors and the exact Development CORS origin. A terminal request working does not prove CORS is configured. |
| Port 5080 or 5500 is busy                      | Stop the other local process or deliberately change the matching API/client/CORS settings.                                     |

## Limits before a real deployment

This is a learning sample on localhost. It has no login, authorization, pagination, rate limit, conflict detection, automated migration system or backup plan. Any client that can reach it can edit its books. Updates use last-write-wins behaviour: a later update can replace an earlier one.

Before exposing any version to a network, make deliberate choices about HTTPS, identities and permissions, request limits, database runtime grants, secret storage, monitoring, testing, backups and concurrent edits. Choose a supported deployment design with an experienced person. Development CORS is not that design.

List returns all rows, which suits a tiny practice table. The ID column holds at most ten digits. The API's string-length check counts .NET UTF-16 code units, so some emoji use more than one unit. The database uses character length semantics. Keep titles simple while learning these basics.

The repository was compiled against the pinned package. A real Oracle database was not available in the authoring environment, so full CRUD and transaction integration against Oracle were **not run there**. Run `scripts/test-api.ps1` with your local database to verify your setup. An API-only health or validation check cannot replace that database test.

## Official reading

- [.NET 10 support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)
- [ASP.NET Core Web API tutorial](https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-web-api?view=aspnetcore-10.0)
- [.NET development secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-10.0)
- [ASP.NET Core CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-10.0)
- [Oracle ODP.NET requirements](https://docs.oracle.com/en/database/oracle/oracle-database/26/odpnt/InstallSystemRequirements.html)
- [Pinned ODP.NET NuGet package](https://www.nuget.org/packages/Oracle.ManagedDataAccess.Core/23.26.400)
- [Connect to Oracle Free](https://docs.oracle.com/en/database/oracle/oracle-database/26/xeinw/connecting-oracle-database-xe.html)
