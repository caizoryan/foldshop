# Classes vs Functions

Books as made up of discrete components, so made of contents, grid, pages, spreads, sheets and binding.

Programming in an object oriented way, so to give each of these, (contents, grid, pages...) properties and actions solidifies them as things and establishes them as discrete THINGS. Things as such behave in certain ways and OWN (in a data context) their children. So a Book owns, spreads, sheets, page numbers, etc.

```
book = new Book(spreads, sheets)
book.page = 2
if (printing) book.drawSaddle()
else book.draw()
```

On the other hand programming in a functional paradigm treating (contents, grid, pages...) not as objects but as processes that make them. 


What makes the book a book and not an image?

For instance a book only exists in the software because it can be drawn to the screen, and printed on sheets as imposed. 

(A book is also a book because it is a series of spreads) [ ? ]
(A book jk)
(parameters for what the spread can be) [ ? ]

```
if (printing) drawSaddle(spreads, sheets, 2)
else drawBook(spreads, sheets, 2)

```



On the surface it looks like just a syntactical change. However it alters how elements of the book are percieved. 

Why is this image on the screen a book and not just an image. The fact that this series of images can be 
A book is constituted not by its know properties (sheets, spreads, page number), 
but by processes that validate it's existing (drawing to the screen, printing it out to be bound).


> Note: I could very well replace OBJect oriented and fuctional to not necessarily those terms. I had a mindset shift, and expressed it in this way. However I could very well have also done this in class based language too.
