import { Hono } from "hono";
import { PostModel } from "../models/post";
import { Op } from "sequelize";
import { PostSchema } from "../models/post";

const post = new Hono();

// GET /posts
post.get('/posts', async (ctx) => {
  try {
    const posts = await PostModel.findAll();
    return ctx.json(posts, 200);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ error: error.message }, 500);
    }
    return ctx.json({ error: "An unknown error occurred" }, 500);
  }
});

// GET /post/:id
post.get("/post/:id", async (ctx) => {
  const { id } = ctx.req.param();

  try {
    const post = await PostModel.findByPk(id);
    if (!post) {
      return ctx.json({ error: "Post not found" }, 404);
    }
    return ctx.json(post, 200);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ error: error.message }, 500);
    }
    return ctx.json({ error: "An unknown error occurred" }, 500);
  }
});

// POST /post
post.post("/post", async (ctx) => {
  try {
    let { title, content, category, tags } = await ctx.req.json();

    if (!title || !content || !category || !tags) {
      return ctx.json({ error: "All fields are required" }, 400);
    }

    category = category.toLowerCase();
    tags = tags.map((tag: string) => tag.toLowerCase());

    const newPost = await PostModel.create({ title, content, category, tags });
    return ctx.json(newPost, 201);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ error: error.message }, 500);
    }
    return ctx.json({ error: "An unknown error occurred" }, 500);
  }
});

// DELETE /post/:id
post.delete("/post/:id", async (ctx) => {
  const { id } = ctx.req.param();

  try {
    const post = await PostModel.findByPk(id);
    if (!post) {
      return ctx.json({ error: "Post not found" }, 404);
    }

    await post.destroy();
    return ctx.json({ message: "Post deleted successfully" }, 200);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ error: error.message }, 500);
    }
    return ctx.json({ error: "An unknown error occurred" }, 500);
  }
});

// PUT /post/:id
post.put("/post/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const { title, content, category, tags } = await ctx.req.json();

  try {
    const post = await PostModel.findByPk(id);
    if (!post) {
      return ctx.json({ error: "Post not found" }, 404);
    }

    const updatedPost = await post.update({
      title,
      content,
      category: category.toLowerCase(),
      tags: tags.map((tag: string) => tag.toLowerCase())
    });

    return ctx.json(updatedPost, 200);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ error: error.message }, 500);
    }
    return ctx.json({ error: "An unknown error occurred" }, 500);
  }
});

// GET /post?term=[category, tags, date, title, idRange]&value=[value]
post.get("/filter", async (ctx) => {
  const { term, value } = ctx.req.query();

  if (!term || !value) {
    return ctx.json({ error: "Please provide both search term and value" }, 400);
  }

  const filter: { [key: string]: unknown } = {};

  switch (term.toLowerCase()) {
    case "category":
      filter.category = value.toLowerCase();
      break;
    case "tags":
      filter.tags = { [Op.contains]: [value.toLowerCase()] };
      break;
    case "date":
      filter.createdAt = value;
      break;
    case "title":
      filter.title = { [Op.iLike]: `%${value}%` };
      break;
    case "ids": {
      const [start, end] = value.split(',').map(Number);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return ctx.json({ error: "Invalid id range" }, 400);
      }
      filter.id = { [Op.between]: [start, end] };
      break;
    }
    default:
      return ctx.json({ error: "Invalid search term" }, 400);
  }

  try {
    const posts = await PostModel.findAll({ where: filter });
    return ctx.json(posts, 200);
  } catch (error) {
    if (error instanceof Error) {
      return ctx.json({ error: error.message }, 500);
    }
    return ctx.json({ error: "An unknown error occurred" }, 500);
  }
});

export { post }
