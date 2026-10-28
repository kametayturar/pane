# Security

Pane is a library of front-end components; it has no server, accounts or data of its own. The live site is a static
build.

## Reporting a problem

If you find something that could hurt people who use Pane – for example a piece that runs untrusted input as HTML, an
installer (`public/add.mjs`) behaviour that writes outside the project, or a dependency with a known vulnerability –
please open a private report through GitHub's **Security → Report a vulnerability** tab on this repo rather than a public
issue. You'll get an answer within a few days.

## What the installer does

`add.mjs` downloads `https://pane.vercel.app/r/<name>.json`, writes the listed files into your project's `src/`
(skipping existing files unless you pass `--force`), creates `lib/utils.ts` if a piece needs it, and prints any npm
packages to install. It never runs the code it downloads and never installs packages itself. Read it first – it is short.
