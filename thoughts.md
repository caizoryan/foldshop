Make the array lang parseable?

```
(let f (map (i (range 24))
	({} 
	  (x (* i width))
	  (y 50)
	  (w width)
	  (h 100))))
```
Map position, dimensions into an array, name it f

``` 
(map (prop f) (Rect prop))
```
Then map the array of properties to Rect obj to make it drawable...

So... now we have props, and the rects that are made from the props...
So we can take 
