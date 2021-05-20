# gmacario.github.io

[![CircleCI](https://circleci.com/gh/gmacario/gmacario.github.io.svg?style=shield)](https://circleci.com/gh/gmacario/gmacario.github.io)

Gianpaolo Macario public website on GitHub.com.

Automatically published to <https://gmacario.github.io/>

## How this site was made

The blog is based on the [Next.js](https://nextjs.org/) framework as explained in
<https://css-tricks.com/building-a-blog-with-next-js/>

Blog posts are created under the `_posts` folder and get compiled to a static website
using the commands detailed below.

### Prerequisites

Install Node.js 14.x from <https://nodejs.org/>

To install the dependencies simply run

```sh
npm install
```

### Test the code

To test the code locally, run the npm script

```sh
npm run dev
```

and follow the instructions.

### Deploy the blog

To create an optimized production build run the following commands:

```sh
npm run build
npm run start
```

### Generate static files

To generate static files under `_static`:

```sh
npm run export
```

---

## Copyright and license

Copyright 2006-2021 [Gianpaolo Macario](https://gmacario.github.io/).

The contents of this repository are subject to the [MIT License](LICENSE),
with the exception of the `_posts` and `_drafts` folders which are licensed as CC BY-SA (Attribution-ShareAlike)
as detailed in <https://creativecommons.org/licenses/>.

<!-- EOF -->