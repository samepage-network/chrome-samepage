module.exports = {
  include: [
    "index.html",
    "logo.png",
    "node_modules/samepage/samepage.css",
    "manifest.json",
  ],
  finish: "scripts/finish.js",
  entry: ["background.ts", "content.ts"],
};
