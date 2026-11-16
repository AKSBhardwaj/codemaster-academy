using ReadingListApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<BookRepository>();
builder.Services.AddOptions<OracleOptions>()
    .Configure(options =>
        options.ConnectionString = builder.Configuration.GetConnectionString("Oracle") ?? "")
    .Validate(options => !string.IsNullOrWhiteSpace(options.ConnectionString),
        "Set ConnectionStrings:Oracle with .NET user-secrets or ConnectionStrings__Oracle.")
    .ValidateOnStart();

// The browser demo is optional. CORS allows a browser origin; it is not a login system.
var allowLocalBrowser = builder.Environment.IsDevelopment()
    && builder.Configuration.GetValue<bool>("Development:CorsEnabled");
if (allowLocalBrowser)
{
  builder.Services.AddCors(options => options.AddPolicy("LocalBrowser", policy => policy
      .WithOrigins("http://localhost:5500")
      .WithMethods("GET", "POST", "PUT", "DELETE")
      .WithHeaders("Content-Type")));
}

var app = builder.Build();

// Send a general error to clients. Keep database details out of HTTP responses.
app.UseExceptionHandler();
if (allowLocalBrowser)
{
  app.UseCors("LocalBrowser");
}

// This is an API liveness check. It deliberately does not claim that Oracle is connected.
app.MapGet("/health", () => Results.Ok(new
{
  status = "API is running",
  database = "Not checked"
}));
app.MapControllers();
app.Run();

