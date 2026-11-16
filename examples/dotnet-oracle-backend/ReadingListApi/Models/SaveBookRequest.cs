using System.ComponentModel.DataAnnotations;

namespace ReadingListApi.Models;

public sealed class SaveBookRequest
{
  [Required(ErrorMessage = "Give the book a title.")]
  [StringLength(120, MinimumLength = 1,
      ErrorMessage = "The title must contain between 1 and 120 characters.")]
  public string Title { get; init; } = "";

  // Omitted isRead means false. Invalid JSON such as isRead: "yes" receives HTTP 400.
  public bool IsRead { get; init; }
}

