import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'

const app = new Hono()

// Enable CORS for all routes (prototype phase)
app.use('*', cors())

const inquirySchema = z.object({
  solutionId: z.string().optional(),
  companyName: z.string().min(1, "会社名は必須です"),
  departmentName: z.string().optional(),
  contactName: z.string().min(1, "氏名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().min(1, "電話番号は必須です").regex(/^[0-9-]+$/, "電話番号の形式が正しくありません"),
  remarks: z.string().optional()
})

app.post('/api/inquiries', async (c) => {
  try {
    const body = await c.req.json()
    const result = inquirySchema.safeParse(body)
    
    if (!result.success) {
      return c.json({ success: false, errors: result.error.format() }, 400)
    }

    const data = result.data

    // -------------------------------------------------------------
    // [PROTOTYPE] DB saving and Notification logics are skipped here
    // -------------------------------------------------------------
    console.log("Received inquiry:", data)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return c.json({ success: true, message: 'Inquiry received successfully' })
  } catch (error) {
    console.error("Error processing request:", error)
    return c.json({ success: false, message: 'Internal Server Error' }, 500)
  }
})

export default app
