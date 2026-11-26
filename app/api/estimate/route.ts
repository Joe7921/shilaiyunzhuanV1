import { assertSameOrigin, fail, HttpError, readJson, requireUser, uploadKey } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    requireUser(request);
    const body = await readJson(request);
    uploadKey(body.imageKey);
    // Do not send users' photographs to an external model until a provider and
    // credentials have been explicitly connected. No fabricated scan result.
    throw new HttpError(503, "AI识别尚未连接，请先手动填写食物与份量");
  } catch (error) { return fail(error); }
}
