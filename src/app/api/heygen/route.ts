import { NextResponse, type NextRequest } from "next/server";
import { db } from "~/server/db";

interface HeyGenWebhookBody {
    event_type: string,
    event_data: {
        video_id: string,
        url?: string
    }
}

export async function POST(req: NextRequest){
    try {
        const body: HeyGenWebhookBody = (await req.json()) as HeyGenWebhookBody;
        console.log("api/heygen recieved request: ", body);
        if(body.event_type !== "avatar_video.success") {
            console.log("api/heygen request failed...");
            return NextResponse.json({status: 400});
        }
        await db.videoScript.update({
            where: {
                heyGenVideoId: body.event_data.video_id
            },
            data: {
                videoUrl: body.event_data.url,
                updatedAt: new Date(),
            }
        });
        return NextResponse.json({status: 200});
    } catch(error){
        console.error('POST /api/heygen error:', error);
        return NextResponse.json({status: 400});
    }
}