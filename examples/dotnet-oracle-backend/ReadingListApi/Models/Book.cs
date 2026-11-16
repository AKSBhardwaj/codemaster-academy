namespace ReadingListApi.Models;

// ASP.NET Core sends these names as id, title and isRead in JSON.
public sealed record Book(long Id, string Title, bool IsRead);

