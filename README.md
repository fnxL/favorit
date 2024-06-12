# Favorit Backend

- TypeScript
- typescript-eslint and prettier
- Fastify
- File based routing
- Import path aliases
- Input validation using JSON schema with typebox
- Graceful Shutdown
- SQLite w/ Drizzle-ORM
- Config management with convict and dotenv
- Pre-commit git hooks using husky to run lint-staged
- Three layer architecture using service and repository pattern
- Dependency Injection with awilix
- Secure authentication using JWT with accessToken and refreshToken mechanism
- Save user's session in database with more information about device, os, and browser
- API reference docs using swagger openapi and scaler reference docs.
- API testing with bruno collections.



## Features
- Favorit app provides you a central place to archive/collect your bookmarks, notes, highlights and articles in one single place.
- The app is available completely offline as it is selfhosted
- Users can create collections (folders) to organize their bookmarks.
- Users can give tags and attach notes to their bookmarks.
- A background service that will cache bookmark contents locally if possible so that it could be viewed even if the website or the article is down.
- A  chrome extension to capture text highlights, articles, images, videos, tweets, reddit posts, comments, almost everything into the favorit app frictionlessly.
- Then be able to search and organize the captured contents to resurface them easily.