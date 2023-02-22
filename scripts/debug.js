const dotenv = require("dotenv");
const NotionClient = require("@notionhq/client").Client;
dotenv.config();

const notion = new NotionClient({
  auth: process.env.NOTION_INTEGRATION_TOKEN,
});
notion.blocks.children
  .list({ 
  block_id: "94a8458d-b384-43ea-9af1-898c7508a53a",
    // block_id: "f235d5dc343d465a8515ef126c2eada1" 
  })
  .then(console.log);
