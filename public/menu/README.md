Local menu images

Place images under these folders so the app loads them locally (and sorts by number):

- menu/taverna/<category-slug>/*.webp|.jpg|.png
- menu/bar/<category-slug>/*.webp|.jpg|.png
- menu/sushi/<category-slug>/*.webp|.jpg|.png
- menu/sushi-restaurant/<category-slug>/*.webp|.jpg|.png
- menu/sushi-restaurant-sushi/<category-slug>/*.webp|.jpg|.png

Category slug rules:
- lowercased; spaces become "-" (e.g., "Paste și Pizza" -> "paste-și-pizza")
- keep diacritics; non-alphanumeric becomes "-"

Ordering:
- images are ordered by the first number in the filename (1, 2, 10).

