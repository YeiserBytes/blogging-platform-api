import { Hono } from 'hono'
import { post } from './router/post'

const app = new Hono()

app.route('/api', post)

export default {
  port: 3000,
  fetch: app.fetch
}
