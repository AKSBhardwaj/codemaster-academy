using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using ReadingListApi.Data;
using ReadingListApi.Models;

namespace ReadingListApi.Controllers;

[ApiController]
[Route("api/books")]
public sealed class BooksController(BookRepository books) : ControllerBase
{
  [HttpGet]
  public async Task<ActionResult<IReadOnlyList<Book>>> List(CancellationToken cancellationToken)
      => Ok(await books.ListAsync(cancellationToken));

  [HttpGet("{id:long}")]
  public async Task<ActionResult<Book>> Get(
      [Range(1, long.MaxValue, ErrorMessage = "Use a positive book id.")] long id,
      CancellationToken cancellationToken)
  {
    var book = await books.FindAsync(id, cancellationToken);
    return book is null ? NotFound() : Ok(book);
  }

  [HttpPost]
  public async Task<ActionResult<Book>> Create(SaveBookRequest request,
      CancellationToken cancellationToken)
  {
    var book = await books.CreateAsync(request, cancellationToken);
    return CreatedAtAction(nameof(Get), new { id = book.Id }, book);
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> Update(
      [Range(1, long.MaxValue, ErrorMessage = "Use a positive book id.")] long id,
      SaveBookRequest request, CancellationToken cancellationToken)
      => await books.UpdateAsync(id, request, cancellationToken) ? NoContent() : NotFound();

  [HttpDelete("{id:long}")]
  public async Task<IActionResult> Delete(
      [Range(1, long.MaxValue, ErrorMessage = "Use a positive book id.")] long id,
      CancellationToken cancellationToken)
      => await books.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
}

